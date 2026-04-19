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
  /** Show temperature from `corner_temperature_entity` (top-left) */
  show_corner_temperature?: boolean;
  /** `weather.*` (uses `temperature` attribute) or numeric `sensor` / `input_number` */
  corner_temperature_entity?: string;
  /** Display unit when showing temperature */
  corner_temperature_unit?: CornerTemperatureUnit;
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
}
