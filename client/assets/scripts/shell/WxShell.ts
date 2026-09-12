import { game, sys, view, screen, Rect } from "cc";
import { STORAGE_PRIVACY } from "../game/catalog";

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  getJSON(key: string): unknown;
  setJSON(key: string, value: unknown): void;
}

export interface SafeInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

declare const wx: {
  vibrateShort?: (opts: { type?: string }) => void;
  vibrateLong?: (opts?: object) => void;
  getMenuButtonBoundingClientRect?: () => { top: number; bottom: number; height: number; right: number; width: number };
  getWindowInfo?: () => { pixelRatio?: number; windowWidth?: number; windowHeight?: number; statusBarHeight?: number; safeArea?: { top: number; bottom: number } };
  getSystemInfoSync?: () => { pixelRatio?: number; windowWidth?: number; windowHeight?: number; statusBarHeight?: number; safeArea?: { top: number; bottom: number } };
  onShow?: (cb: () => void) => void;
  onHide?: (cb: () => void) => void;
} | undefined;

function wxApi() {
  return typeof wx !== "undefined" ? wx : null;
}

export const memoryStore: Record<string, string> = {};

export const storage: StorageAdapter = {
  get(key: string): string | null {
    try {
      const v = sys.localStorage.getItem(key);
      return v == null || v === "" ? null : v;
    } catch (_) {
      return memoryStore[key] ?? null;
    }
  },
  set(key: string, value: string): void {
    try {
      sys.localStorage.setItem(key, value);
    } catch (_) {
      memoryStore[key] = value;
    }
  },
  getJSON(key: string): unknown {
    const raw = this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },
  setJSON(key: string, value: unknown): void {
    this.set(key, JSON.stringify(value));
  },
};

export function vibrate(ms: number): void {
  const api = wxApi();
  if (api) {
    try {
      if (ms > 30 && api.vibrateLong) api.vibrateLong({});
      else if (api.vibrateShort) api.vibrateShort({ type: "light" });
    } catch (_) {}
    return;
  }
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms || 30);
  } catch (_) {}
}

export function privacyAgreed(): boolean {
  return storage.get(STORAGE_PRIVACY) === "1";
}

export function agreePrivacy(): void {
  storage.set(STORAGE_PRIVACY, "1");
}

function safeAreaRect(): Rect {
  const visible = view.getVisibleSize();
  const fallback = new Rect(0, 0, visible.width, visible.height);
  const anyView = view as unknown as { getSafeAreaRect?: () => Rect };
  if (typeof anyView.getSafeAreaRect === "function") {
    try {
      return anyView.getSafeAreaRect.call(view) || fallback;
    } catch (_) {}
  }
  const anySys = sys as unknown as { getSafeAreaRect?: () => Rect };
  if (typeof anySys.getSafeAreaRect === "function") {
    try {
      return anySys.getSafeAreaRect.call(sys) || fallback;
    } catch (_) {}
  }
  return fallback;
}

export function safeInsets(): SafeInsets {
  const visible = view.getVisibleSize();
  const sa = safeAreaRect();
  let top = Math.max(0, visible.height - sa.y - sa.height);
  let bottom = Math.max(0, sa.y);
  let left = Math.max(0, sa.x);
  let right = Math.max(0, visible.width - sa.x - sa.width);

  const api = wxApi();
  if (api) {
    try {
      const info = api.getWindowInfo ? api.getWindowInfo() : api.getSystemInfoSync ? api.getSystemInfoSync() : null;
      const mb = api.getMenuButtonBoundingClientRect ? api.getMenuButtonBoundingClientRect() : null;
      const dpr = info?.pixelRatio || screen.devicePixelRatio || 1;
      const winH = info?.windowHeight || visible.height / dpr;
      const scale = visible.height / winH;
      const status = (info?.statusBarHeight || 0) * scale;
      const capsuleBottom = mb && mb.height > 0 ? mb.bottom * scale : 0;
      top = Math.max(top, status, capsuleBottom + 8);
      if (info?.safeArea) {
        bottom = Math.max(bottom, (winH - info.safeArea.bottom) * scale);
      }
    } catch (_) {}
  }
  return { top, bottom, left, right };
}

export let paused = false;
const pauseListeners: Array<(v: boolean) => void> = [];

export function onPauseChange(cb: (v: boolean) => void): void {
  pauseListeners.push(cb);
}

function setPaused(v: boolean): void {
  if (paused === v) return;
  paused = v;
  for (const cb of pauseListeners) cb(v);
}

let lifecycleBound = false;

export function bindLifecycle(): void {
  if (lifecycleBound) return;
  lifecycleBound = true;
  game.on("game_on_hide", () => setPaused(true));
  game.on("game_on_show", () => setPaused(false));
  const api = wxApi();
  if (api) {
    try {
      if (api.onHide) api.onHide(() => setPaused(true));
      if (api.onShow) api.onShow(() => setPaused(false));
    } catch (_) {}
  }
}

export const silentAudio = {
  spawn() {},
  pick() {},
  place() {},
  reject() {},
  clear() {},
  combo() {},
  win() {},
};
