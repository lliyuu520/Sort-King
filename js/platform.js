/**
 * 平台适配层：同一套逻辑与渲染跑在「浏览器原型」和「微信小游戏」两种宿主上。
 * 逻辑层只依赖本模块，不直接碰 wx / document，便于后续迁移。
 */
const Platform = (() => {
  const wxApi = typeof wx !== "undefined" ? wx : null;
  const isWx = !!(wxApi && typeof wxApi.createCanvas === "function");

  function now() {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  }

  // ---------- 存储 ----------
  function getItem(key) {
    try {
      if (isWx) {
        const v = wxApi.getStorageSync(key);
        return v === "" || v == null ? null : v;
      }
      if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    } catch (_) {}
    return null;
  }
  function setItem(key, value) {
    try {
      if (isWx) wxApi.setStorageSync(key, value);
      else if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch (_) {}
  }
  function getJSON(key) {
    const raw = getItem(key);
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  function setJSON(key, obj) {
    setItem(key, JSON.stringify(obj));
  }

  // ---------- 振动 ----------
  function vibrate(ms) {
    const d = ms || 30;
    if (!isWx) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(d);
        } catch (_) {}
      }
      return;
    }
    try {
      if (d > 30) wxApi.vibrateLong({});
      else wxApi.vibrateShort({ type: "light" });
    } catch (_) {}
  }

  // ---------- 视图：尺寸 / DPR / 安全区 / 胶囊 ----------
  /** 返回值单位是屏幕逻辑像素，与画布绘制坐标一致 */
  function view() {
    if (isWx) {
      let info = null;
      try {
        info =
          typeof wxApi.getWindowInfo === "function" ? wxApi.getWindowInfo() : wxApi.getSystemInfoSync();
      } catch (_) {}
      if (!info) {
        info = { windowWidth: 375, windowHeight: 667, pixelRatio: 2, statusBarHeight: 20, safeArea: null };
      }
      const width = info.windowWidth || 375;
      const height = info.windowHeight || 667;

      let capsuleBottom = 0;
      try {
        const mb =
          typeof wxApi.getMenuButtonBoundingClientRect === "function"
            ? wxApi.getMenuButtonBoundingClientRect()
            : null;
        if (mb && mb.height > 0) capsuleBottom = mb.bottom;
      } catch (_) {}

      const safeTop = Math.max((info.safeArea && info.safeArea.top) || 0, info.statusBarHeight || 0);
      const safeBottom =
        info.safeArea && info.safeArea.bottom != null
          ? Math.max(0, height - info.safeArea.bottom)
          : 0;

      return {
        width,
        height,
        dpr: Math.min(Math.max(info.pixelRatio || 1, 1), 2),
        safeTop,
        safeBottom: Math.min(safeBottom, height * 0.12),
        capsuleBottom: capsuleBottom || safeTop + 46,
      };
    }

    // 浏览器原型
    const width = typeof window !== "undefined" ? window.innerWidth : 375;
    const height = typeof window !== "undefined" ? window.innerHeight : 667;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return {
      width,
      height,
      dpr: Math.min(Math.max(dpr, 1), 2),
      safeTop: 0,
      safeBottom: 0,
      capsuleBottom: 0,
    };
  }

  function createImage() {
    if (isWx) return wxApi.createImage();
    return typeof Image !== "undefined" ? new Image() : null;
  }

  /** 微信侧首次调用即上屏画布；浏览器侧取已有 canvas */
  function createCanvas(id) {
    if (isWx) return wxApi.createCanvas();
    return document.getElementById(id || "game");
  }

  function bindPointer(handlers) {
    if (isWx) {
      wxApi.onTouchStart((e) => {
        const t = e.touches && e.touches[0];
        if (t) handlers.down(t.clientX, t.clientY);
      });
      wxApi.onTouchMove((e) => {
        const t = e.touches && e.touches[0];
        if (t) handlers.move(t.clientX, t.clientY);
      });
      wxApi.onTouchEnd((e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (t) handlers.up(t.clientX, t.clientY);
      });
      wxApi.onTouchCancel(() => handlers.cancel());
      return;
    }
    const canvas = document.getElementById("game");
    const pos = (e) =>
      e.touches && e.touches[0]
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : e.changedTouches && e.changedTouches[0]
          ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
          : { x: e.clientX, y: e.clientY };
    const bind = (target, type, fn, opts) =>
      target.addEventListener(type, (e) => {
        if (e.touches && e.touches.length > 1) return;
        if (e.preventDefault && type !== "mousemove") e.preventDefault();
        const p = pos(e);
        fn(p.x, p.y);
      }, opts);
    bind(canvas, "mousedown", handlers.down);
    bind(window, "mousemove", handlers.move);
    bind(window, "mouseup", handlers.up);
    bind(canvas, "touchstart", handlers.down, { passive: false });
    bind(canvas, "touchmove", handlers.move, { passive: false });
    bind(canvas, "touchend", handlers.up, { passive: false });
    bind(canvas, "touchcancel", () => handlers.cancel(), { passive: false });
  }

  function frame(cb) {
    if (isWx && typeof wxApi.requestAnimationFrame === "function") return wxApi.requestAnimationFrame(cb);
    if (typeof requestAnimationFrame === "function") return requestAnimationFrame(cb);
    return setTimeout(() => cb(now()), 16);
  }

  function onResize(cb) {
    if (isWx) {
      if (typeof wxApi.onWindowResize === "function") wxApi.onWindowResize(cb);
      return;
    }
    if (typeof window !== "undefined") window.addEventListener("resize", cb);
  }

  function onLifecycle(onShow, onHide) {
    if (!isWx) {
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) onHide();
          else onShow();
        });
      }
      return;
    }
    if (typeof wxApi.onShow === "function") wxApi.onShow(onShow);
    if (typeof wxApi.onHide === "function") wxApi.onHide(onHide);
  }

  return {
    isWx,
    now,
    storage: { get: getItem, set: setItem, getJSON, setJSON },
    vibrate,
    view,
    createImage,
    createCanvas,
    bindPointer,
    frame,
    onResize,
    onLifecycle,
  };
})();

if (typeof globalThis !== "undefined") globalThis.Platform = Platform;
if (typeof module !== "undefined" && module.exports) module.exports = { Platform };
