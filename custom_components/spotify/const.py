"""Define constants for the Spotify integration."""

import logging

from homeassistant.components.media_player import MediaType

DOMAIN = "spotify"

# hass.data key — register Lovelace module once per Home Assistant runtime
SPOTLIGHT_CARD_SETUP_FLAG = "spotify_spotlight_card_setup_done"

LOGGER = logging.getLogger(__package__)

SPOTIFY_SCOPES = [
    # Needed to be able to control playback
    "user-modify-playback-state",
    # Needed in order to read available devices
    "user-read-playback-state",
    # Needed to determine if the user has Spotify Premium
    "user-read-private",
    # Needed for media browsing
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-playback-position",
    "user-read-recently-played",
    "user-follow-read",
]

MEDIA_PLAYER_PREFIX = "spotify://"
MEDIA_TYPE_SHOW = "show"
MEDIA_TYPE_USER_SAVED_TRACKS = "current_user_saved_tracks"
# A track (or episode) that carries its playlist URI as context so playback
# continues through the playlist after the selected item finishes.
# Format of the media_content_id: "{playlist_uri}::{item_uri}"
MEDIA_TYPE_PLAYLIST_TRACK = "playlist_track"
# Separator used inside the composite MEDIA_TYPE_PLAYLIST_TRACK content ID.
PLAYLIST_TRACK_CTX_SEP = "::"

PLAYABLE_MEDIA_TYPES = [
    MediaType.PLAYLIST,
    MediaType.ALBUM,
    MediaType.ARTIST,
    MediaType.EPISODE,
    MEDIA_TYPE_SHOW,
    MediaType.TRACK,
    MEDIA_TYPE_USER_SAVED_TRACKS,
    MEDIA_TYPE_PLAYLIST_TRACK,
]
