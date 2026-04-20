/** Shared Lovelace config for Spotify Spotlight card + editor. */

export type CoverAlign = "left" | "center" | "right";

/** How to display temperature from `corner_temperature_entity`. */
export type CornerTemperatureUnit = "auto" | "celsius" | "fahrenheit";

/**
 * Vertical placement of the title / artist / progress block vs album art.
 * - Left/right layout: aligns text block to top, center, or bottom of the art row.
 * - Center layout: positions the block just under the art (top), centered in the gap
 *   between art and controls (center), or toward the controls (bottom).
 */
export type MetaVerticalAlign = "top" | "center" | "bottom";

export interface SpotifySpotlightCardConfig {
  type: string;
  entity: string;
  /** Fill dashboard panel height */
  tall?: boolean;
  /** Optional card title */
  name?: string;
  /** Show Spotify queue peek (needs custom integration queue attributes media_next_*) */
  show_up_next?: boolean;
  /** Album art alignment in the header row */
  cover_align?: CoverAlign;
  /**
   * Album cover size as % of the built-in art box (100 = default, 150 = half again as large).
   * Clamped 50–300 in the card.
   */
  cover_scale_percent?: number;
  /** Ask HA to refresh the player entity at most this often (seconds) while the card is visible */
  poll_interval_seconds?: number;
  /** Show button that opens Home Assistant’s Media browser panel for this entity */
  show_browse_media_button?: boolean;
  /** Show local time (top-left) */
  show_corner_time?: boolean;
  /** Include seconds in the displayed time (e.g. 12:34:56) */
  show_corner_seconds?: boolean;
  /** Show temperature from `corner_temperature_entity` (top-left) */
  show_corner_temperature?: boolean;
  /** `weather.*` (uses `temperature` attribute) or numeric `sensor` / `input_number` */
  corner_temperature_entity?: string;
  /** Display unit when showing temperature */
  corner_temperature_unit?: CornerTemperatureUnit;
  /**
   * Show the weather state name (e.g. "Partly cloudy") in the corner pane.
   * Uses `corner_weather_entity` if set, otherwise `corner_temperature_entity`
   * when that is a `weather.*` entity.
   */
  show_corner_weather?: boolean;
  /** Show the weather icon to the left of the time/temp block. */
  show_corner_weather_icon?: boolean;
  /**
   * Optional `weather.*` entity used for the state name and icon. If not set,
   * falls back to `corner_temperature_entity` when that is also `weather.*`.
   */
  corner_weather_entity?: string;
  /** Title / artist / progress placement vs art (default center) */
  meta_vertical_align?: MetaVerticalAlign;
  /**
   * Scale for now playing label, title, artist, and progress UI (100 = base size, 200 ≈ double).
   * Clamped 50–300 in the card.
   */
  text_scale_percent?: number;
  /** Larger touch targets for the source `<select>` (tablet-friendly) */
  source_tablet_mode?: boolean;
  /**
   * Scale for the “Up next” overlay (100 = default). Clamped 50–300.
   */
  up_next_scale_percent?: number;
  /**
   * Scale for the top-left time & temperature pane (100 = default). Clamped 50–300.
   */
  corner_climate_scale_percent?: number;
  /**
   * Blur radius (in CSS pixels) applied to the album-art backdrop. Clamped
   * 0–80; default 36.
   */
  background_blur_px?: number;
  /**
   * Opacity of the album-art backdrop layer in percent. Clamped 0–100;
   * default 100. Lowering it dims the artwork without changing the dark
   * scrim that keeps text readable.
   */
  background_opacity_percent?: number;
  /**
   * Absolute pixel distance from the top of the card to where the album art
   * starts. Completely independent of the 'up next' and corner-climate overlays.
   * 24 = natural default (matches the card's base padding).
   * Increase to push the album art lower. Clamped 0–400.
   */
  body_top_px?: number;
  /**
   * Kiosk / display-only mode optimised for a 1920×1080 full-screen panel.
   * When enabled:
   *   • All interactive controls (transport, volume, source, media-library)
   *     are hidden — the card becomes a pure "now playing" display.
   *   • The progress bar remains visible but is non-interactive.
   *   • The card fills the full viewport height (`100vh`).
   * Corner overlays (time/weather) and the "Up next" pane are unaffected and
   * can still be sized with their own scale options.
   */
  kiosk_mode?: boolean;
}
