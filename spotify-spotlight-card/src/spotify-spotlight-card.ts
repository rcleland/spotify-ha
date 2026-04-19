/**
 * Spotify Spotlight — Lovelace card with blurred artwork, transport, volume, and optional link to HA Media panel.
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

export type {
  CornerTemperatureUnit,
  MetaVerticalAlign,
  SpotifySpotlightCardConfig,
} from "./spotify-config";

import "./spotify-spotlight-card-editor";

declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description: string;
      preview?: boolean;
    }>;
  }
}

interface HassEntity {
  state: string;
  attributes: Record<string, unknown>;
}

interface HomeAssistant {
  states: Record<string, HassEntity>;
  /** Home Assistant frontend — resolves paths for subfolder installs */
  hassUrl?(path: string): string;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ): Promise<void>;
  config?: {
    unit_system?: {
      temperature?: string;
    };
  };
  locale?: {
    language?: string;
  };
  /** Modern HA helper that returns a localized state label, e.g. "Partly cloudy". */
  formatEntityState?(stateObj: HassEntity, state?: string): string;
  localize?(key: string, ...args: unknown[]): string;
}

/** Standard Home Assistant `weather.*` state → Material Design Icon mapping. */
const WEATHER_ICON_MAP: Record<string, string> = {
  "clear-night": "mdi:weather-night",
  cloudy: "mdi:weather-cloudy",
  exceptional: "mdi:alert-circle-outline",
  fog: "mdi:weather-fog",
  hail: "mdi:weather-hail",
  lightning: "mdi:weather-lightning",
  "lightning-rainy": "mdi:weather-lightning-rainy",
  partlycloudy: "mdi:weather-partly-cloudy",
  pouring: "mdi:weather-pouring",
  rainy: "mdi:weather-rainy",
  snowy: "mdi:weather-snowy",
  "snowy-rainy": "mdi:weather-snowy-rainy",
  sunny: "mdi:weather-sunny",
  windy: "mdi:weather-windy",
  "windy-variant": "mdi:weather-windy-variant",
};

/** Same as Home Assistant `MediaPlayerEntityFeature.BROWSE_MEDIA` */
const MEDIA_PLAYER_FEATURE_BROWSE_MEDIA = 1 << 17;

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "spotify-spotlight-card",
  name: "Spotify Spotlight",
  description:
    "Spotify controls with blurred artwork, volume, up next, and Media panel link",
  preview: true,
});

@customElement("spotify-spotlight-card")
export class SpotifySpotlightCard extends LitElement {
  static getStubConfig(): SpotifySpotlightCardConfig {
    return {
      type: "custom:spotify-spotlight-card",
      entity: "",
      tall: true,
      show_up_next: true,
      show_browse_media_button: true,
      cover_align: "center",
      cover_scale_percent: 100,
      poll_interval_seconds: 5,
      show_corner_time: false,
      show_corner_seconds: false,
      show_corner_temperature: false,
      show_corner_weather: false,
      show_corner_weather_icon: false,
      corner_temperature_unit: "auto",
      meta_vertical_align: "center",
      text_scale_percent: 200,
      source_tablet_mode: false,
      up_next_scale_percent: 100,
      corner_climate_scale_percent: 100,
    };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("spotify-spotlight-card-editor");
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ type: Object }) public config?: SpotifySpotlightCardConfig;

  /** Home Assistant invokes this — not Lit's @property setter. */
  public setConfig(config: unknown): void {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration");
    }
    const raw = config as Record<string, unknown>;
    const entityRaw = raw.entity;
    if (
      entityRaw !== undefined &&
      entityRaw !== null &&
      typeof entityRaw !== "string"
    ) {
      throw new Error("entity must be a string");
    }
    const entity =
      typeof entityRaw === "string" ? entityRaw.trim() : "";
    const pollRaw = raw.poll_interval_seconds;
    const poll_interval_seconds =
      typeof pollRaw === "number" &&
      Number.isFinite(pollRaw) &&
      pollRaw >= 2 &&
      pollRaw <= 120
        ? Math.floor(pollRaw)
        : 5;

    const ca = raw.cover_align;
    const cover_align: CoverAlign =
      ca === "left" || ca === "center" || ca === "right" ? ca : "center";

    const ctu = raw.corner_temperature_unit;
    const corner_temperature_unit: CornerTemperatureUnit =
      ctu === "celsius" || ctu === "fahrenheit" || ctu === "auto" ? ctu : "auto";

    const cteRaw = raw.corner_temperature_entity;
    const corner_temperature_entity =
      typeof cteRaw === "string" ? cteRaw.trim() : undefined;

    const mva = raw.meta_vertical_align;
    const meta_vertical_align: MetaVerticalAlign =
      mva === "top" || mva === "bottom" || mva === "center" ? mva : "center";

    const tspRaw = raw.text_scale_percent;
    let text_scale_percent = 200;
    if (
      typeof tspRaw === "number" &&
      Number.isFinite(tspRaw)
    ) {
      text_scale_percent = Math.min(300, Math.max(50, Math.round(tspRaw)));
    }

    const cspRaw = raw.cover_scale_percent;
    let cover_scale_percent = 100;
    if (typeof cspRaw === "number" && Number.isFinite(cspRaw)) {
      cover_scale_percent = Math.min(300, Math.max(50, Math.round(cspRaw)));
    }

    const unspRaw = raw.up_next_scale_percent;
    let up_next_scale_percent = 100;
    if (typeof unspRaw === "number" && Number.isFinite(unspRaw)) {
      up_next_scale_percent = Math.min(300, Math.max(50, Math.round(unspRaw)));
    }

    const ccspRaw = raw.corner_climate_scale_percent;
    let corner_climate_scale_percent = 100;
    if (typeof ccspRaw === "number" && Number.isFinite(ccspRaw)) {
      corner_climate_scale_percent = Math.min(300, Math.max(50, Math.round(ccspRaw)));
    }

    this.config = {
      type: "custom:spotify-spotlight-card",
      entity,
      tall: raw.tall !== false,
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : undefined,
      show_up_next: raw.show_up_next !== false,
      show_browse_media_button: raw.show_browse_media_button !== false,
      cover_align,
      cover_scale_percent,
      poll_interval_seconds,
      show_corner_time: raw.show_corner_time === true,
      show_corner_seconds: raw.show_corner_seconds === true,
      show_corner_temperature: raw.show_corner_temperature === true,
      corner_temperature_entity:
        corner_temperature_entity?.length ? corner_temperature_entity : undefined,
      corner_temperature_unit,
      show_corner_weather: raw.show_corner_weather === true,
      show_corner_weather_icon: raw.show_corner_weather_icon === true,
      corner_weather_entity:
        typeof raw.corner_weather_entity === "string" &&
        raw.corner_weather_entity.trim().length > 0
          ? raw.corner_weather_entity.trim()
          : undefined,
      meta_vertical_align,
      text_scale_percent,
      source_tablet_mode: raw.source_tablet_mode === true,
      up_next_scale_percent,
      corner_climate_scale_percent,
    };
  }

  private _pollTimer: ReturnType<typeof setInterval> | undefined;

  private _tickTimer: ReturnType<typeof setInterval> | undefined;

  static styles: CSSResultGroup = css`
    :host {
      display: block;
      height: 100%;
      min-height: 420px;
      --spot-radius: 20px;
      --spot-gap: 16px;
      --spot-text: rgba(255, 255, 255, 0.96);
      --spot-muted: rgba(255, 255, 255, 0.62);
      --spot-glass: rgba(12, 12, 18, 0.38);
      --spot-glass-strong: rgba(12, 12, 18, 0.58);
      --spot-meta-scale: 2;
      --spot-cover-scale: 1;
      --spot-up-next-scale: 1;
      --spot-corner-climate-scale: 1;
      color: var(--spot-text);
      font-family: var(--ha-font-family-body, ui-sans-serif, system-ui);
      -webkit-font-smoothing: antialiased;
    }

    :host([data-tall]) {
      min-height: calc(100vh - 140px);
      height: 100%;
    }

    .card-shell {
      position: relative;
      display: block;
      height: 100%;
      min-height: inherit;
    }

    :host([data-tall]) .card-shell {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .wrap {
      position: relative;
      border-radius: var(--spot-radius);
      overflow: hidden;
      min-height: inherit;
      box-sizing: border-box;
      isolation: isolate;
    }

    :host([data-tall]) .wrap {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .backdrop {
      position: absolute;
      inset: -24px;
      background-size: cover;
      background-position: center;
      filter: blur(36px) saturate(1.15);
      transform: scale(1.06);
      z-index: 0;
    }

    :host([data-tall]) .backdrop {
      inset: 0;
      border-radius: inherit;
      transform: scale(1.12);
      background-position: center top;
    }

    .backdrop-fallback {
      background: linear-gradient(
        145deg,
        rgb(29, 185, 84) 0%,
        rgb(18, 18, 24) 55%,
        rgb(10, 10, 14) 100%
      );
    }

    .scrim {
      position: absolute;
      inset: 0;
      background: radial-gradient(
          ellipse 120% 80% at 50% 0%,
          rgba(0, 0, 0, 0.25) 0%,
          rgba(0, 0, 0, 0.72) 70%
        ),
        linear-gradient(to bottom, rgba(8, 8, 12, 0.2), rgba(8, 8, 14, 0.92));
      z-index: 1;
    }

    .body {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: var(--spot-gap);
      padding: 24px;
      height: 100%;
      min-height: inherit;
      box-sizing: border-box;
    }

    :host([data-tall]) .body {
      flex: 1 1 auto;
      min-height: 0;
      height: auto;
    }

    .bottom-stack {
      display: flex;
      flex-direction: column;
      gap: var(--spot-gap);
      width: 100%;
    }

    :host([data-tall]) .bottom-stack {
      flex-shrink: 0;
      margin-top: auto;
      padding-top: 4px;
    }

    /** Pinned inside .wrap — does not participate in meta/center layout. */
    .up-next {
      position: absolute;
      top: calc(16px * var(--spot-up-next-scale, 1));
      right: calc(16px * var(--spot-up-next-scale, 1));
      left: auto;
      bottom: auto;
      display: flex;
      align-items: center;
      gap: calc(12px * var(--spot-up-next-scale, 1));
      padding: calc(10px * var(--spot-up-next-scale, 1))
        calc(14px * var(--spot-up-next-scale, 1))
        calc(10px * var(--spot-up-next-scale, 1))
        calc(10px * var(--spot-up-next-scale, 1));
      margin: 0;
      max-width: min(
        calc(300px * var(--spot-up-next-scale, 1)),
        calc(100% - 32px)
      );
      box-sizing: border-box;
      z-index: 8;
      background: var(--spot-glass-strong);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border-radius: calc(16px * min(var(--spot-up-next-scale, 1), 1.35));
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 calc(8px * var(--spot-up-next-scale, 1))
        calc(28px * var(--spot-up-next-scale, 1)) rgba(0, 0, 0, 0.35);
      text-align: left;
    }

    .up-next-cover {
      width: calc(56px * var(--spot-up-next-scale, 1));
      height: calc(56px * var(--spot-up-next-scale, 1));
      border-radius: calc(10px * min(var(--spot-up-next-scale, 1), 1.35));
      object-fit: cover;
      flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      background: rgba(0, 0, 0, 0.35);
    }

    .up-next-copy {
      min-width: 0;
      flex: 1;
    }

    .up-next-label {
      font-size: calc(0.68rem * var(--spot-up-next-scale, 1));
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--spot-muted);
      margin: 0 0 calc(4px * var(--spot-up-next-scale, 1));
    }

    .up-next-title {
      margin: 0;
      font-size: calc(0.95rem * var(--spot-up-next-scale, 1));
      font-weight: 600;
      line-height: 1.25;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .up-next-artist {
      margin: calc(4px * var(--spot-up-next-scale, 1)) 0 0;
      font-size: calc(0.82rem * var(--spot-up-next-scale, 1));
      color: var(--spot-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .corner-climate {
      position: absolute;
      top: calc(16px * var(--spot-corner-climate-scale, 1));
      left: calc(16px * var(--spot-corner-climate-scale, 1));
      z-index: 8;
      max-width: min(
        calc(260px * var(--spot-corner-climate-scale, 1)),
        calc(100% - 32px)
      );
      box-sizing: border-box;
      padding: calc(10px * var(--spot-corner-climate-scale, 1))
        calc(14px * var(--spot-corner-climate-scale, 1));
      background: var(--spot-glass-strong);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border-radius: calc(16px * min(var(--spot-corner-climate-scale, 1), 1.35));
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 calc(8px * var(--spot-corner-climate-scale, 1))
        calc(28px * var(--spot-corner-climate-scale, 1)) rgba(0, 0, 0, 0.35);
      text-align: left;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: calc(12px * var(--spot-corner-climate-scale, 1));
    }

    .corner-climate-icon {
      flex-shrink: 0;
      color: var(--spot-text);
      --mdc-icon-size: calc(2.4rem * var(--spot-corner-climate-scale, 1));
      filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.45));
    }

    .corner-climate-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .corner-time {
      margin: 0;
      font-size: calc(1.25rem * var(--spot-corner-climate-scale, 1));
      font-weight: 650;
      line-height: 1.2;
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
      text-shadow: 0 1px 12px rgba(0, 0, 0, 0.45);
    }

    .corner-temp {
      margin: calc(4px * var(--spot-corner-climate-scale, 1)) 0 0;
      font-size: calc(0.95rem * var(--spot-corner-climate-scale, 1));
      font-weight: 550;
      color: var(--spot-muted);
      text-shadow: 0 1px 10px rgba(0, 0, 0, 0.4);
    }

    .corner-weather {
      margin: calc(2px * var(--spot-corner-climate-scale, 1)) 0 0;
      font-size: calc(0.85rem * var(--spot-corner-climate-scale, 1));
      font-weight: 500;
      color: var(--spot-muted);
      text-shadow: 0 1px 10px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .corner-climate-text > :first-child {
      margin-top: 0;
    }

    .top {
      display: flex;
      gap: 20px;
      align-items: stretch;
      flex-wrap: wrap;
    }

    .top.cover-left,
    .top.cover-right {
      flex-direction: row;
      justify-content: flex-start;
      align-items: stretch;
    }

    .top.cover-right {
      flex-direction: row-reverse;
    }

    .top.cover-left .meta-region,
    .top.cover-right .meta-region {
      flex: 1 1 200px;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .top.cover-left.meta-v-top .meta-region,
    .top.cover-right.meta-v-top .meta-region {
      justify-content: flex-start;
    }

    .top.cover-left.meta-v-center .meta-region,
    .top.cover-right.meta-v-center .meta-region {
      justify-content: center;
    }

    .top.cover-left.meta-v-bottom .meta-region,
    .top.cover-right.meta-v-bottom .meta-region {
      justify-content: flex-end;
    }

    .top.cover-center {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .top.cover-center .meta-region {
      width: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      justify-content: flex-start;
    }

    .top.cover-center.meta-v-top .meta-region {
      justify-content: flex-start;
      margin-top: 0;
    }

    .top.cover-center.meta-v-center .meta-region {
      justify-content: center;
      margin-top: 0;
    }

    .top.cover-center.meta-v-bottom .meta-region {
      justify-content: flex-end;
      margin-top: auto;
    }

    .top.cover-center .meta {
      align-items: center;
      width: 100%;
      text-align: center;
    }

    .top.cover-center .progress-wrap {
      width: 100%;
      max-width: 420px;
    }

    :host([data-tall]) .top {
      flex: 0 1 auto;
      min-height: 0;
    }

    :host([data-tall]) .top.cover-center {
      flex: 1 1 auto;
      min-height: 0;
      justify-content: flex-start;
      align-items: center;
    }

    :host([data-tall]) .top.cover-center .meta-region {
      flex: 1 1 auto;
      min-height: 0;
    }

    :host([data-tall]) .top.cover-center .progress-wrap {
      max-width: min(520px, 100%);
    }

    :host([data-tall]) .art {
      width: min(
        calc(340px * var(--spot-cover-scale, 1)),
        calc(86vw * var(--spot-cover-scale, 1))
      );
      max-width: 100%;
    }

    .art {
      flex: 0 0 auto;
      width: min(
        calc(240px * var(--spot-cover-scale, 1)),
        calc(42vw * var(--spot-cover-scale, 1))
      );
      aspect-ratio: 1;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      background: rgba(0, 0, 0, 0.35);
    }

    .art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .meta {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: calc(8px * min(var(--spot-meta-scale, 2), 2.5));
      min-width: 0;
    }

    .top.cover-left .meta,
    .top.cover-right .meta {
      flex: 0 0 auto;
    }

    .label {
      font-size: calc(0.78rem * var(--spot-meta-scale, 2));
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--spot-muted);
    }

    h2 {
      margin: 0;
      font-weight: 650;
      font-size: calc(clamp(1.35rem, 3vw, 1.85rem) * var(--spot-meta-scale, 2));
      line-height: 1.15;
      text-shadow: 0 2px 24px rgba(0, 0, 0, 0.55);
      word-break: break-word;
    }

    .artist {
      margin: 0;
      font-size: calc(1.05rem * var(--spot-meta-scale, 2));
      color: var(--spot-muted);
      font-weight: 450;
    }

    .progress-wrap {
      margin-top: calc(8px * min(var(--spot-meta-scale, 2), 2.5));
    }

    .progress-bar {
      display: block;
      height: calc(4px * var(--spot-meta-scale, 2));
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.14);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: rgb(29, 185, 84);
      border-radius: 4px;
      transition: width 0.12s linear;
    }

    .time-row {
      display: flex;
      justify-content: space-between;
      font-size: calc(0.75rem * var(--spot-meta-scale, 2));
      color: var(--spot-muted);
      margin-top: 6px;
    }

    .source-tablet select.source-select {
      min-height: 52px;
      font-size: 1.2rem;
      padding: 16px 14px;
      line-height: 1.4;
    }

    .source-tablet select.source-select option {
      font-size: 1.15rem;
      padding: 14px 10px;
      min-height: 3.25rem;
      line-height: 1.5;
    }

    .glass-panel {
      background: var(--spot-glass);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border-radius: 16px;
      padding: 14px 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .controls-main {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
      column-gap: 12px;
    }

    .transport-side-left {
      justify-self: start;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      min-width: 0;
    }

    .transport-cluster {
      justify-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .transport-side-right {
      justify-self: end;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
    }

    .browse-icon-btn {
      flex: 0 0 auto;
      width: 44px;
      height: 44px;
    }

    .ctrl-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.1);
      color: var(--spot-text);
      transition: transform 0.12s ease, background 0.15s ease;
    }

    .ctrl-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      transform: scale(1.04);
    }

    .ctrl-btn.primary {
      width: 68px;
      height: 68px;
      background: rgb(29, 185, 84);
      color: #05140a;
    }

    .ctrl-btn.primary:hover {
      background: rgb(42, 201, 96);
    }

    .ctrl-btn.active {
      color: rgb(29, 185, 84);
    }

    .vol-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .vol-row ha-slider {
      flex: 1;
      min-width: 0;
    }

    .vol-row input[type="range"] {
      flex: 1;
      accent-color: rgb(29, 185, 84);
    }

    .source-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }

    .source-row label {
      font-size: 0.8rem;
      color: var(--spot-muted);
      margin-right: 8px;
    }

    select.source-select {
      flex: 1;
      min-width: 160px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: var(--spot-glass-strong);
      color: var(--spot-text);
      font: inherit;
    }

    .section-title {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--spot-muted);
      letter-spacing: 0.04em;
    }

    .subtle {
      font-size: 0.85rem;
      color: var(--spot-muted);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this._startTimers();
  }

  override disconnectedCallback(): void {
    this._stopTimers();
    super.disconnectedCallback();
  }

  /**
   * Opens HA’s full-screen media browser for this entity (same route as the sidebar Media panel).
   * Uses `history.pushState` + `location-changed` like HA’s `navigate()` so **browser / OS back**
   * returns to the dashboard.
   */
  private _navigateToHaMediaBrowser(): void {
    const id = this.config?.entity;
    if (!id || typeof window === "undefined") {
      return;
    }
    const path = `/media-browser/${encodeURIComponent(id)}`;
    let pathForHistory = this.hass?.hassUrl?.(path) ?? path;
    if (
      pathForHistory.startsWith("http://") ||
      pathForHistory.startsWith("https://")
    ) {
      try {
        const url = new URL(pathForHistory);
        pathForHistory = url.pathname + url.search + url.hash;
      } catch {
        pathForHistory = path;
      }
    } else if (!pathForHistory.startsWith("/")) {
      pathForHistory = `/${pathForHistory}`;
    }
    try {
      window.history.pushState(null, "", pathForHistory);
      const ev = new CustomEvent("location-changed", {
        bubbles: true,
        composed: true,
        detail: { replace: false },
      });
      // Defer so the history entry is committed before HA’s router handles the event.
      queueMicrotask(() => {
        window.dispatchEvent(ev);
      });
    } catch {
      window.location.assign(
        this.hass?.hassUrl?.(path) ??
          new URL(path, window.location.origin).href,
      );
    }
  }

  updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (this.config?.tall) {
      this.dataset.tall = "";
    } else {
      delete this.dataset.tall;
    }

    const id = this.config?.entity;
    if (changed.has("config")) {
      this._stopTimers();
      this._startTimers();
    } else if (changed.has("hass")) {
      if (!this.hass) {
        this._stopTimers();
      } else if (id && this._pollTimer === undefined) {
        this._startTimers();
      }
    }

    this._syncLayoutCssVars();
  }

  private _syncLayoutCssVars(): void {
    const p = this.config?.text_scale_percent;
    let metaScale = 2;
    if (typeof p === "number" && Number.isFinite(p)) {
      metaScale = Math.min(3, Math.max(0.5, p / 100));
    }
    this.style.setProperty("--spot-meta-scale", String(metaScale));

    const c = this.config?.cover_scale_percent;
    let coverScale = 1;
    if (typeof c === "number" && Number.isFinite(c)) {
      coverScale = Math.min(3, Math.max(0.5, c / 100));
    }
    this.style.setProperty("--spot-cover-scale", String(coverScale));

    const u = this.config?.up_next_scale_percent;
    let upNextScale = 1;
    if (typeof u === "number" && Number.isFinite(u)) {
      upNextScale = Math.min(3, Math.max(0.5, u / 100));
    }
    this.style.setProperty("--spot-up-next-scale", String(upNextScale));

    const cc = this.config?.corner_climate_scale_percent;
    let cornerScale = 1;
    if (typeof cc === "number" && Number.isFinite(cc)) {
      cornerScale = Math.min(3, Math.max(0.5, cc / 100));
    }
    this.style.setProperty("--spot-corner-climate-scale", String(cornerScale));
  }

  private _stopTimers(): void {
    if (this._tickTimer !== undefined) {
      clearInterval(this._tickTimer);
      this._tickTimer = undefined;
    }
    if (this._pollTimer !== undefined) {
      clearInterval(this._pollTimer);
      this._pollTimer = undefined;
    }
  }

  private _startTimers(): void {
    if (typeof window === "undefined") {
      return;
    }
    this._stopTimers();
    const id = this.config?.entity;
    if (!this.hass || !id) {
      return;
    }

    const pollSecConfig = this.config?.poll_interval_seconds ?? 5;
    const pollMs = Math.min(120_000, Math.max(2000, pollSecConfig * 1000));

    const tickClock = this.config?.show_corner_time === true;

    this._tickTimer = window.setInterval(() => {
      const st = this.hass?.states[id];
      if (st?.state === "playing" || tickClock) {
        this.requestUpdate();
      }
    }, 1000);

    void this.hass.callService("homeassistant", "update_entity", {
      entity_id: id,
    });

    this._pollTimer = window.setInterval(() => {
      void this.hass?.callService("homeassistant", "update_entity", {
        entity_id: id,
      });
    }, pollMs);
  }

  private get _entity(): HassEntity | undefined {
    const id = this.config?.entity;
    if (!this.hass || !id) {
      return undefined;
    }
    return this.hass.states[id];
  }

  private _pic(): string | undefined {
    const a = this._entity?.attributes;
    if (!a) {
      return undefined;
    }
    const p = a.entity_picture as string | undefined;
    return p?.length ? p : undefined;
  }

  private async _callService(
    service: string,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    const eid = this.config?.entity;
    if (!this.hass || !eid) {
      return;
    }
    await this.hass.callService("media_player", service, {
      entity_id: eid,
      ...data,
    });
  }

  /** Delta is absolute change on 0–1 scale (e.g. 0.05 = five percentage points). */
  private _adjustVolumeLevel(delta: number): void {
    const ent = this._entity;
    if (!ent) {
      return;
    }
    const cur =
      (ent.attributes.volume_level as number | undefined) ?? 0;
    const next = Math.min(1, Math.max(0, cur + delta));
    void this._callService("volume_set", { volume_level: next });
  }

  private _fmtTime(sec: number): string {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  private _hassSystemUsesFahrenheit(): boolean {
    const t = this.hass?.config?.unit_system?.temperature;
    if (t === undefined || t === null) {
      return false;
    }
    return String(t).toUpperCase().includes("F");
  }

  private _parseTemperatureNative(
    entityId: string,
  ): { value: number; unit: "C" | "F" } | undefined {
    const st = this.hass?.states[entityId];
    if (!st) {
      return undefined;
    }
    const domain = entityId.split(".")[0];
    if (domain === "weather") {
      const raw = st.attributes?.temperature;
      if (typeof raw !== "number" || Number.isNaN(raw)) {
        return undefined;
      }
      return {
        value: raw,
        unit: this._hassSystemUsesFahrenheit() ? "F" : "C",
      };
    }
    const raw = Number.parseFloat(String(st.state));
    if (!Number.isFinite(raw)) {
      return undefined;
    }
    const uom = String(st.attributes?.unit_of_measurement ?? "").toUpperCase();
    if (/\bF\b|°F|ºF/.test(uom) || uom.includes("FAHRENHEIT")) {
      return { value: raw, unit: "F" };
    }
    if (/\bC\b|°C|ºC/.test(uom) || uom.includes("CELSIUS")) {
      return { value: raw, unit: "C" };
    }
    return {
      value: raw,
      unit: this._hassSystemUsesFahrenheit() ? "F" : "C",
    };
  }

  private _toCelsius(value: number, unit: "C" | "F"): number {
    return unit === "F" ? ((value - 32) * 5) / 9 : value;
  }

  private _formatCornerTemperature(): string | null {
    const eid = this.config?.corner_temperature_entity?.trim();
    if (!eid || !this.hass) {
      return null;
    }
    const parsed = this._parseTemperatureNative(eid);
    if (!parsed) {
      return null;
    }
    const celsius = this._toCelsius(parsed.value, parsed.unit);
    const pref = this.config?.corner_temperature_unit ?? "auto";
    const showF =
      pref === "fahrenheit" ||
      (pref === "auto" && this._hassSystemUsesFahrenheit());
    if (showF) {
      const fahr = (celsius * 9) / 5 + 32;
      return `${Math.round(fahr)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  private _cornerTimeLabel(): string {
    const lang =
      this.hass?.locale?.language ??
      (typeof navigator !== "undefined" ? navigator.language : undefined);
    const opts: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
    };
    if (this.config?.show_corner_seconds === true) {
      opts.second = "2-digit";
    }
    try {
      return new Date().toLocaleTimeString(lang, opts);
    } catch {
      return new Date().toLocaleTimeString(undefined, opts);
    }
  }

  /**
   * Resolve which `weather.*` entity to use for state name and icon. Prefers
   * `corner_weather_entity` when set, otherwise falls back to
   * `corner_temperature_entity` if that is itself a weather entity.
   */
  private _cornerWeatherEntityId(): string | undefined {
    const explicit = this.config?.corner_weather_entity?.trim();
    if (explicit && explicit.startsWith("weather.")) {
      return explicit;
    }
    const tempEnt = this.config?.corner_temperature_entity?.trim();
    if (tempEnt && tempEnt.startsWith("weather.")) {
      return tempEnt;
    }
    return undefined;
  }

  private _cornerWeatherStateLabel(): string | null {
    const eid = this._cornerWeatherEntityId();
    if (!eid || !this.hass) {
      return null;
    }
    const st = this.hass.states[eid];
    if (!st || !st.state || st.state === "unknown" || st.state === "unavailable") {
      return null;
    }
    if (typeof this.hass.formatEntityState === "function") {
      try {
        const formatted = this.hass.formatEntityState(st);
        if (formatted && formatted.length > 0) {
          return formatted;
        }
      } catch {
        /* fall through to manual title-casing below */
      }
    }
    return st.state
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private _cornerWeatherIcon(): string | null {
    const eid = this._cornerWeatherEntityId();
    if (!eid || !this.hass) {
      return null;
    }
    const st = this.hass.states[eid];
    if (!st) {
      return null;
    }
    const explicitIcon = st.attributes?.icon;
    if (typeof explicitIcon === "string" && explicitIcon.length > 0) {
      return explicitIcon;
    }
    return WEATHER_ICON_MAP[st.state] ?? "mdi:weather-cloudy";
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.config?.entity || !this.hass) {
      return html`<div class="body subtle">Configure entity</div>`;
    }

    const ent = this._entity;
    if (!ent) {
      return html`<div class="body subtle">Entity not found</div>`;
    }

    const a = ent.attributes;
    const pic = this._pic();
    const title = (a.media_title as string) ?? "Nothing playing";
    const artist =
      (a.media_artist as string) ??
      (a.media_album_name as string) ??
      "";
    const src = (a.source as string) ?? "";
    const srcList = (a.source_list as string[] | undefined) ?? [];
    const vol = (a.volume_level as number | undefined) ?? 0;
    const shuffle = Boolean(a.shuffle);
    const repeat = (a.repeat as string) ?? "off";
    const dur = (a.media_duration as number | undefined) ?? 0;
    const rawPos = (a.media_position as number | undefined) ?? 0;
    const updatedAt = a.media_position_updated_at as string | undefined;
    let pos = rawPos;
    const playing = ent.state === "playing";
    if (playing && dur > 0 && updatedAt) {
      const t = Date.parse(updatedAt);
      if (!Number.isNaN(t)) {
        pos = Math.min(dur, rawPos + (Date.now() - t) / 1000);
      }
    }
    const pct = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0;

    const align = this.config.cover_align ?? "center";
    const coverClass =
      align === "left"
        ? "cover-left"
        : align === "right"
          ? "cover-right"
          : "cover-center";

    const metaV: MetaVerticalAlign =
      this.config.meta_vertical_align === "top" ||
      this.config.meta_vertical_align === "bottom"
        ? this.config.meta_vertical_align
        : "center";

    const showUpNext = this.config.show_up_next !== false;
    const nextTitle =
      String(a.media_next_title ?? "").trim() || "";
    const nextArtist =
      String(a.media_next_artist ?? "").trim() || "";
    const nextThumb =
      String(a.media_next_thumbnail ?? "").trim() || "";
    const hasUpNext = showUpNext && nextTitle.length > 0;

    const supportedFeat = Number(a.supported_features ?? 0);
    const showBrowseBtn =
      this.config.show_browse_media_button !== false &&
      (supportedFeat === 0 ||
        (supportedFeat & MEDIA_PLAYER_FEATURE_BROWSE_MEDIA) !== 0);

    const showCornerTime = this.config.show_corner_time === true;
    const showCornerTemperature =
      this.config.show_corner_temperature === true;
    const weatherEid = this._cornerWeatherEntityId();
    const weatherLabel =
      this.config.show_corner_weather === true && weatherEid
        ? this._cornerWeatherStateLabel()
        : null;
    const weatherIcon =
      this.config.show_corner_weather_icon === true && weatherEid
        ? this._cornerWeatherIcon()
        : null;
    const showCornerClimate =
      showCornerTime ||
      showCornerTemperature ||
      Boolean(weatherLabel) ||
      Boolean(weatherIcon);

    return html`
      <div class="card-shell">
        <div class="wrap">
          <div
            class="backdrop ${pic ? "" : "backdrop-fallback"}"
            style=${pic ? `background-image:url("${pic}")` : ""}
          ></div>
          <div class="scrim"></div>
          ${showCornerClimate
            ? html`
                <div class="corner-climate" aria-label="Time and weather">
                  ${weatherIcon
                    ? html`<ha-icon
                        class="corner-climate-icon"
                        .icon=${weatherIcon}
                      ></ha-icon>`
                    : nothing}
                  <div class="corner-climate-text">
                    ${showCornerTime
                      ? html`<div class="corner-time">
                          ${this._cornerTimeLabel()}
                        </div>`
                      : nothing}
                    ${showCornerTemperature
                      ? html`<div class="corner-temp">
                          ${this._formatCornerTemperature() ?? "—"}
                        </div>`
                      : nothing}
                    ${weatherLabel
                      ? html`<div class="corner-weather">${weatherLabel}</div>`
                      : nothing}
                  </div>
                </div>
              `
            : nothing}
          <div class="body">
            <div class="top ${coverClass} meta-v-${metaV}">
              <div class="art">
                ${pic
                  ? html`<img src=${pic} alt="" />`
                  : html`<div
                      style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;opacity:.35"
                    >
                      ♪
                    </div>`}
              </div>
              <div class="meta-region">
                <div class="meta">
                  ${this.config.name
                    ? html`<span class="label">${this.config.name}</span>`
                    : html`<span class="label">Now playing</span>`}
                  <h2>${title}</h2>
                  ${artist ? html`<p class="artist">${artist}</p>` : nothing}
                  ${dur > 0
                    ? html`
                        <div class="progress-wrap">
                          <div class="progress-bar">
                            <div
                              class="progress-fill"
                              style="width:${pct}%"
                            ></div>
                          </div>
                          <div class="time-row">
                            <span>${this._fmtTime(pos)}</span>
                            <span>${this._fmtTime(dur)}</span>
                          </div>
                        </div>
                      `
                    : nothing}
                </div>
              </div>
            </div>

            <div class="bottom-stack">
            <div class="glass-panel controls-main">
              <div class="transport-side-left">
                <button
                  class="ctrl-btn ${repeat !== "off" ? "active" : ""}"
                  @click=${() => {
                    const next =
                      repeat === "off"
                        ? "all"
                        : repeat === "all"
                          ? "one"
                          : "off";
                    return this._callService("repeat_set", { repeat: next });
                  }}
                  title="Repeat"
                >
                  <ha-icon
                    icon=${repeat === "one"
                      ? "mdi:repeat-once"
                      : "mdi:repeat"}
                  ></ha-icon>
                </button>
                <button
                  class="ctrl-btn ${shuffle ? "active" : ""}"
                  @click=${() =>
                    this._callService("shuffle_set", { shuffle: !shuffle })}
                  title="Shuffle"
                >
                  <ha-icon icon="mdi:shuffle"></ha-icon>
                </button>
              </div>
              <div class="transport-cluster">
                <button
                  class="ctrl-btn"
                  @click=${() => this._callService("media_previous_track")}
                  title="Previous"
                >
                  <ha-icon icon="mdi:skip-previous"></ha-icon>
                </button>
                <button
                  class="ctrl-btn primary"
                  @click=${() => this._callService("media_play_pause")}
                  title=${playing ? "Pause" : "Play"}
                >
                  <ha-icon
                    icon=${playing ? "mdi:pause" : "mdi:play"}
                    style="font-size:28px"
                  ></ha-icon>
                </button>
                <button
                  class="ctrl-btn"
                  @click=${() => this._callService("media_next_track")}
                  title="Next"
                >
                  <ha-icon icon="mdi:skip-next"></ha-icon>
                </button>
              </div>
              <div class="transport-side-right">
                ${showBrowseBtn
                  ? html`
                      <button
                        type="button"
                        class="ctrl-btn browse-icon-btn"
                        title="Media library"
                        @click=${() => this._navigateToHaMediaBrowser()}
                      >
                        <ha-icon
                          icon="mdi:play-box-multiple-outline"
                        ></ha-icon>
                      </button>
                    `
                  : nothing}
              </div>
            </div>

          <div class="glass-panel vol-row">
            <button
              class="ctrl-btn"
              style="width:44px;height:44px;flex-shrink:0"
              title="Volume down 5%"
              @click=${() => this._adjustVolumeLevel(-0.05)}
            >
              <ha-icon icon="mdi:volume-minus"></ha-icon>
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${String(Math.round(vol * 100))}
              @input=${(ev: Event) => {
                const v = Number((ev.target as HTMLInputElement).value) / 100;
                void this._callService("volume_set", { volume_level: v });
              }}
            />
            <button
              class="ctrl-btn"
              style="width:44px;height:44px;flex-shrink:0"
              title="Volume up 5%"
              @click=${() => this._adjustVolumeLevel(0.05)}
            >
              <ha-icon icon="mdi:volume-plus"></ha-icon>
            </button>
          </div>

          <div
            class="glass-panel ${this.config.source_tablet_mode === true
              ? "source-tablet"
              : ""}"
          >
            <div class="source-row">
              <div>
                <label>Source</label>
                <span class="subtle">${src || "—"}</span>
              </div>
              ${srcList.length
                ? html`
                    <select
                      class="source-select"
                      .value=${src}
                      @change=${(ev: Event) => {
                        const v = (ev.target as HTMLSelectElement).value;
                        void this._callService("select_source", {
                          source: v,
                        });
                      }}
                    >
                      ${srcList.map(
                        (s) =>
                          html`<option value=${s} .selected=${s === src}>
                            ${s}
                          </option>`,
                      )}
                    </select>
                  `
                : nothing}
            </div>
          </div>

            </div>
          </div>
          ${hasUpNext
            ? html`
                <aside class="up-next" aria-label="Up next">
                  ${nextThumb
                    ? html`<img
                          class="up-next-cover"
                          src=${nextThumb}
                          alt=""
                          loading="lazy"
                        />`
                    : html`<div
                        class="up-next-cover"
                        style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;opacity:.5"
                      >
                        <ha-icon icon="mdi:music-note"></ha-icon>
                      </div>`}
                  <div class="up-next-copy">
                    <p class="up-next-label">Up next</p>
                    <p class="up-next-title">${nextTitle}</p>
                    ${nextArtist
                      ? html`<p class="up-next-artist">${nextArtist}</p>`
                      : nothing}
                  </div>
                </aside>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
