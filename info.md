Spotify Spotlight bundles:

- A **Lovelace card** (`spotify-spotlight-card`) — blurred artwork, transport, playlists, **Up next**
- A **custom Spotify integration** (`custom_components/spotify`) — queue attributes (`media_next_*`), hardened media browsing

## HACS → Integration install

Add **`https://github.com/rcleland/spotify-ha`** under **HACS → Integrations → Custom repositories** (category **Integration**) and download.

After you **finish configuring the Spotify integration**, Home Assistant registers the Spotlight card as a **Dashboard resource** automatically (**storage-mode** dashboards). Reload the frontend if the card picker does not show the module yet.

If you use **YAML-mode** Lovelace, add this under `resources` yourself:

```yaml
resources:
  - url: /spotify-spotlight-static/spotify-spotlight-card.js
    type: module
```

Then use `type: custom:spotify-spotlight-card` on a view.
