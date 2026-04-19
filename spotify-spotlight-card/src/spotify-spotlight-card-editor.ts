/**
 * Lovelace visual editor — entity picker and card options.
 */
import {
  css,
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators.js";

import type {
  CornerTemperatureUnit,
  CoverAlign,
  MetaVerticalAlign,
  SpotifySpotlightCardConfig,
} from "./spotify-config";

/** Minimal `hass` shape for `ha-entity-picker` — HA passes the full object. */
export interface HomeAssistantStub {
  states: Record<string, unknown>;
  [key: string]: unknown;
}

const COVER_OPTIONS: { value: CoverAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const META_V_OPTIONS: { value: MetaVerticalAlign; label: string }[] = [
  { value: "top", label: "Top — beside art: align to top; centered: under cover" },
  { value: "center", label: "Center (default)" },
  {
    value: "bottom",
    label: "Bottom — beside art: align to bottom; centered: toward controls",
  },
];

const TEMP_UNIT_OPTIONS: { value: CornerTemperatureUnit; label: string }[] = [
  { value: "auto", label: "Auto (match Home Assistant)" },
  { value: "celsius", label: "Celsius (°C)" },
  { value: "fahrenheit", label: "Fahrenheit (°F)" },
];

@customElement("spotify-spotlight-card-editor")
export class SpotifySpotlightCardEditor extends LitElement {
  /**
   * Must use `type: Object` so Lovelace’s `configElement.hass = hass` assigns the
   * full Home Assistant object; without it, pickers often stay empty.
   */
  @property({ attribute: false, type: Object }) public hass?: HomeAssistantStub;

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
    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 8px 0 0;
      color: var(--primary-text-color);
    }
    .warn {
      font-size: 0.85rem;
      color: var(--warning-color, #d89614);
      margin: 0;
    }
    .link-btn {
      align-self: flex-start;
      background: none;
      border: 1px solid var(--divider-color);
      color: var(--primary-color);
      cursor: pointer;
      font: inherit;
      padding: 6px 10px;
      border-radius: 8px;
    }
    .link-btn:hover {
      background: rgba(127, 127, 127, 0.08);
    }
    .link-btn code {
      font-size: 0.85em;
    }
  `;

  setConfig(config: SpotifySpotlightCardConfig): void {
    this._config = { ...config };
    this.requestUpdate();
  }

  protected render(): TemplateResult {
    const hassForPickers = (this.hass ?? { states: {} }) as HomeAssistantStub;

    const poll =
      typeof this._config.poll_interval_seconds === "number" &&
      Number.isFinite(this._config.poll_interval_seconds)
        ? String(this._config.poll_interval_seconds)
        : "5";

    const align: CoverAlign = this._config.cover_align ?? "center";
    const metaV: MetaVerticalAlign =
      this._config.meta_vertical_align === "top" ||
      this._config.meta_vertical_align === "bottom"
        ? this._config.meta_vertical_align
        : "center";

    const tempUnit: CornerTemperatureUnit =
      this._config.corner_temperature_unit === "celsius" ||
      this._config.corner_temperature_unit === "fahrenheit"
        ? this._config.corner_temperature_unit
        : "auto";
    const showTemp = this._config.show_corner_temperature === true;

    const textScale =
      typeof this._config.text_scale_percent === "number" &&
      Number.isFinite(this._config.text_scale_percent)
        ? String(Math.round(this._config.text_scale_percent))
        : "200";

    const coverScale =
      typeof this._config.cover_scale_percent === "number" &&
      Number.isFinite(this._config.cover_scale_percent)
        ? String(Math.round(this._config.cover_scale_percent))
        : "100";

    const upNextScale =
      typeof this._config.up_next_scale_percent === "number" &&
      Number.isFinite(this._config.up_next_scale_percent)
        ? String(Math.round(this._config.up_next_scale_percent))
        : "100";

    const cornerClimateScale =
      typeof this._config.corner_climate_scale_percent === "number" &&
      Number.isFinite(this._config.corner_climate_scale_percent)
        ? String(Math.round(this._config.corner_climate_scale_percent))
        : "100";

    const bgBlur =
      typeof this._config.background_blur_px === "number" &&
      Number.isFinite(this._config.background_blur_px)
        ? String(Math.round(this._config.background_blur_px))
        : "36";

    const bgOpacity =
      typeof this._config.background_opacity_percent === "number" &&
      Number.isFinite(this._config.background_opacity_percent)
        ? String(Math.round(this._config.background_opacity_percent))
        : "100";

    const tempEntityRaw = (this._config.corner_temperature_entity ?? "").trim();
    const weatherTempFallback =
      tempEntityRaw.startsWith("weather.") ? tempEntityRaw : "";

    return html`
      <div class="card-config">
        ${!this.hass
          ? html`<p class="warn">
              Home Assistant state is not attached yet — entity lists may be empty
              until the editor finishes loading.
            </p>`
          : nothing}

        <div class="section-title">Spotify player</div>
        <div class="field-label">Media player entity</div>
        <ha-entity-picker
          .hass=${hassForPickers as never}
          .value=${this._config.entity ?? ""}
          .label=${"Spotify media_player"}
          .includeDomains=${["media_player"]}
          allow-custom-entity
          @value-changed=${this._entityChanged}
        ></ha-entity-picker>
        <p class="hint">
          Choose the Spotify Connect <strong>media_player</strong>. You can also type
          an entity ID if it does not appear in the list.
        </p>

        <ha-textfield
          label="Card title (optional)"
          .value=${this._config.name ?? ""}
          @change=${this._nameChanged}
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
          label="Album cover size (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${coverScale}
          @change=${this._coverScaleChanged}
        ></ha-textfield>
        <p class="hint">
          100 = default art size; larger values grow the square cover (capped by card
          width). Same scale in tall layout (larger base art there).
        </p>

        <div class="section-title">Background (album art behind card)</div>
        <ha-textfield
          label="Background blur (px)"
          type="number"
          inputMode="numeric"
          min="0"
          max="80"
          .value=${bgBlur}
          @change=${this._bgBlurChanged}
        ></ha-textfield>
        <p class="hint">
          Blur radius for the album-art backdrop (0 = sharp, 36 = default,
          80 = heavy haze).
        </p>
        <ha-textfield
          label="Background opacity (%)"
          type="number"
          inputMode="numeric"
          min="0"
          max="100"
          .value=${bgOpacity}
          @change=${this._bgOpacityChanged}
        ></ha-textfield>
        <p class="hint">
          Opacity of the album-art backdrop layer (100 = full art, 0 = hidden).
          The dark scrim that keeps text readable is unaffected.
        </p>

        <div>
          <div class="field-label">Now playing text vs album art</div>
          <select
            class="field"
            .value=${metaV}
            @change=${this._metaVerticalChanged}
          >
            ${META_V_OPTIONS.map(
              (o) =>
                html`<option value=${o.value} .selected=${metaV === o.value}>
                  ${o.label}
                </option>`,
            )}
          </select>
        </div>

        <ha-textfield
          label="Title & artist scale (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${textScale}
          @change=${this._textScaleChanged}
        ></ha-textfield>
        <p class="hint">
          Scales the “Now playing” label, title, artist, and progress row (100 = default
          card size, 200 ≈ double).
        </p>

        <ha-textfield
          label="Refresh interval (seconds)"
          type="number"
          inputMode="numeric"
          min="2"
          max="120"
          .value=${poll}
          @change=${this._pollChanged}
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

        <ha-formfield label="Tablet mode (larger source list touch targets)">
          <ha-switch
            .checked=${this._config.source_tablet_mode === true}
            @change=${this._tabletSourceChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show “Up next” (custom integration queue attributes)">
          <ha-switch
            .checked=${this._config.show_up_next !== false}
            @change=${this._upNextChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-textfield
          label="“Up next” pane scale (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${upNextScale}
          @change=${this._upNextScaleChanged}
        ></ha-textfield>
        <p class="hint">
          100 = default size for the overlay text, thumbnail, padding, and corner
          position (50–300).
        </p>

        <div class="section-title">Time &amp; temperature (top-left)</div>
        <ha-textfield
          label="Time &amp; temperature pane scale (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${cornerClimateScale}
          @change=${this._cornerClimateScaleChanged}
        ></ha-textfield>
        <p class="hint">
          100 = default for the clock, temperature line, padding, and glass panel
          size (50–300).
        </p>

        <ha-formfield label="Show time">
          <ha-switch
            .checked=${this._config.show_corner_time === true}
            @change=${this._cornerTimeChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield label="Include seconds (e.g. 12:34:56)">
          <ha-switch
            .checked=${this._config.show_corner_seconds === true}
            .disabled=${this._config.show_corner_time !== true}
            @change=${this._cornerSecondsChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield label="Show temperature">
          <ha-switch
            .checked=${showTemp}
            @change=${this._cornerTempEnabledChanged}
          ></ha-switch>
        </ha-formfield>
        <div class="field-label">Temperature entity</div>
        <ha-entity-picker
          .hass=${hassForPickers as never}
          .value=${this._config.corner_temperature_entity ?? ""}
          .label=${"Weather, sensor, or input_number"}
          .includeDomains=${["weather", "sensor", "input_number"]}
          allow-custom-entity
          @value-changed=${this._cornerTempEntityChanged}
        ></ha-entity-picker>
        <p class="hint">
          <strong>weather</strong> uses the <code>temperature</code> attribute;
          <strong>sensor</strong> / <strong>input_number</strong> use the numeric state.
        </p>
        <div>
          <div class="field-label">Temperature display unit</div>
          <select
            class="field"
            .value=${tempUnit}
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

        <div class="section-title">Weather (state name &amp; icon)</div>
        <ha-formfield label="Show weather state name (e.g. “Partly cloudy”)">
          <ha-switch
            .checked=${this._config.show_corner_weather === true}
            @change=${this._cornerWeatherChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield label="Show weather icon (left of time/temperature)">
          <ha-switch
            .checked=${this._config.show_corner_weather_icon === true}
            @change=${this._cornerWeatherIconChanged}
          ></ha-switch>
        </ha-formfield>
        <div class="field-label">Weather entity</div>
        <ha-entity-picker
          .hass=${hassForPickers as never}
          .value=${this._config.corner_weather_entity ?? ""}
          .label=${"weather.* (e.g. Met.no, Tempest)"}
          .includeDomains=${["weather"]}
          allow-custom-entity
          @value-changed=${this._cornerWeatherEntityChanged}
        ></ha-entity-picker>
        <p class="hint">
          Required to show the weather state and icon. The state name uses
          Home Assistant’s own translation, so Met.no’s
          <em>“Partly cloudy”</em> or Tempest’s <em>“Clear, night”</em> shows
          as-is.
          ${this._config.corner_weather_entity
            ? nothing
            : weatherTempFallback
              ? html` Currently falling back to
                  <code>${weatherTempFallback}</code>.`
              : nothing}
        </p>
        ${weatherTempFallback &&
        this._config.corner_weather_entity !== weatherTempFallback
          ? html`<button
              type="button"
              class="link-btn"
              @click=${this._useTempEntityForWeather}
            >
              Use temperature entity
              (<code>${weatherTempFallback}</code>) for weather
            </button>`
          : nothing}
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

    const meta_vertical_align: MetaVerticalAlign =
      c.meta_vertical_align === "top" || c.meta_vertical_align === "bottom"
        ? c.meta_vertical_align
        : "center";

    let text_scale_percent = 200;
    const tsp = c.text_scale_percent;
    if (typeof tsp === "number" && Number.isFinite(tsp)) {
      text_scale_percent = Math.min(300, Math.max(50, Math.round(tsp)));
    }

    let cover_scale_percent = 100;
    const csp = c.cover_scale_percent;
    if (typeof csp === "number" && Number.isFinite(csp)) {
      cover_scale_percent = Math.min(300, Math.max(50, Math.round(csp)));
    }

    let up_next_scale_percent = 100;
    const unsp = c.up_next_scale_percent;
    if (typeof unsp === "number" && Number.isFinite(unsp)) {
      up_next_scale_percent = Math.min(300, Math.max(50, Math.round(unsp)));
    }

    let corner_climate_scale_percent = 100;
    const ccsp = c.corner_climate_scale_percent;
    if (typeof ccsp === "number" && Number.isFinite(ccsp)) {
      corner_climate_scale_percent = Math.min(300, Math.max(50, Math.round(ccsp)));
    }

    let background_blur_px = 36;
    const bbp = c.background_blur_px;
    if (typeof bbp === "number" && Number.isFinite(bbp)) {
      background_blur_px = Math.min(80, Math.max(0, Math.round(bbp)));
    }

    let background_opacity_percent = 100;
    const bop = c.background_opacity_percent;
    if (typeof bop === "number" && Number.isFinite(bop)) {
      background_opacity_percent = Math.min(100, Math.max(0, Math.round(bop)));
    }

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
      cover_scale_percent,
      poll_interval_seconds,
      show_corner_time: c.show_corner_time === true,
      show_corner_temperature: c.show_corner_temperature === true,
      corner_temperature_entity:
        typeof c.corner_temperature_entity === "string"
          ? c.corner_temperature_entity.trim()
          : undefined,
      corner_temperature_unit,
      meta_vertical_align,
      text_scale_percent,
      source_tablet_mode: c.source_tablet_mode === true,
      up_next_scale_percent,
      corner_climate_scale_percent,
      background_blur_px,
      background_opacity_percent,
      show_corner_seconds: c.show_corner_seconds === true,
      show_corner_weather: c.show_corner_weather === true,
      show_corner_weather_icon: c.show_corner_weather_icon === true,
      corner_weather_entity:
        typeof c.corner_weather_entity === "string" &&
        c.corner_weather_entity.trim().length > 0
          ? c.corner_weather_entity.trim()
          : undefined,
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

  private _coverScaleChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n)) {
      this._merge({ cover_scale_percent: 100 });
      return;
    }
    this._merge({ cover_scale_percent: Math.min(300, Math.max(50, n)) });
  }

  private _metaVerticalChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLSelectElement;
    const v = t.value as MetaVerticalAlign;
    this._merge({
      meta_vertical_align:
        v === "top" || v === "bottom" || v === "center" ? v : "center",
    });
  }

  private _textScaleChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n)) {
      this._merge({ text_scale_percent: 200 });
      return;
    }
    this._merge({ text_scale_percent: Math.min(300, Math.max(50, n)) });
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

  private _tabletSourceChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ source_tablet_mode: el.checked });
  }

  private _upNextChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_up_next: el.checked });
  }

  private _upNextScaleChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n)) {
      this._merge({ up_next_scale_percent: 100 });
      return;
    }
    this._merge({ up_next_scale_percent: Math.min(300, Math.max(50, n)) });
  }

  private _bgBlurChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n)) {
      this._merge({ background_blur_px: 36 });
      return;
    }
    this._merge({ background_blur_px: Math.min(80, Math.max(0, n)) });
  }

  private _bgOpacityChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n)) {
      this._merge({ background_opacity_percent: 100 });
      return;
    }
    this._merge({ background_opacity_percent: Math.min(100, Math.max(0, n)) });
  }

  private _cornerClimateScaleChanged(ev: Event): void {
    const t = ev.target as unknown as HTMLInputElement;
    const n = parseInt(t.value, 10);
    if (!Number.isFinite(n)) {
      this._merge({ corner_climate_scale_percent: 100 });
      return;
    }
    this._merge({ corner_climate_scale_percent: Math.min(300, Math.max(50, n)) });
  }

  private _cornerTimeChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_corner_time: el.checked });
  }

  private _cornerSecondsChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_corner_seconds: el.checked });
  }

  private _cornerWeatherChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_corner_weather: el.checked });
  }

  private _cornerWeatherIconChanged(ev: Event): void {
    const el = ev.currentTarget as HTMLElement & { checked: boolean };
    this._merge({ show_corner_weather_icon: el.checked });
  }

  private _cornerWeatherEntityChanged(ev: CustomEvent<{ value?: string }>): void {
    ev.stopPropagation();
    const raw = ev.detail?.value;
    const v = typeof raw === "string" ? raw.trim() : "";
    this._merge({ corner_weather_entity: v.length ? v : undefined });
  }

  private _useTempEntityForWeather(): void {
    const t = (this._config.corner_temperature_entity ?? "").trim();
    if (!t.startsWith("weather.")) {
      return;
    }
    this._merge({ corner_weather_entity: t });
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
