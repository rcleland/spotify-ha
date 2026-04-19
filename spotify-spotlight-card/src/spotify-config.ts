/** Shared Lovelace config for Spotify Spotlight card + editor. */

export type CoverAlign = "left" | "center" | "right";

/** How to display temperature from `corner_temperature_entity`. */
export type CornerTemperatureUnit = "auto" | "celsius" | "fahrenheit";

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
}
