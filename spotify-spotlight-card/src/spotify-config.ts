/** Shared Lovelace config for Spotify Spotlight card + editor. */

export interface SpotifySpotlightCardConfig {
  type: string;
  entity: string;
  /** Fill dashboard panel height */
  tall?: boolean;
  /** Optional card title */
  name?: string;
  /** Max playlist chips to show */
  playlist_limit?: number;
  /** Show Spotify queue peek (needs integration attributes media_next_*) */
  show_up_next?: boolean;
}
