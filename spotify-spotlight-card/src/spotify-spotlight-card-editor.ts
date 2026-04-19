/**
 * Lovelace visual editor — entity picker and card options.
 */
import { css, html, LitElement, type CSSResultGroup, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

import type {
  CornerTemperatureUnit,
  CoverAlign,
  SpotifySpotlightCardConfig,
} from "./spotify-config";

/** Minimal `hass` shape for `ha-entity-picker`. */
export interface HomeAssistantStub {
  states: Record<string, unknown>;
}

const COVER_OPTIONS: { value: CoverAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const TEMP_UNIT_OPTIONS: { value: CornerTemperatureUnit; label: string }[] = [
  { value: "auto", label: "Auto (match Home Assistant)" },
  { value: "celsius", label: "Celsius (°C)" },
  { value: "fahrenheit", label: "Fahrenheit (°F)" },
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

    const poll =
      typeof this._config.poll_interval_seconds === "number" &&
      Number.isFinite(this._config.poll_interval_seconds)
        ? String(this._config.poll_interval_seconds)
        : "5";

    const align: CoverAlign = this._config.cover_align ?? "center";
    const tempUnit: CornerTemperatureUnit =
      this._config.corner_temperature_unit === "celsius" ||
      this._config.corner_temperature_unit === "fahrenheit"
        ? this._config.corner_temperature_unit
        : "auto";
    const showTemp = this._config.show_corner_temperature === true;

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

        <ha-formfield
          label="Show “Media library” button (opens HA Media panel for this player)"
        >
          <ha-switch
            .checked=${this._config.show_browse_media_button !== false}
            @change=${this._browseButtonChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show “Up next” (custom integration queue attributes)">
          <ha-switch
            .checked=${this._config.show_up_next !== false}
            @change=${this._upNextChanged}
          ></ha-switch>
        </ha-formfield>

        <div class="field-label">Top left — time &amp; temperature</div>
        <ha-formfield label="Show time">
          <ha-switch
            .checked=${this._config.show_corner_time === true}
            @change=${this._cornerTimeChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield label="Show temperature">
          <ha-switch
            .checked=${showTemp}
            @change=${this._cornerTempEnabledChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.corner_temperature_entity ?? ""}
          .label=${"Temperature entity (weather or sensor)"}
          .includeDomains=${["weather", "sensor", "input_number"]}
          allow-custom-entity
          .disabled=${!showTemp}
          @value-changed=${this._cornerTempEntityChanged}
        ></ha-entity-picker>
        <p class="hint">
          Use a <strong>weather</strong> entity (uses the <code>temperature</code> attribute)
          or a numeric <strong>sensor</strong>. Temperature unit can follow Home Assistant or
          be forced to °C / °F below.
        </p>
        <div>
          <div class="field-label">Temperature display unit</div>
          <select
            class="field"
            .value=${tempUnit}
            .disabled=${!showTemp}
            @change=${this._cornerTempUnitChanged}
          >
            ${TEMP_UNIT_OPTIONS.map(
              (o) =>
                html`<option value=${o.value} .selected=${tempUnit === o.value}>
                  ${o.label}
                </option>`,
            )}
          </select>
        </div>
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

    const corner_temperature_unit: CornerTemperatureUnit =
      c.corner_temperature_unit === "celsius" ||
      c.corner_temperature_unit === "fahrenheit"
        ? c.corner_temperature_unit
        : "auto";

    return {
      type: "custom:spotify-spotlight-card",
      entity: typeof c.entity === "string" ? c.entity : "",
      tall: c.tall !== false,
      name: typeof c.name === "string" && c.name.trim() ? c.name.trim() : undefined,
      show_up_next: c.show_up_next !== false,
      show_browse_media_button: c.show_browse_media_button !== false,
      cover_align:
        c.cover_align === "left" ||
        c.cover_align === "center" ||
        c.cover_align === "right"
          ? c.cover_align
          : "center",
      poll_interval_seconds,
      show_corner_time: c.show_corner_time === true,
      show_corner_temperature: c.show_corner_temperature === true,
      corner_temperature_entity:
        typeof c.corner_temperature_entity === "string"
          ? c.corner_temperature_entity.trim()
          : undefined,
      corner_temperature_unit,
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

  private _browseButtonChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_browse_media_button: el.checked });
  }

  private _upNextChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_up_next: el.checked });
  }

  private _cornerTimeChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_corner_time: el.checked });
  }

  private _cornerTempEnabledChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_corner_temperature: el.checked });
  }

  private _cornerTempEntityChanged(ev: CustomEvent<{ value?: string }>): void {
    ev.stopPropagation();
    const raw = ev.detail?.value;
    const corner_temperature_entity =
      typeof raw === "string" ? raw.trim() : "";
    this._merge({
      corner_temperature_entity: corner_temperature_entity.length
        ? corner_temperature_entity
        : undefined,
    });
  }

  private _cornerTempUnitChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLSelectElement;
    const v = t.value as CornerTemperatureUnit;
    this._merge({
      corner_temperature_unit:
        v === "celsius" || v === "fahrenheit" || v === "auto" ? v : "auto",
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "spotify-spotlight-card-editor": SpotifySpotlightCardEditor;
  }
}
