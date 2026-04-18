/**
 * Lovelace visual editor — entity picker and card options.
 */
import { css, html, LitElement, type CSSResultGroup, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { CoverAlign, SpotifySpotlightCardConfig } from "./spotify-config";

/** Minimal `hass` shape for `ha-entity-picker`. */
export interface HomeAssistantStub {
  states: Record<string, unknown>;
}

const COVER_OPTIONS: { value: CoverAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

@customElement("spotify-spotlight-card-editor")
export class SpotifySpotlightCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistantStub;

  @property({ type: Object }) private _config: Partial<SpotifySpotlightCardConfig> = {};

  static styles: CSSResultGroup = css`
    .card-config {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    ha-formfield {
      display: flex;
      align-items: center;
      --ha-formfield-row-gap: 8px;
    }
    ha-textfield {
      width: 100%;
    }
    select.field {
      width: 100%;
      padding: 12px 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    .hint {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      margin: -8px 0 0;
    }
    .field-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color);
      margin-bottom: 6px;
    }
  `;

  setConfig(config: SpotifySpotlightCardConfig): void {
    this._config = { ...config };
    this.requestUpdate();
  }

  protected render(): TemplateResult {
    if (!this.hass) {
      return html`<div class="card-config">Loading…</div>`;
    }

    const pl =
      this._config.playlist_limit !== undefined &&
      Number.isFinite(this._config.playlist_limit)
        ? String(this._config.playlist_limit)
        : "24";

    const poll =
      typeof this._config.poll_interval_seconds === "number" &&
      Number.isFinite(this._config.poll_interval_seconds)
        ? String(this._config.poll_interval_seconds)
        : "5";

    const align: CoverAlign = this._config.cover_align ?? "center";

    return html`
      <div class="card-config">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity ?? ""}
          .label=${"Spotify media_player"}
          .includeDomains=${["media_player"]}
          allow-custom-entity
          @value-changed=${this._entityChanged}
        ></ha-entity-picker>
        <p class="hint">
          Pick your Spotify Connect <strong>media_player</strong>. If this list is
          empty, wait for states to load or pick an entity ID manually.
        </p>

        <ha-textfield
          label="Card title (optional)"
          .value=${this._config.name ?? ""}
          @input=${this._nameChanged}
        ></ha-textfield>

        <div>
          <div class="field-label">Album cover position</div>
          <select
            class="field"
            .value=${align}
            @change=${this._coverAlignChanged}
          >
            ${COVER_OPTIONS.map(
              (o) =>
                html`<option value=${o.value} .selected=${align === o.value}>
                  ${o.label}
                </option>`,
            )}
          </select>
        </div>

        <ha-textfield
          label="Max playlist chips"
          type="number"
          inputMode="numeric"
          min="1"
          max="500"
          .value=${pl}
          @input=${this._playlistLimitChanged}
        ></ha-textfield>

        <ha-textfield
          label="Refresh interval (seconds)"
          type="number"
          inputMode="numeric"
          min="2"
          max="120"
          .value=${poll}
          @input=${this._pollChanged}
        ></ha-textfield>
        <p class="hint">
          How often to ask Home Assistant to refresh this player (position, title, …).
        </p>

        <ha-formfield label="Tall layout (fill panel height)">
          <ha-switch
            .checked=${this._config.tall !== false}
            @change=${this._tallChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show playlist chips">
          <ha-switch
            .checked=${this._config.show_playlists !== false}
            @change=${this._showPlaylistsChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show media library (Playlists, Artists, Albums, …)">
          <ha-switch
            .checked=${this._config.show_media_library !== false}
            @change=${this._showLibraryChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show “Up next” (custom integration queue attributes)">
          <ha-switch
            .checked=${this._config.show_up_next !== false}
            @change=${this._upNextChanged}
          ></ha-switch>
        </ha-formfield>
      </div>
    `;
  }

  private _fire(config: SpotifySpotlightCardConfig): void {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config },
      }),
    );
  }

  /** Normalize partial editor state into a full card config (YAML-safe). */
  private _normalized(): SpotifySpotlightCardConfig {
    const c = this._config;
    const pollRaw = c.poll_interval_seconds;
    let poll_interval_seconds = 5;
    if (
      typeof pollRaw === "number" &&
      Number.isFinite(pollRaw) &&
      pollRaw >= 2 &&
      pollRaw <= 120
    ) {
      poll_interval_seconds = Math.floor(pollRaw);
    }

    return {
      type: "custom:spotify-spotlight-card",
      entity: typeof c.entity === "string" ? c.entity : "",
      tall: c.tall !== false,
      name: typeof c.name === "string" && c.name.trim() ? c.name.trim() : undefined,
      playlist_limit:
        typeof c.playlist_limit === "number" &&
        Number.isFinite(c.playlist_limit) &&
        c.playlist_limit >= 1
          ? Math.min(500, Math.floor(c.playlist_limit))
          : undefined,
      show_up_next: c.show_up_next !== false,
      show_playlists: c.show_playlists !== false,
      show_media_library: c.show_media_library !== false,
      cover_align:
        c.cover_align === "left" ||
        c.cover_align === "center" ||
        c.cover_align === "right"
          ? c.cover_align
          : "center",
      poll_interval_seconds,
    };
  }

  private _merge(partial: Partial<SpotifySpotlightCardConfig>): void {
    this._config = { ...this._config, ...partial };
    const full = this._normalized();
    this._config = full;
    this._fire(full);
  }

  private _entityChanged(ev: CustomEvent<{ value?: string }>): void {
    ev.stopPropagation();
    const raw = ev.detail?.value;
    const entity = typeof raw === "string" ? raw : "";
    this._merge({ entity });
  }

  private _nameChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const name = t.value.trim();
    this._merge({ name: name.length ? name : undefined });
  }

  private _coverAlignChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLSelectElement;
    const v = t.value as CoverAlign;
    this._merge({
      cover_align:
        v === "left" || v === "center" || v === "right" ? v : "center",
    });
  }

  private _playlistLimitChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n) || n < 1) {
      this._merge({ playlist_limit: undefined });
      return;
    }
    this._merge({ playlist_limit: Math.min(500, n) });
  }

  private _pollChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n) || n < 2) {
      this._merge({ poll_interval_seconds: 5 });
      return;
    }
    this._merge({ poll_interval_seconds: Math.min(120, n) });
  }

  private _tallChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ tall: el.checked });
  }

  private _showPlaylistsChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_playlists: el.checked });
  }

  private _showLibraryChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_media_library: el.checked });
  }

  private _upNextChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_up_next: el.checked });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "spotify-spotlight-card-editor": SpotifySpotlightCardEditor;
  }
}
