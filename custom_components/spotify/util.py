"""Utils for Spotify."""

from __future__ import annotations

import logging
from typing import Any

import importlib

import orjson
from spotifyaio import (
    BasePlaylist,
    Image,
    Playlist,
    SpotifyClient,
    SpotifyConnectionError,
    SpotifyNotFoundError,
)
import yarl

from .const import MEDIA_PLAYER_PREFIX

_LOGGER = logging.getLogger(__name__)


def _patch_playlist_dict_for_spotifyaio(obj: dict[str, Any]) -> None:
    """Ensure tracks.items exists so spotifyaio/mashumaro can deserialize.

    Spotify sometimes returns tracks as {href, total} only (no items array),
    which breaks Playlist / list responses — see Home Assistant core#167322.
    """
    tracks = obj.get("tracks")
    if tracks is None:
        obj["tracks"] = {"href": "", "total": 0, "items": []}
    elif isinstance(tracks, dict) and "items" not in tracks:
        tracks["items"] = []


async def async_get_playlist_resilient(
    client: SpotifyClient, playlist_uri: str
) -> Playlist | None:
    """Load a playlist; patch API JSON when strict models would fail."""
    try:
        return await client.get_playlist(playlist_uri)
    except SpotifyNotFoundError:
        _LOGGER.debug("Spotify playlist not found: %s", playlist_uri)
        return None
    except SpotifyConnectionError:
        raise
    except Exception:
        _LOGGER.debug(
            "spotifyaio get_playlist failed for %s; retrying with JSON patch",
            playlist_uri,
            exc_info=True,
        )
    identifier = playlist_uri.rsplit(":", maxsplit=1)[-1]
    try:
        raw = await client._get(
            f"v1/playlists/{identifier}",
            params={"additional_types": "track,episode"},
        )
        data = orjson.loads(raw)
        _patch_playlist_dict_for_spotifyaio(data)
        return Playlist.from_json(orjson.dumps(data).decode())
    except SpotifyNotFoundError:
        _LOGGER.debug("Spotify playlist not found after patch fetch: %s", playlist_uri)
        return None
    except SpotifyConnectionError:
        raise
    except Exception:
        _LOGGER.debug(
            "Could not load playlist after patch for %s", playlist_uri, exc_info=True
        )
        return None


async def async_get_playlists_for_current_user_resilient(
    client: SpotifyClient,
    *,
    limit: int = 48,
) -> list[BasePlaylist]:
    """List current-user playlists; patch JSON when spotifyaio rejects the response."""
    try:
        return await client.get_playlists_for_current_user()
    except SpotifyConnectionError:
        raise
    except Exception:
        _LOGGER.debug(
            "spotifyaio get_playlists_for_current_user failed; retrying with JSON patch",
            exc_info=True,
        )
    raw = await client._get("v1/me/playlists", params={"limit": limit})
    data = orjson.loads(raw)
    for item in data.get("items") or []:
        if isinstance(item, dict):
            _patch_playlist_dict_for_spotifyaio(item)

    playlist_models = importlib.import_module("spotifyaio.models.playlist")
    return playlist_models.PlaylistResponse.from_json(
        orjson.dumps(data).decode()
    ).items


def is_spotify_media_type(media_content_type: str) -> bool:
    """Return whether the media_content_type is a valid Spotify media_id."""
    return media_content_type.startswith(MEDIA_PLAYER_PREFIX)


def resolve_spotify_media_type(media_content_type: str) -> str:
    """Return actual spotify media_content_type."""
    return media_content_type.removeprefix(MEDIA_PLAYER_PREFIX)


def fetch_image_url(images: list[Image]) -> str | None:
    """Fetch image url."""
    if not images:
        return None
    return images[0].url


def spotify_uri_from_media_browser_url(media_content_id: str) -> str:
    """Extract spotify URI from media browser URL."""
    if media_content_id and media_content_id.startswith(MEDIA_PLAYER_PREFIX):
        parsed_url = yarl.URL(media_content_id)
        media_content_id = parsed_url.name
    return media_content_id
