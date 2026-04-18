/**
 * Spotify Spotlight — Lovelace card with blurred artwork, transport, volume, playlists.
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
  callWS(msg: Record<string, unknown>): Promise<unknown>;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ): Promise<void>;
}

interface BrowseMedia {
  title: string;
  media_class?: string;
  media_content_type?: string | null;
  media_content_id?: string | null;
  thumbnail?: string | null;
  children?: BrowseMedia[];
  can_play?: boolean;
  can_expand?: boolean;
}

function formatHassError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string") {
      return o.message;
    }
    if (typeof o.reason === "string") {
      return o.reason;
    }
    try {
      return JSON.stringify(o);
    } catch {
      return "Unknown error";
    }
  }
  return String(err);
}

function safeTitle(m: BrowseMedia): string {
  const t = m.title;
  return typeof t === "string" ? t : "";
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "spotify-spotlight-card",
  name: "Spotify Spotlight",
  description:
    "Spotify controls with blurred artwork, volume, playlists, and up next",
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
      show_playlists: true,
      show_media_library: true,
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
    const lim = raw.playlist_limit;
    const playlist_limit =
      typeof lim === "number" &&
      Number.isFinite(lim) &&
      lim >= 1 &&
      lim <= 500
        ? Math.floor(lim)
        : undefined;

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
      playlist_limit,
      show_up_next: raw.show_up_next !== false,
      show_playlists: raw.show_playlists !== false,
      show_media_library: raw.show_media_library !== false,
      cover_align,
      poll_interval_seconds,
    };
  }

  @state() private _playlists: BrowseMedia[] = [];

  @state() private _browseError: string | null = null;

  @state() private _loadingLists = false;

  /** Avoid hammering browse_media on every state update */
  private _playlistLoadedForEntity: string | null = null;

  /** Cached `browse_media(null,null)` per entity */
  private _cachedRootBrowse: BrowseMedia | null = null;

  private _cachedRootEntity: string | null = null;

  @state() private _librarySections: BrowseMedia[] = [];

  @state() private _libraryItems: BrowseMedia[] = [];

  @state() private _libraryLoading = false;

  @state() private _libraryError: string | null = null;

  private _libraryStack: Array<{
    type: string | null;
    id: string | null;
    title: string;
  }> = [];

  private _activeLibrarySection: BrowseMedia | null = null;

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

    .body.has-up-next {
      padding-bottom: 112px;
    }

    .up-next {
      position: absolute;
      bottom: 20px;
      right: 20px;
      left: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px 10px 10px;
      max-width: min(320px, calc(100% - 48px));
      background: var(--spot-glass-strong);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      z-index: 6;
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
      width: 100%;
      text-align: center;
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

    .playlist-strip {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 6px;
      scrollbar-width: thin;
    }

    .pl-chip {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.08);
      cursor: pointer;
      color: var(--spot-text);
      font-size: 0.9rem;
      max-width: 240px;
      transition: background 0.15s ease;
    }

    .pl-chip:hover {
      background: rgba(255, 255, 255, 0.16);
    }

    .pl-chip img {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .pl-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .library-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-bottom: 10px;
    }

    .library-toolbar select.field {
      flex: 1;
      min-width: 200px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: var(--spot-glass-strong);
      color: var(--spot-text);
      font: inherit;
    }

    .library-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
      padding: 4px 0;
    }

    .library-item {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 100%;
      padding: 8px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.07);
      cursor: pointer;
      color: var(--spot-text);
      font-size: 0.88rem;
      text-align: left;
    }

    .library-item:hover {
      background: rgba(255, 255, 255, 0.14);
    }

    .library-item img {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .breadcrumb {
      font-size: 0.78rem;
      color: var(--spot-muted);
      flex: 1 1 auto;
      min-width: 120px;
    }

    .section-title {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--spot-muted);
      letter-spacing: 0.04em;
    }

    .error {
      font-size: 0.85rem;
      color: #ffb4b4;
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
      if (id !== this._cachedRootEntity) {
        this._invalidateBrowseCache();
        this._libraryStack = [];
        this._activeLibrarySection = null;
        this._libraryItems = [];
        this._librarySections = [];
        this._playlistLoadedForEntity = null;
      }
    }

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

    if (!this.hass || !id) {
      return;
    }

    if (changed.has("config") || this._playlistLoadedForEntity !== id) {
      this._playlistLoadedForEntity = id;
      if (this.config?.show_playlists !== false) {
        void this._loadPlaylists();
      } else {
        this._playlists = [];
        this._browseError = null;
      }
      if (this.config?.show_media_library !== false) {
        void this._syncLibrarySections();
      } else {
        this._librarySections = [];
        this._libraryItems = [];
        this._libraryError = null;
      }
    }
  }

  private _invalidateBrowseCache(): void {
    this._cachedRootBrowse = null;
    this._cachedRootEntity = null;
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

  private async _getRootBrowse(): Promise<BrowseMedia> {
    const id = this.config?.entity;
    if (!this.hass || !id) {
      throw new Error("No connection");
    }
    if (this._cachedRootBrowse && this._cachedRootEntity === id) {
      return this._cachedRootBrowse;
    }
    const lib = await this._browse(null, null);
    this._cachedRootBrowse = lib;
    this._cachedRootEntity = id;
    return lib;
  }

  private async _syncLibrarySections(): Promise<void> {
    if (
      !this.hass ||
      !this.config?.entity ||
      this.config.show_media_library === false
    ) {
      return;
    }
    this._libraryLoading = true;
    this._libraryError = null;
    try {
      const lib = await this._getRootBrowse();
      this._librarySections = lib.children ?? [];
      if (this._activeLibrarySection) {
        const sid = this._activeLibrarySection.media_content_id;
        const stype = this._activeLibrarySection.media_content_type;
        const still = this._librarySections.find(
          (c) => c.media_content_id === sid && c.media_content_type === stype,
        );
        if (!still) {
          this._activeLibrarySection = null;
          this._libraryStack = [];
          this._libraryItems = [];
        }
      }
    } catch (e) {
      this._libraryError = formatHassError(e);
      this._librarySections = [];
    } finally {
      this._libraryLoading = false;
      this.requestUpdate();
    }
  }

  private async _loadLibraryFolder(
    media_content_type: string | null,
    media_content_id: string | null,
  ): Promise<void> {
    if (!this.hass || !this.config?.entity) {
      return;
    }
    this._libraryLoading = true;
    this._libraryError = null;
    try {
      const res = await this._browse(media_content_type, media_content_id);
      this._libraryItems = res.children ?? [];
    } catch (e) {
      this._libraryError = formatHassError(e);
      this._libraryItems = [];
    } finally {
      this._libraryLoading = false;
      this.requestUpdate();
    }
  }

  private _onLibrarySectionChange(ev: Event): void {
    const sel = ev.target as HTMLSelectElement;
    const raw = sel.value.trim();
    if (!raw) {
      this._activeLibrarySection = null;
      this._libraryItems = [];
      this._libraryStack = [];
      return;
    }
    const idx = parseInt(raw, 10);
    if (Number.isNaN(idx) || !this._librarySections[idx]) {
      this._activeLibrarySection = null;
      this._libraryItems = [];
      this._libraryStack = [];
      return;
    }
    const sec = this._librarySections[idx];
    this._activeLibrarySection = sec;
    this._libraryStack = [];
    const t = sec.media_content_type;
    const mid = sec.media_content_id;
    if (t != null && mid != null) {
      void this._loadLibraryFolder(t, mid);
    }
  }

  private _libraryBack(): void {
    if (this._libraryStack.length === 0) {
      return;
    }
    this._libraryStack.pop();
    const top = this._libraryStack[this._libraryStack.length - 1];
    if (top?.type != null && top.id != null) {
      void this._loadLibraryFolder(top.type, top.id);
      return;
    }
    const sec = this._activeLibrarySection;
    if (sec?.media_content_type != null && sec.media_content_id != null) {
      void this._loadLibraryFolder(sec.media_content_type, sec.media_content_id);
    }
  }

  private async _libraryItemClick(item: BrowseMedia): Promise<void> {
    const type = item.media_content_type;
    const mid = item.media_content_id;
    const canExpand = item.can_expand === true;
    if (canExpand && type != null && mid != null) {
      this._libraryStack.push({
        type,
        id: mid,
        title: safeTitle(item),
      });
      await this._loadLibraryFolder(type, mid);
      return;
    }
    if (type != null && mid != null && item.can_play !== false) {
      await this._playMediaItem(item);
    }
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

  private async _loadPlaylists(): Promise<void> {
    if (
      !this.hass ||
      !this.config?.entity ||
      this.config.show_playlists === false
    ) {
      return;
    }
    this._loadingLists = true;
    this._browseError = null;
    try {
      const lib = await this._getRootBrowse();
      const playlistsFolder =
        lib.children?.find(
          (c) =>
            c.media_content_id === "current_user_playlists" ||
            safeTitle(c) === "Playlists",
        ) ??
        lib.children?.find((c) =>
          String(c.media_content_id ?? "").includes("playlist"),
        );
      if (
        !playlistsFolder?.media_content_type ||
        !playlistsFolder.media_content_id
      ) {
        this._playlists = [];
        return;
      }
      const pl = await this._browse(
        playlistsFolder.media_content_type,
        playlistsFolder.media_content_id,
      );
      const limit = this.config.playlist_limit ?? 24;
      const children = pl.children ?? [];
      this._playlists = children.slice(0, limit);
    } catch (e) {
      this._browseError = formatHassError(e);
      this._playlists = [];
    } finally {
      this._loadingLists = false;
      this.requestUpdate();
    }
  }

  private async _browse(
    media_content_type: string | null,
    media_content_id: string | null,
  ): Promise<BrowseMedia> {
    const eid = this.config?.entity;
    if (!this.hass || !eid) {
      throw new Error("No connection");
    }
    const result = await this.hass.callWS({
      type: "browse_media",
      entity_id: eid,
      media_content_type,
      media_content_id,
    });
    return result as BrowseMedia;
  }

  private async _playMediaItem(child: BrowseMedia): Promise<void> {
    const eid = this.config?.entity;
    if (!child.media_content_id || !child.media_content_type || !eid) {
      return;
    }
    await this.hass?.callService("media_player", "play_media", {
      entity_id: eid,
      media_content_id: child.media_content_id,
      media_content_type: child.media_content_type,
    });
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
    const muted = Boolean(a.is_volume_muted);
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

    let librarySelectValue = "";
    if (this._activeLibrarySection && this._librarySections.length) {
      const ix = this._librarySections.findIndex(
        (c) =>
          c.media_content_id === this._activeLibrarySection?.media_content_id &&
          c.media_content_type === this._activeLibrarySection?.media_content_type,
      );
      if (ix >= 0) {
        librarySelectValue = String(ix);
      }
    }

    const crumb =
      this._libraryStack.map((s) => s.title).join(" › ") ||
      (this._activeLibrarySection
        ? safeTitle(this._activeLibrarySection)
        : "");

    return html`
      <div class="wrap">
        <div
          class="backdrop ${pic ? "" : "backdrop-fallback"}"
          style=${pic ? `background-image:url("${pic}")` : ""}
        ></div>
        <div class="scrim"></div>
        <div class="body ${hasUpNext ? "has-up-next" : ""}">
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
            <ha-icon icon="mdi:volume-medium"></ha-icon>
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
              style="width:44px;height:44px"
              @click=${() =>
                this._callService("volume_mute", { is_volume_muted: !muted })}
              title=${muted ? "Unmute" : "Mute"}
            >
              <ha-icon
                icon=${muted ? "mdi:volume-off" : "mdi:volume-high"}
              ></ha-icon>
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

          ${this.config.show_media_library !== false
            ? html`
                <div class="glass-panel">
                  <p class="section-title">Media library</p>
                  <div class="library-toolbar">
                    <select
                      class="field"
                      .value=${librarySelectValue}
                      @change=${this._onLibrarySectionChange}
                    >
                      <option value="">Choose library…</option>
                      ${this._librarySections.map(
                        (sec, i) => html`
                          <option value=${String(i)}>
                            ${safeTitle(sec)}
                          </option>
                        `,
                      )}
                    </select>
                    ${this._libraryStack.length
                      ? html`
                          <button
                            type="button"
                            class="ctrl-btn"
                            style="width:auto;height:40px;padding:0 14px"
                            @click=${() => this._libraryBack()}
                          >
                            <ha-icon icon="mdi:arrow-left"></ha-icon>
                            Back
                          </button>
                        `
                      : nothing}
                    ${this._libraryLoading
                      ? html`<span class="subtle">loading…</span>`
                      : nothing}
                  </div>
                  ${crumb
                    ? html`<div class="breadcrumb">${crumb}</div>`
                    : nothing}
                  ${this._libraryError
                    ? html`<div class="error">${this._libraryError}</div>`
                    : nothing}
                  <div class="library-grid">
                    ${this._libraryItems.map(
                      (item) => html`
                        <button
                          type="button"
                          class="library-item"
                          @click=${() => void this._libraryItemClick(item)}
                        >
                          ${item.thumbnail
                            ? html`<img src=${item.thumbnail} alt="" />`
                            : html`<ha-icon icon="mdi:music-note"></ha-icon>`}
                          <span>${safeTitle(item)}</span>
                          ${item.can_expand === true
                            ? html`<ha-icon
                                icon="mdi:chevron-right"
                                style="opacity:.6;margin-left:4px"
                              ></ha-icon>`
                            : nothing}
                        </button>
                      `,
                    )}
                  </div>
                  ${!this._libraryLoading &&
                  !this._libraryItems.length &&
                  this._activeLibrarySection &&
                  !this._libraryError
                    ? html`<div class="subtle">Nothing to show here</div>`
                    : nothing}
                </div>
              `
            : nothing}
          ${this.config.show_playlists !== false
            ? html`
                <div>
                  <p
                    class="section-title"
                    style="display:flex;align-items:center;gap:10px;"
                  >
                    <span>Playlists</span>
                    ${this._loadingLists
                      ? html`<span class="subtle">loading…</span>`
                      : nothing}
                    <button
                      type="button"
                      class="ctrl-btn"
                      style="width:36px;height:36px;margin-left:auto"
                      title="Refresh playlists"
                      @click=${() => void this._loadPlaylists()}
                    >
                      <ha-icon icon="mdi:refresh"></ha-icon>
                    </button>
                  </p>
                  ${this._browseError
                    ? html`<div class="error">${this._browseError}</div>`
                    : nothing}
                  <div class="playlist-strip">
                    ${this._playlists.map(
                      (pl) => html`
                        <button
                          class="pl-chip"
                          @click=${() => void this._playMediaItem(pl)}
                        >
                          ${pl.thumbnail
                            ? html`<img src=${pl.thumbnail} alt="" />`
                            : html`<ha-icon
                                icon="mdi:music-box-multiple"
                              ></ha-icon>`}
                          <span class="pl-title">${safeTitle(pl)}</span>
                        </button>
                      `,
                    )}
                  </div>
                  ${!this._loadingLists &&
                  !this._playlists.length &&
                  !this._browseError
                    ? html`<div class="subtle">No playlists loaded</div>`
                    : nothing}
                </div>
              `
            : nothing}

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
