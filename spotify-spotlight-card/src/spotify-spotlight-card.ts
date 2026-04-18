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
import { customElement, property, state } from "lit/decorators.js";

import type { CoverAlign, SpotifySpotlightCardConfig } from "./spotify-config";

export type { SpotifySpotlightCardConfig } from "./spotify-config";

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
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ): Promise<void>;
}

/** Same as Home Assistant `MediaPlayerEntityFeature.BROWSE_MEDIA` */
const MEDIA_PLAYER_FEATURE_BROWSE_MEDIA = 1 << 17;

/** Navigate like `navigate()` in HA frontend (opens Media panel for entity). */
function navigateFrontend(path: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.history.pushState(null, "", path);
  window.dispatchEvent(
    new CustomEvent("location-changed", {
      bubbles: true,
      composed: true,
      detail: { replace: false },
    }),
  );
}

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
      poll_interval_seconds: 5,
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

    this.config = {
      type: "custom:spotify-spotlight-card",
      entity,
      tall: raw.tall !== false,
      name: typeof raw.name === "string" ? raw.name : undefined,
      show_up_next: raw.show_up_next !== false,
      show_browse_media_button: raw.show_browse_media_button !== false,
      cover_align,
      poll_interval_seconds,
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
      color: var(--spot-text);
      font-family: var(--ha-font-family-body, ui-sans-serif, system-ui);
      -webkit-font-smoothing: antialiased;
    }

    :host([data-tall]) {
      min-height: calc(100vh - 140px);
    }

    .wrap {
      position: relative;
      border-radius: var(--spot-radius);
      overflow: hidden;
      min-height: inherit;
      box-sizing: border-box;
      isolation: isolate;
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

    /** Wraps now-playing meta + optional up-next (side-by-side or stacked). */
    .now-playing-row {
      flex: 1 1 220px;
      min-width: 0;
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      gap: 14px 18px;
    }

    .top.cover-center .now-playing-row {
      width: 100%;
      justify-content: center;
    }

    .up-next {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px 10px 10px;
      flex: 0 1 auto;
      max-width: min(320px, 100%);
      box-sizing: border-box;
      background: var(--spot-glass-strong);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
      text-align: left;
    }

    .up-next-cover {
      width: 56px;
      height: 56px;
      border-radius: 10px;
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
      font-size: 0.68rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--spot-muted);
      margin: 0 0 4px;
    }

    .up-next-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.25;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .up-next-artist {
      margin: 4px 0 0;
      font-size: 0.82rem;
      color: var(--spot-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .top {
      display: flex;
      gap: 20px;
      align-items: stretch;
      flex-wrap: wrap;
    }

    .top.cover-left {
      flex-direction: row;
      justify-content: flex-start;
      align-items: flex-end;
    }

    .top.cover-center {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .top.cover-center .meta {
      align-items: center;
      text-align: center;
    }

    .top.cover-center .now-playing-row .meta {
      flex: 1 1 min(420px, 100%);
      max-width: min(420px, 100%);
    }

    .top.cover-center .progress-wrap {
      width: 100%;
      max-width: 420px;
    }

    .top.cover-right {
      flex-direction: row-reverse;
      justify-content: flex-start;
      align-items: flex-end;
    }

    .art {
      flex: 0 0 auto;
      width: min(240px, 42vw);
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
      flex: 1 1 200px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }

    .label {
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--spot-muted);
    }

    h2 {
      margin: 0;
      font-weight: 650;
      font-size: clamp(1.35rem, 3vw, 1.85rem);
      line-height: 1.15;
      text-shadow: 0 2px 24px rgba(0, 0, 0, 0.55);
      word-break: break-word;
    }

    .artist {
      margin: 0;
      font-size: 1.05rem;
      color: var(--spot-muted);
      font-weight: 450;
    }

    .progress-wrap {
      margin-top: 8px;
    }

    .progress-bar {
      display: block;
      height: 4px;
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
      font-size: 0.75rem;
      color: var(--spot-muted);
      margin-top: 6px;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
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

    .browse-media-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px 18px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.1);
      color: var(--spot-text);
      font: inherit;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
    }

    .browse-media-btn:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .browse-media-btn:active {
      transform: scale(0.99);
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

    this._tickTimer = window.setInterval(() => {
      const st = this.hass?.states[id];
      if (st?.state === "playing") {
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

  private _openHaMediaBrowser(): void {
    const id = this.config?.entity;
    if (!id) {
      return;
    }
    navigateFrontend(`/media-browser/${id}`);
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

    return html`
      <div class="wrap">
        <div
          class="backdrop ${pic ? "" : "backdrop-fallback"}"
          style=${pic ? `background-image:url("${pic}")` : ""}
        ></div>
        <div class="scrim"></div>
        <div class="body">
          <div class="top ${coverClass}">
            <div class="art">
              ${pic
                ? html`<img src=${pic} alt="" />`
                : html`<div
                    style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;opacity:.35"
                  >
                    ♪
                  </div>`}
            </div>
            <div class="now-playing-row">
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

          <div class="glass-panel controls-main">
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
            <button
              class="ctrl-btn ${shuffle ? "active" : ""}"
              @click=${() =>
                this._callService("shuffle_set", { shuffle: !shuffle })}
              title="Shuffle"
            >
              <ha-icon icon="mdi:shuffle"></ha-icon>
            </button>
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

          <div class="glass-panel">
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

          ${showBrowseBtn
            ? html`
                <div class="glass-panel">
                  <button
                    type="button"
                    class="browse-media-btn"
                    @click=${() => this._openHaMediaBrowser()}
                  >
                    <ha-icon icon="mdi:play-box-multiple-outline"></ha-icon>
                    <span>Media library</span>
                  </button>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
