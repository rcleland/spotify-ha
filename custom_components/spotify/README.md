# Spotify (custom — Spotlight fork)

This is a **drop-in replacement** for the built-in Home Assistant **Spotify** integration (same `domain`: `spotify`). It adds features used by the **Spotify Spotlight** Lovelace card and improves reliability with recent Spotify Web API behavior.

## What changes vs core

- **Playback queue peek** — each coordinator update calls `GET /v1/me/player/queue` and exposes:
  - `media_next_title`
  - `media_next_artist`
  - `media_next_thumbnail`  
  on the `media_player` entity (for the card’s **Up next** widget).
- **Media browser** — resilient playlist and artist browsing (`browse_media`), including fallbacks when the upstream `spotifyaio` parser or API shape breaks.

## Install

1. Copy this entire folder to:

   `config/custom_components/spotify/`

   so you have e.g. `config/custom_components/spotify/manifest.json`.

2. **Restart Home Assistant** (full restart, not only reload).

3. **Settings → Devices & services → Integrations** — your existing Spotify entry should keep working. If HA still loads the core integration, clear **custom integration** cache: restart again or temporarily rename the integration and re-add (usually not needed).

4. Confirm **custom component** is loaded: **Developer tools → YAML → Info** (or logs at startup) — you should **not** see “Using core integration only” for Spotify if the override is active. With the same domain, the custom folder **should** override core.

## Requirements

Same as core: [Spotify integration docs](https://www.home-assistant.io/integrations/spotify), including Developer Application and OAuth via Application Credentials.

## Version

See `manifest.json` → `version`. Bump when you sync from upstream core.

## Syncing from Home Assistant core

This package is based on `homeassistant/components/spotify` from **core `dev`**, then patched. To merge newer core changes, diff against upstream and re-apply the modified files:

- `coordinator.py`
- `media_player.py`
- `browse_media.py`
