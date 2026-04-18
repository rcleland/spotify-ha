# Spotify Spotlight

Home Assistant **Lovelace card** plus an optional **custom Spotify integration** (same domain as core) that adds queue metadata (`media_next_*`) for **Up next** and more reliable media browsing.

Repository layout matches what **[HACS](https://www.hacs.xyz/)** expects for **both**:

- **Integration** — installs `custom_components/spotify/`
- **Frontend** (Dashboard / legacy “plugin”) — installs the card bundle from [`dist/spotify-spotlight-card.js`](dist/spotify-spotlight-card.js)

Metadata lives in **[`hacs.json`](hacs.json)** (`name`, `filename`, minimum versions).

---

## Install with HACS

### A. Spotify integration (custom component)

1. **HACS → Integrations → ⋮ → Custom repositories**
2. Repository URL: `https://github.com/rcleland/spotify-ha`
3. **Category:** **Integration**
4. Add the repository, then **Download** / install **Spotify Spotlight**.
5. **Restart Home Assistant**
6. **Settings → Devices & services → Add integration → Spotify** (if not already configured).

### B. Lovelace card (Dashboard)

1. **HACS → Frontend → ⋮ → Custom repositories**
2. Same repository URL (you can register it again if needed).
3. **Category:** **Dashboard** (sometimes labeled **Plugin** in older docs).
4. Download / install so HACS copies **`dist/spotify-spotlight-card.js`** into your HA config.
5. **Settings → Dashboards → ⋮ → Resources** — confirm a **JavaScript module** resource exists for the card file (HACS usually registers it).
6. Add the card:

```yaml
type: custom:spotify-spotlight-card
entity: media_player.spotify_xxx
tall: true
```

**Tip:** Generate a **My Home Assistant** shortcut for opening this repo in HACS:  
[my.home-assistant.io → Create link → HACS repository](https://my.home-assistant.io/create-link/?redirect=hacs_repository).

---

## Manual install (without HACS)

| Piece | Location |
|-------|-----------|
| Integration | Copy [`custom_components/spotify/`](custom_components/spotify/) → `/config/custom_components/spotify/` |
| Card JS | Copy [`dist/spotify-spotlight-card.js`](dist/spotify-spotlight-card.js) → `/config/www/` and register as a module resource |

Details: [`custom_components/spotify/README.md`](custom_components/spotify/README.md) · [`spotify-spotlight-card/README.md`](spotify-spotlight-card/README.md).

---

## Maintainers: releases & `dist/`

HACS prefers **GitHub Releases**. After changing the card:

```bash
cd spotify-spotlight-card && npm run build && npm run sync-dist
```

Commit **`dist/spotify-spotlight-card.js`** at the repo root so Dashboard installs stay in sync.

CI runs [**hacs/action**](https://github.com/hacs/action) (integration) and **hassfest** on push/PR.

### GitHub repository settings (for green HACS / CI checks)

These live on GitHub (not in git) and are required by [**check-repository**](https://hacs.xyz/docs/publish/include/#check-repository):

- **Topics** — add at least one topic under **Settings → General**. Common choices: `home-assistant`, `hass`, `integration`, `spotify`, `lovelace`.
- **Description** — short one-line description on the repo main page.
- **Issues** — leave enabled (**Settings → General → Features**).

Brand artwork for the integration lives in [`custom_components/spotify/brand/`](custom_components/spotify/brand/) so [check-brands](https://hacs.xyz/docs/publish/include/#check-brands) passes without relying on the core `spotify` entry in [home-assistant/brands](https://github.com/home-assistant/brands).

---

## Contents

| Path | Purpose |
|------|---------|
| [`custom_components/spotify/`](custom_components/spotify/) | Custom integration · [`brand/`](custom_components/spotify/brand/) icons for HACS |
| [`spotify-spotlight-card/`](spotify-spotlight-card/) | Card source + nested build output |
| [`dist/spotify-spotlight-card.js`](dist/spotify-spotlight-card.js) | HACS-facing bundle (synced from the card build) |
