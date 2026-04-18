/** Shared Lovelace config for Spotify Spotlight card + editor. */

export type CoverAlign = "left" | "center" | "right";

export interface SpotifySpotlightCardConfig {
  type: string;
  entity: string;
  /** Fill dashboard panel height */
  tall?: boolean;
  /** Optional card title */
  name?: string;
  /** Max playlist chips to show */
  playlist_limit?: number;
  /** Show Spotify queue peek (needs custom integration queue attributes media_next_*) */
  show_up_next?: boolean;
  /** Show horizontal playlist chips (browse “Playlists”) */
  show_playlists?: boolean;
  /** Media library: Playlists, Artists, Albums, … (browse_media tree) */
  show_media_library?: boolean;
  /** Album art alignment in the header row */
  cover_align?: CoverAlign;
  /** Ask HA to refresh the player entity at most this often (seconds) while the card is visible */
  poll_interval_seconds?: number;
}
