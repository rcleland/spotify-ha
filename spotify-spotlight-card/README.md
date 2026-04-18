# Spotify Spotlight Card

Lovelace card for Home Assistant with a Spotify-focused layout: large artwork, blurred background, transport controls, volume, source picker, shuffle/repeat, and horizontal playlist chips loaded from your Spotify integration via the **`browse_media`** WebSocket API.

## Install

### Build (from this repo)

```bash
cd spotify-spotlight-card
npm install
npm run build
npm run sync-dist
```

The **`sync-dist`** step copies the bundle to the **repository root** `dist/` folder for **HACS (Dashboard)** installs.

Copy **`dist/spotify-spotlight-card.js`** (from `spotify-spotlight-card/dist/` or repo root `dist/`) to Home Assistant:

- **`/config/www/spotify-spotlight-card.js`** (rename if you like),  
  **or**
- Drop it into your custom Lovelace/HACS frontend folder.

### Register the module

**Settings → Dashboards → ⋮ → Resources → Add resource**

- **URL:** `/local/spotify-spotlight-card.js` (if you used `www/`)
- **Resource type:** JavaScript module

### Add the card

```yaml
type: custom:spotify-spotlight-card
entity: media_player.spotify_your_room
tall: true
name: Spotify
playlist_limit: 24
```

| Option | Description |
|--------|-------------|
| `entity` | **Required.** Your Spotify `media_player` entity. |
| `tall` | When `true`, uses a taller minimum height so the card fills more of a panel (good on a dedicated “music” dashboard). |
| `name` | Optional label above “Now playing”. |
| `playlist_limit` | Max playlist chips (default `24`). |
| `show_up_next` | Show **Up next** (bottom-right) when the media player exposes `media_next_title` / `media_next_artist` / `media_next_thumbnail` (default `true`). |

### Up next (queue peek)

The card reads attributes populated when the Spotify integration exposes queue metadata:

- `media_next_title`
- `media_next_artist`
- `media_next_thumbnail`

Install the companion **custom integration** from this repo (`custom_components/spotify/` → `/config/custom_components/spotify/`) so those attributes are filled from **`GET /v1/me/player/queue`**. See [`custom_components/spotify/README.md`](../custom_components/spotify/README.md). Without it, **Up next** stays empty unless another integration sets the same attributes.

### Full-screen style dashboard

1. Create a **Panel** view (single column, full width).
2. Add **one** card with this custom card and set **`tall: true`**.
3. Optionally use **card-mod** or **layout-card** to remove extra padding / stretch height to `100vh`.

Playlists are loaded from **Media Library → Playlists** for your configured Spotify account; use **refresh** if you add playlists in Spotify.

## Requirements

- Home Assistant with the **Spotify** integration and a working `media_player`.
- Standard Lovelace globals: **`ha-icon`** (included on dashboards).

## Development

```bash
npm run watch   # rebuild on save
```

The bundle is emitted as **`dist/spotify-spotlight-card.js`** (ES module).
