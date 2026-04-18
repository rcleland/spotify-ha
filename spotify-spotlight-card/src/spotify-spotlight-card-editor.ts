/**
 * Lovelace visual editor — entity picker and card options.
 */
import { css, html, LitElement, type CSSResultGroup, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { SpotifySpotlightCardConfig } from "./spotify-config";

/** Minimal `hass` shape for `ha-entity-picker`. */
export interface HomeAssistantStub {
  states: Record<string, unknown>;
}

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
    .hint {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      margin: -8px 0 0;
    }
  `;

  setConfig(config: SpotifySpotlightCardConfig): void {
    this._config = { ...config };
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

    return html`
      <div class="card-config">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity ?? ""}
          .label=${"Spotify media player"}
          .includeDomains=${["media_player"]}
          allow-custom-entity
          @value-changed=${this._entityChanged}
        ></ha-entity-picker>
        <p class="hint">
          Choose the Spotify Connect <strong>media_player</strong> entity from this
          integration.
        </p>

        <ha-textfield
          label="Card title (optional)"
          .value=${this._config.name ?? ""}
          @input=${this._nameChanged}
        ></ha-textfield>

        <ha-textfield
          label="Max playlist chips"
          type="number"
          inputMode="numeric"
          min="1"
          max="500"
          .value=${pl}
          @input=${this._playlistLimitChanged}
        ></ha-textfield>

        <ha-formfield label="Tall layout (fill panel height)">
          <ha-switch
            .checked=${this._config.tall !== false}
            @change=${this._tallChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show “Up next” (needs custom integration queue attributes)">
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

  private _merge(partial: Partial<SpotifySpotlightCardConfig>): void {
    const base: SpotifySpotlightCardConfig = {
      type: "custom:spotify-spotlight-card",
      entity:
        typeof this._config.entity === "string" ? this._config.entity : "",
      tall: this._config.tall !== false,
      name:
        typeof this._config.name === "string" ? this._config.name : undefined,
      playlist_limit:
        typeof this._config.playlist_limit === "number"
          ? this._config.playlist_limit
          : undefined,
      show_up_next: this._config.show_up_next !== false,
    };
    this._fire({ ...base, ...partial });
  }

  private _entityChanged(ev: CustomEvent<{ value: string }>): void {
    ev.stopPropagation();
    const entity = ev.detail.value ?? "";
    this._merge({ entity });
  }

  private _nameChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const name = t.value.trim();
    this._merge({ name: name.length ? name : undefined });
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

  private _tallChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ tall: el.checked });
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
