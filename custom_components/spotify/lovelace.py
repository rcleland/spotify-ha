"""Register the Spotify Spotlight Lovelace card module (storage dashboards)."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.resources import ResourceYAMLCollection
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers.event import async_call_later

_LOGGER = logging.getLogger(__name__)

CARD_FILENAME = "spotify-spotlight-card.js"
STATIC_URL_BASE = "/spotify-spotlight-static"


def _integration_version() -> str:
    manifest = Path(__file__).parent / "manifest.json"
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
        return str(data.get("version", "0"))
    except (OSError, json.JSONDecodeError, TypeError):
        return "0"


def _resource_url(version: str) -> str:
    return f"{STATIC_URL_BASE}/{CARD_FILENAME}?v={version}"


async def async_register_spotify_spotlight_card(hass: HomeAssistant) -> None:
    """Serve the card bundle and add it to Lovelace resources when using storage mode."""
    frontend_dir = Path(__file__).parent / "frontend"
    js_path = frontend_dir / CARD_FILENAME
    if not js_path.is_file():
        _LOGGER.warning(
            "Spotify Spotlight card bundle missing at %s — rebuild and sync the card dist",
            js_path,
        )
        return

    try:
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    url_path=STATIC_URL_BASE,
                    path=str(frontend_dir),
                    cache_headers=False,
                )
            ]
        )
    except RuntimeError:
        _LOGGER.debug("Spotify Spotlight static path already registered")
    except Exception:
        _LOGGER.exception("Could not register Spotify Spotlight static path")
        return

    version = _integration_version()
    target_url = _resource_url(version)
    base_prefix = f"{STATIC_URL_BASE}/{CARD_FILENAME}"

    async def _try_register(_now: datetime | None = None) -> None:
        lovelace = hass.data.get("lovelace")
        if lovelace is None:
            async_call_later(hass, 5, _try_register)
            return

        resources = getattr(lovelace, "resources", None)
        if resources is None:
            async_call_later(hass, 5, _try_register)
            return

        if isinstance(resources, ResourceYAMLCollection):
            _LOGGER.info(
                "Lovelace YAML resources: add `url: %s` `type: module` to your resources list",
                target_url.split("?")[0],
            )
            return

        if hasattr(resources, "loaded") and not resources.loaded:
            async_call_later(hass, 2, _try_register)
            return

        try:
            items = resources.async_items()
        except Exception:  # noqa: BLE001
            async_call_later(hass, 5, _try_register)
            return

        existing_id: str | None = None
        for res in items:
            url: str | None = None
            rid: str | None = None
            if isinstance(res, dict):
                url = res.get("url")
                rid = res.get("id")
            else:
                url = getattr(res, "url", None)
                rid = getattr(res, "id", None)
            if isinstance(url, str) and url.split("?")[0].startswith(base_prefix):
                if isinstance(rid, str):
                    existing_id = rid
                break

        payload = {"res_type": "module", "url": target_url}

        try:
            if existing_id is not None:
                await resources.async_update_item(existing_id, {"url": target_url})
                _LOGGER.info("Updated Spotify Spotlight Lovelace resource")
                return
            await resources.async_create_item(payload)
            _LOGGER.info("Registered Spotify Spotlight Lovelace module resource")
        except Exception:
            _LOGGER.exception("Could not register Spotify Spotlight Lovelace resource")

    if hass.state is CoreState.running:
        async_call_later(hass, 3, _try_register)
        return

    async def _on_started(_event: Event) -> None:
        async_call_later(hass, 3, _try_register)

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _on_started)
