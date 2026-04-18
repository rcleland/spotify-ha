# Spotify Spotlight

Home Assistant **Lovelace card** plus a **custom Spotify integration** (same domain as core) that adds queue metadata (`media_next_*`) for **Up next** and more reliable media browsing.

Add this repo in **HACS → Integrations** only (category **Integration**). The card JavaScript ships **inside** `custom_components/spotify/` and is **registered as a Lovelace module resource** when you complete Spotify setup (storage dashboards).

---

## Install with HACS

1. **HACS → Integrations → ⋮ → Custom repositories**
2. Repository URL: `https://github.com/rcleland/spotify-ha`
3. **Category:** **Integration**
4. Download / install **Spotify Spotlight**, then **restart Home Assistant**
5. **Settings → Devices & services → Add integration → Spotify** and finish OAuth

After the integration loads, check **Settings → Dashboards → ⋮ → Resources** — you should see **`/spotify-spotlight-static/spotify-spotlight-card.js`** (version query may be appended). Add the card:

```yaml
type: custom:spotify-spotlight-card
entity: media_player.spotify_xxx
tall: true
```

**YAML-mode Lovelace:** automatic registration does not run. Add the resource manually (see [`info.md`](info.md)).

**Tip:** [My Home Assistant → HACS repository shortcut](https://my.home-assistant.io/create-link/?redirect=hacs_repository).

---

## Manual install (without HACS)

| Piece | Location |
|-------|-----------|
| Integration | Copy [`custom_components/spotify/`](custom_components/spotify/) → `/config/custom_components/spotify/` |
| Card JS | Included under `custom_components/spotify/frontend/` — served at `/spotify-spotlight-static/spotify-spotlight-card.js` |

Details: [`custom_components/spotify/README.md`](custom_components/spotify/README.md) · [`spotify-spotlight-card/README.md`](spotify-spotlight-card/README.md).

---

## Maintainers: releases & `dist/`

### Version numbers in HACS

HACS shows the **short Git commit hash** until you publish proper **[GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)**. After that, it uses the **release tag** as the visible version.

1. Bump **`custom_components/spotify/manifest.json`** → **`version`** (semver).
2. Commit and push to **`main`**.
3. **Create a GitHub Release** with a matching tag (e.g. `v1.2.1`).

### Card bundle

After changing the card:

```bash
cd spotify-spotlight-card && npm run build && npm run sync-dist
```

**`npm run sync-dist`** copies the bundle to **`dist/`** and **`custom_components/spotify/frontend/`**. Commit both paths before tagging.

CI runs [**hacs/action**](https://github.com/hacs/action) for **integration** and **plugin**, plus **hassfest**.

### GitHub repository settings (for green HACS / CI checks)

- **Topics**, **description**, **Issues** — see [check-repository](https://hacs.xyz/docs/publish/include/#check-repository).

Brand artwork: [`custom_components/spotify/brand/`](custom_components/spotify/brand/).

---

## Contents

| Path | Purpose |
|------|---------|
| [`custom_components/spotify/`](custom_components/spotify/) | Integration + [`frontend/`](custom_components/spotify/frontend/) card bundle |
| [`spotify-spotlight-card/`](spotify-spotlight-card/) | Card source + nested build output |
| [`dist/spotify-spotlight-card.js`](dist/spotify-spotlight-card.js) | Synced copy of the built bundle |
