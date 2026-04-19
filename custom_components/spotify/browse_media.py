"""Support for Spotify media browsing."""

from __future__ import annotations

import base64
from enum import StrEnum
import logging
import time
from typing import TYPE_CHECKING, Any, TypedDict

import orjson
from spotifyaio import (
    Artist,
    BasePlaylist,
    SimplifiedAlbum,
    SimplifiedTrack,
    SpotifyClient,
    Track,
)
from spotifyaio.exceptions import SpotifyForbiddenError
from spotifyaio.models import Episode, ItemType, PlaylistTrack, SimplifiedEpisode
from spotifyaio.util import get_identifier
import yarl

from homeassistant.components.media_player import (
    BrowseError,
    BrowseMedia,
    MediaClass,
    MediaType,
)
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.config_entry_oauth2_flow import (
    async_get_config_entry_implementation,
)

from .const import (
    DOMAIN,
    MEDIA_PLAYER_PREFIX,
    MEDIA_TYPE_PLAYLIST_TRACK,
    MEDIA_TYPE_SHOW,
    MEDIA_TYPE_USER_SAVED_TRACKS,
    PLAYABLE_MEDIA_TYPES,
    PLAYLIST_TRACK_CTX_SEP,
)
from .util import (
    async_get_playlists_for_current_user_resilient,
    fetch_image_url,
)

# Module-level cache: token string + monotonic expiry time
_cc_token_cache: dict[str, tuple[str, float]] = {}

BROWSE_LIMIT = 48
# Spotify token endpoint
_SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
_SPOTIFY_API_BASE = "https://api.spotify.com"
# Hard cap on how many playlist tracks we page through for browsing.
# Spotify's API returns up to 100 items per page; 800 = ~17 pages.
_MAX_PLAYLIST_TRACKS_BROWSE = 800


_LOGGER = logging.getLogger(__name__)


async def _get_client_credentials_token(hass: HomeAssistant) -> str | None:
    """Return a cached Spotify client-credentials access token.

    The Client Credentials flow authenticates as the *app* (not a user) and
    is subject to different quota rules.  Specifically, it can read public
    playlist track items even when the user-scoped token cannot, because
    Spotify's 2026 developer-mode restrictions apply only to the Authorization
    Code flow (per-user tokens), not to app-level tokens.

    The token is cached for most of its 3600-second lifetime to avoid making
    an extra HTTPS round-trip on every playlist browse.
    """
    # Return cached token if still valid (with a 60-second safety margin).
    cached = _cc_token_cache.get(DOMAIN)
    if cached and time.monotonic() < cached[1] - 60:
        return cached[0]

    entries = hass.config_entries.async_entries(
        DOMAIN, include_disabled=False, include_ignore=False
    )
    if not entries:
        _LOGGER.warning(
            "CC token: no Spotify config entries found — cannot obtain token"
        )
        return None

    try:
        impl = await async_get_config_entry_implementation(hass, entries[0])
        client_id: str | None = getattr(impl, "client_id", None)
        client_secret: str | None = getattr(impl, "client_secret", None)
        if not client_id or not client_secret:
            _LOGGER.warning(
                "CC token: OAuth implementation (%s) does not expose "
                "client_id / client_secret — cannot obtain CC token. "
                "Ensure Spotify credentials are set in Application Credentials.",
                type(impl).__name__,
            )
            return None
        _LOGGER.debug(
            "CC token: obtained client_id=%s from implementation %s",
            client_id,
            type(impl).__name__,
        )
    except Exception:
        _LOGGER.warning(
            "CC token: could not retrieve OAuth implementation", exc_info=True
        )
        return None

    credentials = base64.b64encode(
        f"{client_id}:{client_secret}".encode()
    ).decode()
    session = async_get_clientsession(hass)
    try:
        async with session.post(
            _SPOTIFY_TOKEN_URL,
            data={"grant_type": "client_credentials"},
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                _LOGGER.warning(
                    "CC token: token request returned HTTP %d — %s",
                    resp.status,
                    body[:300],
                )
                return None
            payload = await resp.json()
            token: str | None = payload.get("access_token")
            expires_in: int = payload.get("expires_in", 3600)
            if token:
                _cc_token_cache[DOMAIN] = (token, time.monotonic() + expires_in)
                _LOGGER.debug(
                    "CC token: obtained successfully (expires_in=%d)", expires_in
                )
            else:
                _LOGGER.warning(
                    "CC token: response did not contain access_token — %s",
                    str(payload)[:300],
                )
            return token
    except Exception:
        _LOGGER.warning(
            "CC token: token request raised exception", exc_info=True
        )
        return None


async def _fetch_playlist_tracks_with_client_credentials(
    hass: HomeAssistant,
    media_content_id: str,
    *,
    market: str | None,
) -> list[ItemPayload]:
    """Fetch playlist track items using app-level client credentials.

    Used as a last resort when the user-scoped token cannot access track items
    for playlists not owned by the authenticated user.  The Client Credentials
    flow has different access rules and can read public playlists regardless of
    developer-mode quota restrictions.
    """
    _LOGGER.warning(
        "CC fetch: attempting client-credentials fetch for %s", media_content_id
    )
    token = await _get_client_credentials_token(hass)
    if not token:
        _LOGGER.warning(
            "CC fetch: could not obtain a client credentials token — public "
            "playlist tracks will not be available.  Check that the Spotify "
            "app's client_id and client_secret are configured in HA Application "
            "Credentials."
        )
        return []

    _LOGGER.warning(
        "CC fetch: token obtained; requesting /items for %s", media_content_id
    )
    identifier = get_identifier(media_content_id)
    session = async_get_clientsession(hass)
    headers = {"Authorization": f"Bearer {token}"}

    payloads: list[ItemPayload] = []
    offset = 0

    while offset < _MAX_PLAYLIST_TRACKS_BROWSE:
        params: dict[str, Any] = {
            "limit": BROWSE_LIMIT,
            "offset": offset,
            "additional_types": "track,episode",
        }
        if market:
            params["market"] = market

        try:
            async with session.get(
                f"{_SPOTIFY_API_BASE}/v1/playlists/{identifier}/items",
                params=params,
                headers=headers,
            ) as resp:
                if resp.status == 401:
                    # Token expired between cache check and request; clear so
                    # the next browse attempt fetches a fresh one.
                    _cc_token_cache.pop(DOMAIN, None)
                    _LOGGER.debug("Client credentials token expired mid-browse")
                    break
                if resp.status == 403:
                    _LOGGER.warning(
                        "Client credentials token also got 403 for playlist %s "
                        "— this playlist may require Extended Quota Mode or may "
                        "not be publicly accessible",
                        media_content_id,
                    )
                    break
                if resp.status != 200:
                    _LOGGER.warning(
                        "Unexpected HTTP %d for playlist %s (client credentials)",
                        resp.status,
                        media_content_id,
                    )
                    break
                raw = await resp.read()
        except Exception:
            _LOGGER.debug(
                "Client credentials request failed for %s",
                media_content_id,
                exc_info=True,
            )
            break

        try:
            parsed = orjson.loads(raw)
        except Exception:
            _LOGGER.debug("Could not parse CC response for %s", media_content_id)
            break

        chunk_items = parsed.get("items") or []
        if not chunk_items:
            _LOGGER.warning(
                "CC fetch: Spotify returned empty items for %s at offset %d "
                "(HTTP 200 but no tracks). Full response keys: %s. "
                "This may mean Spotify's dev-mode restrictions also apply to "
                "CC tokens for this playlist.",
                media_content_id,
                offset,
                list(parsed.keys()),
            )
            break

        _LOGGER.warning(
            "CC fetch: received %d raw rows at offset %d for %s",
            len(chunk_items),
            offset,
            media_content_id,
        )
        accepted = 0
        for row in chunk_items:
            if not isinstance(row, dict):
                continue
            pl = _playlist_api_row_to_payload(row)
            if pl:
                payloads.append(pl)
                accepted += 1

        _LOGGER.debug(
            "CC fetch playlist %s offset %d: %d/%d rows accepted",
            identifier,
            offset,
            accepted,
            len(chunk_items),
        )

        if len(chunk_items) < BROWSE_LIMIT:
            break
        offset += BROWSE_LIMIT

    _LOGGER.warning(
        "CC fetch: finished for %s — returning %d payloads",
        media_content_id,
        len(payloads),
    )
    return payloads


class ItemPayload(TypedDict):
    """TypedDict for item payload."""

    name: str
    type: str
    uri: str
    id: str | None
    thumbnail: str | None


def _get_artist_item_payload(artist: Artist) -> ItemPayload:
    return {
        "id": artist.artist_id,
        "name": artist.name,
        "type": MediaType.ARTIST,
        "uri": artist.uri,
        "thumbnail": fetch_image_url(artist.images),
    }


def _get_album_item_payload(album: SimplifiedAlbum) -> ItemPayload:
    return {
        "id": album.album_id,
        "name": album.name,
        "type": MediaType.ALBUM,
        "uri": album.uri,
        "thumbnail": fetch_image_url(album.images),
    }


def _get_playlist_item_payload(
    playlist: BasePlaylist,
    *,
    current_user_id: str | None = None,
) -> ItemPayload:
    name = playlist.name

    # Append "· by Owner" for playlists the current user doesn't own.
    owner = getattr(playlist, "owner", None)
    if owner is not None:
        owner_id: str | None = getattr(owner, "id", None)
        owner_display: str | None = (
            getattr(owner, "display_name", None) or owner_id
        )
        if owner_display and owner_id != current_user_id:
            name = f"{name} · by {owner_display}"

    return {
        "id": playlist.playlist_id,
        "name": name,
        "type": MediaType.PLAYLIST,
        "uri": playlist.uri,
        "thumbnail": fetch_image_url(playlist.images),
    }


def _get_track_item_payload(
    track: SimplifiedTrack, show_thumbnails: bool = True
) -> ItemPayload:
    return {
        "id": track.track_id,
        "name": track.name,
        "type": MediaType.TRACK,
        "uri": track.uri,
        "thumbnail": (
            fetch_image_url(track.album.images)
            if show_thumbnails and isinstance(track, Track)
            else None
        ),
    }


def _get_episode_item_payload(episode: SimplifiedEpisode) -> ItemPayload:
    return {
        "id": episode.episode_id,
        "name": episode.name,
        "type": MediaType.EPISODE,
        "uri": episode.uri,
        "thumbnail": fetch_image_url(episode.images),
    }


class BrowsableMedia(StrEnum):
    """Enum of browsable media."""

    CURRENT_USER_PLAYLISTS = "current_user_playlists"
    CURRENT_USER_FOLLOWED_ARTISTS = "current_user_followed_artists"
    CURRENT_USER_SAVED_ALBUMS = "current_user_saved_albums"
    CURRENT_USER_SAVED_TRACKS = MEDIA_TYPE_USER_SAVED_TRACKS
    CURRENT_USER_SAVED_SHOWS = "current_user_saved_shows"
    CURRENT_USER_RECENTLY_PLAYED = "current_user_recently_played"
    CURRENT_USER_TOP_ARTISTS = "current_user_top_artists"
    CURRENT_USER_TOP_TRACKS = "current_user_top_tracks"
    ARTIST_POPULAR_TRACKS = "artist_popular_tracks"
    ARTIST_ALBUM_LIST = "artist_album_list"


LIBRARY_MAP = {
    BrowsableMedia.CURRENT_USER_PLAYLISTS.value: "Playlists",
    BrowsableMedia.CURRENT_USER_FOLLOWED_ARTISTS.value: "Artists",
    BrowsableMedia.CURRENT_USER_SAVED_ALBUMS.value: "Albums",
    BrowsableMedia.CURRENT_USER_SAVED_TRACKS.value: "Liked songs",
    BrowsableMedia.CURRENT_USER_SAVED_SHOWS.value: "Podcasts",
    BrowsableMedia.CURRENT_USER_RECENTLY_PLAYED.value: "Recently played",
    BrowsableMedia.CURRENT_USER_TOP_ARTISTS.value: "Top Artists",
    BrowsableMedia.CURRENT_USER_TOP_TRACKS.value: "Top Tracks",
}

CONTENT_TYPE_MEDIA_CLASS: dict[str, Any] = {
    BrowsableMedia.CURRENT_USER_PLAYLISTS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.PLAYLIST,
    },
    BrowsableMedia.CURRENT_USER_FOLLOWED_ARTISTS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.ARTIST,
    },
    BrowsableMedia.CURRENT_USER_SAVED_ALBUMS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.ALBUM,
    },
    BrowsableMedia.CURRENT_USER_SAVED_TRACKS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.TRACK,
    },
    BrowsableMedia.CURRENT_USER_SAVED_SHOWS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.PODCAST,
    },
    BrowsableMedia.CURRENT_USER_RECENTLY_PLAYED.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.TRACK,
    },
    BrowsableMedia.CURRENT_USER_TOP_ARTISTS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.ARTIST,
    },
    BrowsableMedia.CURRENT_USER_TOP_TRACKS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.TRACK,
    },
    BrowsableMedia.ARTIST_POPULAR_TRACKS.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.TRACK,
    },
    BrowsableMedia.ARTIST_ALBUM_LIST.value: {
        "parent": MediaClass.DIRECTORY,
        "children": MediaClass.ALBUM,
    },
    MediaType.PLAYLIST: {
        "parent": MediaClass.PLAYLIST,
        "children": MediaClass.TRACK,
    },
    MEDIA_TYPE_PLAYLIST_TRACK: {
        "parent": MediaClass.TRACK,
        "children": None,
    },
    MediaType.ALBUM: {"parent": MediaClass.ALBUM, "children": MediaClass.TRACK},
    MediaType.ARTIST: {"parent": MediaClass.ARTIST, "children": MediaClass.DIRECTORY},
    MediaType.EPISODE: {"parent": MediaClass.EPISODE, "children": None},
    MEDIA_TYPE_SHOW: {"parent": MediaClass.PODCAST, "children": MediaClass.EPISODE},
    MediaType.TRACK: {"parent": MediaClass.TRACK, "children": None},
}


class MissingMediaInformation(BrowseError):
    """Missing media required information."""


class UnknownMediaType(BrowseError):
    """Unknown media type."""


def _normalize_spotify_media_id(media_content_id: str) -> str:
    """Extract spotify:... URI from browse URLs (spotify://<entry>/spotify:...).

    Entity browse calls :meth:`async_browse_media_internal` with entry-scoped URLs.
    Spotify Web API methods expect a normal Spotify URI or id.
    """
    if not media_content_id.startswith(MEDIA_PLAYER_PREFIX):
        return media_content_id
    try:
        parsed = yarl.URL(media_content_id)
    except ValueError:
        return media_content_id
    tail = parsed.path.lstrip("/")
    if tail.startswith("spotify:"):
        return tail
    return media_content_id


async def _get_artist_albums_resilient(
    spotify: SpotifyClient, media_content_id: str
) -> list[SimplifiedAlbum]:
    """Load albums; tolerate spotifyaio model mismatches and Spotify payload changes."""
    try:
        return await spotify.get_artist_albums(media_content_id)
    except Exception:
        _LOGGER.debug(
            "get_artist_albums failed for %s, trying raw API response",
            media_content_id,
            exc_info=True,
        )
    raw_get = getattr(spotify, "_get", None)
    if raw_get is None:
        return []
    identifier = get_identifier(media_content_id)
    try:
        raw = await raw_get(
            f"v1/artists/{identifier}/albums",
            params={"limit": BROWSE_LIMIT},
        )
    except Exception:
        _LOGGER.warning(
            "Could not fetch artist albums for %s", media_content_id, exc_info=True
        )
        return []
    albums: list[SimplifiedAlbum] = []
    for album_data in orjson.loads(raw).get("items") or []:
        try:
            albums.append(
                SimplifiedAlbum.from_json(orjson.dumps(album_data).decode())
            )
        except Exception:
            continue
    return albums


async def _get_current_user_id(spotify: SpotifyClient) -> str | None:
    """Return the authenticated user's Spotify ID (e.g. ``"rcleland"``).

    Tries the spotifyaio model first; falls back to parsing raw ``GET /me``
    JSON in case the model doesn't expose the ``id`` field.
    """
    try:
        profile = await spotify.get_current_user()
        uid = getattr(profile, "id", None)
        if isinstance(uid, str) and uid:
            return uid
    except Exception:
        pass
    raw_get = getattr(spotify, "_get", None)
    if raw_get is None:
        return None
    try:
        raw = await raw_get("v1/me")
        uid = orjson.loads(raw).get("id")
        return uid if isinstance(uid, str) and uid else None
    except Exception:
        _LOGGER.debug("Could not fetch current user id", exc_info=True)
        return None


async def _spotify_user_market(spotify: SpotifyClient) -> str | None:
    """ISO country code for market-aware API requests.

    The spotifyaio ``UserProfile`` model does not always expose ``country``
    (it's a Premium-only field in the Spotify API, and may be absent from the
    model definition).  We try the model first, then fall back to a raw
    ``GET /me`` call so we can read ``country`` directly from the JSON.
    """
    # Try the spotifyaio model first.
    try:
        profile = await spotify.get_current_user()
        country = getattr(profile, "country", None)
        if isinstance(country, str) and len(country) == 2:
            return country.upper()
    except Exception:
        pass

    # Fall back to parsing the raw /me JSON (avoids model field gaps).
    raw_get = getattr(spotify, "_get", None)
    if raw_get is None:
        return None
    try:
        raw = await raw_get("v1/me")
        country = orjson.loads(raw).get("country")
        if isinstance(country, str) and len(country) == 2:
            return country.upper()
    except Exception:
        _LOGGER.debug("Could not determine user market from /me", exc_info=True)
    return None


def _track_payload_from_raw_dict(track: dict[str, Any]) -> ItemPayload | None:
    uri = track.get("uri")
    name = track.get("name")
    if not isinstance(uri, str) or not isinstance(name, str):
        return None
    thumb: str | None = None
    album = track.get("album")
    if isinstance(album, dict):
        imgs = album.get("images") or []
        if imgs and isinstance(imgs[0], dict):
            thumb = imgs[0].get("url")
    tid = track.get("id")
    return {
        "id": tid if isinstance(tid, str) else None,
        "name": name,
        "type": MediaType.TRACK,
        "uri": uri,
        "thumbnail": thumb,
    }


def _episode_payload_from_raw_dict(episode: dict[str, Any]) -> ItemPayload | None:
    uri = episode.get("uri")
    name = episode.get("name")
    if not isinstance(uri, str) or not isinstance(name, str):
        return None
    thumb: str | None = None
    imgs = episode.get("images") or []
    if imgs and isinstance(imgs[0], dict):
        thumb = imgs[0].get("url")
    eid = episode.get("id")
    return {
        "id": eid if isinstance(eid, str) else None,
        "name": name,
        "type": MediaType.EPISODE,
        "uri": uri,
        "thumbnail": thumb,
    }


def _playlist_api_row_to_payload(row: dict[str, Any]) -> ItemPayload | None:
    """Parse one playlist-items row; fall back to loose dict mapping when models fail.

    The Spotify API uses "item" as the primary field (non-deprecated) and "track"
    as the legacy alias.  Prefer "item"; fall back to "track" for older responses.
    """
    if row.get("is_local"):
        return None
    # "item" is the current non-deprecated field; "track" is the deprecated alias.
    track = row.get("item") or row.get("track")
    if track is None:
        _LOGGER.debug("Playlist row skipped: track is null (region-restricted or removed)")
        return None
    if not isinstance(track, dict):
        _LOGGER.debug("Playlist row skipped: track field is not a dict (%s)", type(track))
        return None
    if track.get("is_local"):
        return None
    ttype = track.get("type")
    row_for_model = {**row, "track": track}
    try:
        pt = PlaylistTrack.from_json(orjson.dumps(row_for_model).decode())
        inner = pt.track
        if inner.type is ItemType.TRACK:
            if TYPE_CHECKING:
                assert isinstance(inner, Track)
            return _get_track_item_payload(inner)
        if inner.type is ItemType.EPISODE:
            if TYPE_CHECKING:
                assert isinstance(inner, Episode)
            return _get_episode_item_payload(inner)
    except Exception:
        pass
    if ttype == "episode":
        return _episode_payload_from_raw_dict(track)
    return _track_payload_from_raw_dict(track)


async def _fetch_playlist_rows_via_api(
    spotify: SpotifyClient,
    media_content_id: str,
    *,
    market: str | None,
) -> list[ItemPayload]:
    """Page through `/playlists/{id}/items` directly, with a relaxed row parser.

    The HA-bundled spotifyaio model for `PlaylistTrack` is strict: a single
    region-restricted row with ``track: null`` causes the whole page to drop.
    Non-owned (editorial / friends') playlists hit this constantly. Parsing
    each row independently with `_playlist_api_row_to_payload` keeps the
    playable rows.

    `market` is included only when we have a real ISO country code. The old
    `from_token` value was deprecated by Spotify and now causes 4xx silently.
    """
    raw_get = getattr(spotify, "_get", None)
    if raw_get is None:
        return []
    identifier = get_identifier(media_content_id)
    payloads: list[ItemPayload] = []
    offset = 0
    while offset < _MAX_PLAYLIST_TRACKS_BROWSE:
        params: dict[str, Any] = {
            "limit": BROWSE_LIMIT,
            "offset": offset,
            "additional_types": "track,episode",
        }
        if market:
            params["market"] = market
        try:
            raw = await raw_get(
                f"v1/playlists/{identifier}/items",
                params=params,
            )
        except SpotifyForbiddenError:
            # Spotify's 2026 API restrictions deny access to the /items
            # sub-endpoint for playlists not owned by the authenticated user.
            # Re-raise so the caller can try the embedded-tracks fallback.
            raise
        except Exception:
            _LOGGER.warning(
                "Playlist items request failed for %s at offset %s",
                media_content_id,
                offset,
                exc_info=True,
            )
            return payloads
        parsed = orjson.loads(raw)
        chunk_items = parsed.get("items") or []
        if not chunk_items:
            # Log the full response at DEBUG so the user can diagnose why
            # no items were returned (could be an error payload, an empty
            # playlist, or a Spotify API change).
            if parsed.get("error") or not isinstance(parsed.get("items"), list):
                _LOGGER.warning(
                    "Spotify returned unexpected response for %s at offset %s: %s",
                    media_content_id,
                    offset,
                    str(raw)[:400],
                )
            else:
                _LOGGER.debug(
                    "Spotify returned empty items page for %s at offset %s",
                    media_content_id,
                    offset,
                )
            break
        accepted = 0
        for row in chunk_items:
            if not isinstance(row, dict):
                continue
            pl = _playlist_api_row_to_payload(row)
            if pl:
                payloads.append(pl)
                accepted += 1
        _LOGGER.debug(
            "Playlist %s offset %s: %d/%d rows accepted",
            identifier,
            offset,
            accepted,
            len(chunk_items),
        )
        if len(chunk_items) < BROWSE_LIMIT:
            break
        offset += BROWSE_LIMIT
    return payloads


async def _load_playlist_track_payloads(
    spotify: SpotifyClient,
    media_content_id: str,
    hass: HomeAssistant | None = None,
) -> list[ItemPayload]:
    """Resolve playlist tracks for browsing.

    Always uses the paged ``GET /playlists/{id}/items`` endpoint with a
    tolerant per-row parser (``_playlist_api_row_to_payload``) that skips
    null / local-file rows instead of aborting on the first bad entry.
    A ``market`` parameter is sent so that Spotify substitutes / filters
    region-restricted tracks rather than returning ``track: null`` rows
    (which would otherwise be dropped and produce an empty result for
    editorial / non-owned playlists).  Falls back to ``"US"`` when the
    user's country cannot be determined.

    If the user-scoped token is blocked (403) or returns empty results,
    falls back to the Client Credentials flow (app-level token) which can
    read public playlists regardless of developer-mode quota restrictions.
    """
    market = await _spotify_user_market(spotify)
    if not market:
        _LOGGER.debug(
            "Could not determine user market for %s; falling back to US",
            media_content_id,
        )
        market = "US"

    try:
        payloads = await _fetch_playlist_rows_via_api(
            spotify, media_content_id, market=market
        )
    except SpotifyForbiddenError:
        # Spotify's 2026 API changes block the /items sub-endpoint for
        # non-owned playlists in developer-mode apps (403 Forbidden).
        _LOGGER.warning(
            "GET /playlists/%s/items returned 403 (SpotifyForbiddenError); "
            "trying embedded-tracks fallback then client credentials",
            media_content_id,
        )
        return await _fetch_tracks_embedded_in_playlist(
            spotify, media_content_id, market=market, hass=hass
        )

    if payloads:
        return payloads

    # Paged /items succeeded but returned nothing — playlist may genuinely
    # be empty, or the API returned tracks:null.  Try spotifyaio helper then
    # client credentials as a last resort.
    _LOGGER.warning(
        "Paged /items returned no payloads for %s (market=%s); "
        "trying spotifyaio get_playlist_items then client credentials",
        media_content_id,
        market,
    )
    try:
        rows = await spotify.get_playlist_items(media_content_id)
        result = _playlist_rows_to_payloads(rows)
        if result:
            return result
    except Exception:
        _LOGGER.warning(
            "get_playlist_items also failed for %s",
            media_content_id,
            exc_info=True,
        )

    # Both user-token paths failed — try client credentials for public playlists.
    if hass is not None:
        _LOGGER.warning(
            "User-token paths exhausted for %s; trying client credentials",
            media_content_id,
        )
        return await _fetch_playlist_tracks_with_client_credentials(
            hass, media_content_id, market=market
        )

    _LOGGER.warning(
        "No hass instance available for CC fallback — cannot load tracks "
        "for %s",
        media_content_id,
    )
    return []


def _playlist_rows_to_payloads(rows: list[PlaylistTrack]) -> list[ItemPayload]:
    """Map playlist API rows to browse payloads."""
    items: list[ItemPayload] = []
    for playlist_item in rows:
        inner = playlist_item.track
        if inner is None:
            continue
        if inner.type is ItemType.TRACK:
            if TYPE_CHECKING:
                assert isinstance(inner, Track)
            items.append(_get_track_item_payload(inner))
        elif inner.type is ItemType.EPISODE:
            if TYPE_CHECKING:
                assert isinstance(inner, Episode)
            items.append(_get_episode_item_payload(inner))
    return items


async def _fetch_tracks_embedded_in_playlist(
    spotify: SpotifyClient,
    media_content_id: str,
    *,
    market: str | None,
    hass: HomeAssistant | None = None,
) -> list[ItemPayload]:
    """Fetch tracks from ``GET /v1/playlists/{id}`` (full object, no /items sub-path).

    Spotify's 2026 API changes blocked ``/playlists/{id}/items`` (403) for
    non-owned playlists in developer-mode apps.  We request the full playlist
    object **without** a ``fields`` filter so Spotify's backend doesn't see an
    explicit track-items request, which appears to trigger the same restriction
    as the dedicated ``/items`` endpoint.

    Limited to the first page (~100 tracks) returned in the ``tracks`` field of
    the playlist object.  The ``next`` pagination cursor points back to the
    forbidden ``/items`` endpoint so we cannot paginate further.
    """
    raw_get = getattr(spotify, "_get", None)
    if raw_get is None:
        return []
    identifier = get_identifier(media_content_id)

    # No ``fields`` filter — let Spotify return the full playlist object.
    # Requesting ``fields=tracks.items(...)`` explicitly appears to trigger the
    # same access restriction as GET /playlists/{id}/items for non-owned playlists.
    params: dict[str, Any] = {}
    if market:
        params["market"] = market

    try:
        raw = await raw_get(f"v1/playlists/{identifier}", params=params)
    except Exception:
        _LOGGER.warning(
            "Playlist full-object fetch failed for %s — Spotify may be blocking "
            "all track access for non-owned playlists in developer-mode apps. "
            "Getting the app approved for Extended Quota Mode is the only "
            "permanent fix.",
            media_content_id,
            exc_info=True,
        )
        return []

    try:
        data = orjson.loads(raw)
    except Exception:
        _LOGGER.warning(
            "Could not parse playlist response for %s", media_content_id
        )
        return []

    # Spotify renamed the embedded track block from "tracks" to "items" in their
    # 2026 API update.  Try the new name first, fall back to the old one so this
    # code keeps working against both old and new response shapes.
    # IMPORTANT: per Spotify docs, this field is only present for playlists
    # *owned by the current user or where the user is a collaborator*. For all
    # other playlists (editorial, friends') the field is simply absent.
    tracks_block = data.get("items") or data.get("tracks") or {}
    items = tracks_block.get("items") or []

    if not items:
        _LOGGER.warning(
            "Playlist %s full-object returned no embedded track items "
            "(block keys: %s) — Spotify only provides this field for owned/"
            "collaborative playlists; trying client credentials for public access",
            media_content_id,
            list(tracks_block.keys()) if isinstance(tracks_block, dict) else tracks_block,
        )
        if hass is not None:
            return await _fetch_playlist_tracks_with_client_credentials(
                hass, media_content_id, market=market
            )
        _LOGGER.warning(
            "No hass available for CC fallback after embedded-tracks returned "
            "nothing for %s",
            media_content_id,
        )
        return []

    payloads: list[ItemPayload] = []
    for row in items:
        if not isinstance(row, dict):
            continue
        # "item" is the current non-deprecated field; "track" is the legacy alias.
        track = row.get("item") or row.get("track")
        if not isinstance(track, dict) or track.get("is_local"):
            continue
        pl = _track_payload_from_raw_dict(track)
        if pl:
            payloads.append(pl)

    _LOGGER.debug(
        "Embedded-tracks fallback for %s: %d/%d rows produced payloads",
        identifier,
        len(payloads),
        len(items),
    )
    return payloads


async def _fetch_playlist_metadata(
    spotify: SpotifyClient,
    media_content_id: str,
    *,
    current_user_id: str | None = None,
) -> tuple[str | None, str | None]:
    """Return (display_title, image_url) for a playlist without touching track models.

    Uses ``fields=name,images,owner`` so Spotify never includes embedded track
    items in the response — the strict ``Playlist.from_json()`` model (which
    chokes on newer track payloads) is therefore never invoked.

    ``display_title`` includes ``· by {owner}`` for playlists not owned by
    ``current_user_id``, mirroring the attribution shown in the playlist list.
    """
    raw_get = getattr(spotify, "_get", None)
    if raw_get is None:
        return None, None
    identifier = get_identifier(media_content_id)
    try:
        raw = await raw_get(
            f"v1/playlists/{identifier}",
            params={"fields": "name,images,owner"},
        )
        data = orjson.loads(raw)
        name = data.get("name")
        images = data.get("images") or []
        image_url: str | None = None
        if images and isinstance(images[0], dict):
            image_url = images[0].get("url")
        if isinstance(name, str) and name:
            owner = data.get("owner") or {}
            owner_id: str | None = owner.get("id")
            owner_name: str | None = owner.get("display_name") or owner_id
            if owner_name and owner_id != current_user_id:
                name = f"{name} · by {owner_name}"
        return (name if isinstance(name, str) and name else None, image_url)
    except Exception:
        _LOGGER.debug(
            "Could not fetch playlist metadata for %s", media_content_id, exc_info=True
        )
        return None, None


async def _browse_playlist_tracks(
    spotify: SpotifyClient,
    media_content_id: str,
    hass: HomeAssistant | None = None,
) -> tuple[str | None, str | None, list[ItemPayload]]:
    """Resolve playlist title, artwork, and track list.

    Metadata (name + artwork) comes from a lightweight
    ``fields=name,images`` request that never touches the track model, so it
    works for both owned and non-owned playlists regardless of the spotifyaio
    model version.  Tracks are fetched separately via the paged
    ``/items`` endpoint with a tolerant per-row parser.
    """
    # Fetch user ID once; share it between metadata (for owner attribution)
    # and track loading (for market resolution — both call /me internally,
    # but the OS TCP stack will likely serve the second from cache).
    current_user_id = await _get_current_user_id(spotify)
    title, image = await _fetch_playlist_metadata(
        spotify, media_content_id, current_user_id=current_user_id
    )
    payloads = await _load_playlist_track_payloads(
        spotify, media_content_id, hass=hass
    )
    return title, image, payloads


async def _get_artist_top_track_payloads(
    spotify: SpotifyClient, artist_uri: str
) -> list[ItemPayload]:
    """Artist top tracks (requires market)."""
    market = await _spotify_user_market(spotify)
    if not market:
        market = "US"
    raw_get = getattr(spotify, "_get", None)
    if raw_get is None:
        return []
    identifier = get_identifier(artist_uri)
    try:
        raw = await raw_get(
            f"v1/artists/{identifier}/top-tracks",
            params={"market": market},
        )
    except Exception:
        _LOGGER.warning(
            "Could not load artist top tracks for %s", artist_uri, exc_info=True
        )
        return []
    items: list[ItemPayload] = []
    for track_data in orjson.loads(raw).get("tracks") or []:
        if not isinstance(track_data, dict):
            continue
        try:
            track = Track.from_json(orjson.dumps(track_data).decode())
            items.append(_get_track_item_payload(track))
        except Exception:
            pl = _track_payload_from_raw_dict(track_data)
            if pl:
                items.append(pl)
    return items


async def async_browse_media(
    hass: HomeAssistant,
    media_content_type: str | None,
    media_content_id: str | None,
    *,
    can_play_artist: bool = True,
) -> BrowseMedia:
    """Browse Spotify media."""
    parsed_url = None

    # Check if caller is requesting the root nodes
    if media_content_type is None and media_content_id is None:
        config_entries = hass.config_entries.async_entries(
            DOMAIN, include_disabled=False, include_ignore=False
        )
        children = [
            BrowseMedia(
                title=config_entry.title,
                media_class=MediaClass.APP,
                media_content_id=f"{MEDIA_PLAYER_PREFIX}{config_entry.entry_id}",
                media_content_type=f"{MEDIA_PLAYER_PREFIX}library",
                thumbnail="/api/brands/integration/spotify/logo.png",
                can_play=False,
                can_expand=True,
            )
            for config_entry in config_entries
        ]
        return BrowseMedia(
            title="Spotify",
            media_class=MediaClass.APP,
            media_content_id=MEDIA_PLAYER_PREFIX,
            media_content_type="spotify",
            thumbnail="/api/brands/integration/spotify/logo.png",
            can_play=False,
            can_expand=True,
            children=children,
        )

    if media_content_id is None or not media_content_id.startswith(MEDIA_PLAYER_PREFIX):
        raise BrowseError("Invalid Spotify URL specified")

    # The config entry id is the host name of the URL, the Spotify URI is the name
    parsed_url = yarl.URL(media_content_id)
    config_entry_id = parsed_url.host

    if (
        config_entry_id is None
        # config entry ids can be upper or lower case. Yarl always returns host
        # names in lower case, so we need to look for the config entry in both
        or (
            entry := hass.config_entries.async_get_entry(config_entry_id)
            or hass.config_entries.async_get_entry(config_entry_id.upper())
        )
        is None
        or entry.state is not ConfigEntryState.LOADED
    ):
        raise BrowseError("Invalid Spotify account specified")
    media_content_id = parsed_url.name
    info = entry.runtime_data

    result = await async_browse_media_internal(
        hass,
        info.coordinator.client,
        media_content_type,
        media_content_id,
        can_play_artist=can_play_artist,
    )

    # Build new URLs with config entry specifiers
    result.media_content_id = str(parsed_url.with_name(result.media_content_id))
    if result.children:
        for child in result.children:
            child.media_content_id = str(parsed_url.with_name(child.media_content_id))
    return result


async def async_browse_media_internal(
    hass: HomeAssistant,
    spotify: SpotifyClient,
    media_content_type: str | None,
    media_content_id: str | None,
    *,
    can_play_artist: bool = True,
) -> BrowseMedia:
    """Browse spotify media."""
    if media_content_type in (None, f"{MEDIA_PLAYER_PREFIX}library"):
        return await library_payload(can_play_artist=can_play_artist)

    # Strip prefix
    if media_content_type:
        media_content_type = media_content_type.removeprefix(MEDIA_PLAYER_PREFIX)

    if media_content_id:
        media_content_id = _normalize_spotify_media_id(media_content_id)

    payload = {
        "media_content_type": media_content_type,
        "media_content_id": media_content_id,
    }
    response = await build_item_response(
        spotify,
        payload,
        can_play_artist=can_play_artist,
        hass=hass,
    )
    if response is None:
        raise BrowseError(f"Media not found: {media_content_type} / {media_content_id}")
    return response


async def build_item_response(  # noqa: C901
    spotify: SpotifyClient,
    payload: dict[str, str | None],
    *,
    can_play_artist: bool,
    hass: HomeAssistant | None = None,
) -> BrowseMedia | None:
    """Create response payload for the provided media query."""
    media_content_type = payload["media_content_type"]
    media_content_id = payload["media_content_id"]

    if media_content_type is None or media_content_id is None:
        return None

    title: str | None = None
    image: str | None = None
    items: list[ItemPayload] = []

    if media_content_type == BrowsableMedia.CURRENT_USER_PLAYLISTS:
        current_user_id = await _get_current_user_id(spotify)
        if playlists := await async_get_playlists_for_current_user_resilient(spotify):
            items = [
                _get_playlist_item_payload(playlist, current_user_id=current_user_id)
                for playlist in playlists
            ]
    elif media_content_type == BrowsableMedia.CURRENT_USER_FOLLOWED_ARTISTS:
        if artists := await spotify.get_followed_artists():
            items = [_get_artist_item_payload(artist) for artist in artists]
    elif media_content_type == BrowsableMedia.CURRENT_USER_SAVED_ALBUMS:
        if saved_albums := await spotify.get_saved_albums():
            items = [
                _get_album_item_payload(saved_album.album)
                for saved_album in saved_albums
            ]
    elif media_content_type == BrowsableMedia.CURRENT_USER_SAVED_TRACKS:
        title = LIBRARY_MAP.get(media_content_type)
        if saved_tracks := await spotify.get_saved_tracks():
            items = [
                _get_track_item_payload(saved_track.track)
                for saved_track in saved_tracks
            ]
    elif media_content_type == BrowsableMedia.CURRENT_USER_SAVED_SHOWS:
        if saved_shows := await spotify.get_saved_shows():
            items = [
                {
                    "id": saved_show.show.show_id,
                    "name": saved_show.show.name,
                    "type": MEDIA_TYPE_SHOW,
                    "uri": saved_show.show.uri,
                    "thumbnail": fetch_image_url(saved_show.show.images),
                }
                for saved_show in saved_shows
            ]
    elif media_content_type == BrowsableMedia.CURRENT_USER_RECENTLY_PLAYED:
        if recently_played_tracks := await spotify.get_recently_played_tracks():
            items = [
                _get_track_item_payload(item.track) for item in recently_played_tracks
            ]
    elif media_content_type == BrowsableMedia.CURRENT_USER_TOP_ARTISTS:
        if top_artists := await spotify.get_top_artists():
            items = [_get_artist_item_payload(artist) for artist in top_artists]
    elif media_content_type == BrowsableMedia.CURRENT_USER_TOP_TRACKS:
        if top_tracks := await spotify.get_top_tracks():
            items = [_get_track_item_payload(track) for track in top_tracks]
    elif media_content_type == MediaType.PLAYLIST:
        title, image, items = await _browse_playlist_tracks(
            spotify, media_content_id, hass=hass
        )
        if title is None and items:
            title = "Playlist"
        # Rewrite each track/episode item so its media_content_id encodes the
        # playlist URI alongside the track URI.  async_play_media splits this
        # to call start_playback(context_uri=playlist, uri_offset=track) so
        # the whole playlist continues after the selected track finishes.
        items = [
            {
                **item,
                "uri": f"{media_content_id}{PLAYLIST_TRACK_CTX_SEP}{item['uri']}",
                "type": MEDIA_TYPE_PLAYLIST_TRACK,
            }
            if item["type"] in (MediaType.TRACK, MediaType.EPISODE)
            else item
            for item in items
        ]
    elif media_content_type == MediaType.ALBUM:
        if album := await spotify.get_album(media_content_id):
            title = album.name
            image = album.images[0].url if album.images else None
            items = [
                _get_track_item_payload(track, show_thumbnails=False)
                for track in album.tracks
            ]
    elif media_content_type == BrowsableMedia.ARTIST_POPULAR_TRACKS.value:
        title = "Popular tracks"
        items = await _get_artist_top_track_payloads(spotify, media_content_id)
    elif media_content_type == BrowsableMedia.ARTIST_ALBUM_LIST.value:
        title = "Albums"
        artist_albums = await _get_artist_albums_resilient(spotify, media_content_id)
        items = [_get_album_item_payload(album) for album in artist_albums]
    elif media_content_type == MediaType.ARTIST:
        artist = await spotify.get_artist(media_content_id)
        if not artist:
            return None
        title = artist.name
        image = artist.images[0].url if artist.images else None
        items = [
            {
                "name": "Popular tracks",
                "type": BrowsableMedia.ARTIST_POPULAR_TRACKS.value,
                "uri": media_content_id,
                "id": artist.artist_id,
                "thumbnail": None,
            },
            {
                "name": "Albums",
                "type": BrowsableMedia.ARTIST_ALBUM_LIST.value,
                "uri": media_content_id,
                "id": artist.artist_id,
                "thumbnail": None,
            },
        ]
    elif media_content_type == MEDIA_TYPE_SHOW:
        if (show_episodes := await spotify.get_show_episodes(media_content_id)) and (
            show := await spotify.get_show(media_content_id)
        ):
            title = show.name
            image = show.images[0].url if show.images else None
            items = [_get_episode_item_payload(episode) for episode in show_episodes]

    try:
        media_class = CONTENT_TYPE_MEDIA_CLASS[media_content_type]
    except KeyError:
        _LOGGER.debug("Unknown media type received: %s", media_content_type)
        return None

    if title is None:
        title = LIBRARY_MAP.get(media_content_id, "Unknown")

    can_play = media_content_type in PLAYABLE_MEDIA_TYPES and (
        media_content_type != MediaType.ARTIST or can_play_artist
    )

    if TYPE_CHECKING:
        assert title
    browse_media = BrowseMedia(
        can_expand=True,
        can_play=can_play,
        children_media_class=media_class["children"],
        media_class=media_class["parent"],
        media_content_id=media_content_id,
        media_content_type=f"{MEDIA_PLAYER_PREFIX}{media_content_type}",
        thumbnail=image,
        title=title,
    )

    browse_media.children = []
    for item in items:
        try:
            browse_media.children.append(
                item_payload(item, can_play_artist=can_play_artist)
            )
        except (MissingMediaInformation, UnknownMediaType):
            continue

    return browse_media


def item_payload(item: ItemPayload, *, can_play_artist: bool) -> BrowseMedia:
    """Create response payload for a single media item.

    Used by async_browse_media.
    """
    media_type = item["type"]
    media_id = item["uri"]

    try:
        media_class = CONTENT_TYPE_MEDIA_CLASS[media_type]
    except KeyError as err:
        _LOGGER.debug("Unknown media type received: %s", media_type)
        raise UnknownMediaType from err

    can_expand = media_type not in [
        MediaType.TRACK,
        MediaType.EPISODE,
        MEDIA_TYPE_PLAYLIST_TRACK,
    ]

    can_play = (
        media_type in PLAYABLE_MEDIA_TYPES
        and (media_type != MediaType.ARTIST or can_play_artist)
        and media_type != BrowsableMedia.CURRENT_USER_SAVED_TRACKS
    )

    return BrowseMedia(
        can_expand=can_expand,
        can_play=can_play,
        children_media_class=media_class["children"],
        media_class=media_class["parent"],
        media_content_id=media_id,
        media_content_type=f"{MEDIA_PLAYER_PREFIX}{media_type}",
        title=item["name"],
        thumbnail=item["thumbnail"],
    )


async def library_payload(*, can_play_artist: bool) -> BrowseMedia:
    """Create response payload to describe contents of a specific library.

    Used by async_browse_media.
    """
    browse_media = BrowseMedia(
        can_expand=True,
        can_play=False,
        children_media_class=MediaClass.DIRECTORY,
        media_class=MediaClass.DIRECTORY,
        media_content_id="library",
        media_content_type=f"{MEDIA_PLAYER_PREFIX}library",
        title="Media Library",
    )

    browse_media.children = []
    for item_type, item_name in LIBRARY_MAP.items():
        browse_media.children.append(
            item_payload(
                {
                    "name": item_name,
                    "type": item_type,
                    "uri": item_type,
                    "id": None,
                    "thumbnail": None,
                },
                can_play_artist=can_play_artist,
            )
        )
    return browse_media
