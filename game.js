/**
 * 微信小游戏入口：装配 wx 画布与触摸事件，渲染与逻辑都在 Render / Game 里。
 * 未就绪的物品图先用 emoji 占位；CDN 图上线后把 USE_CDN 打开即可。
 */
const Platform = require("./js/platform.js").Platform;

require("./js/i18n.js");
require("./js/levels.js");
require("./js/audio.js");
require("./js/game.js");

const Render = require("./js/render.js").Render;

/** 物品图 CDN（与怒雷同桶，前缀为本游戏自己的） */
const CDN_BASE = "https://oss.lliyuu520.cn/sortking/items/";
/** 图还没上传到 CDN 前保持关闭，直接走 emoji 占位，避免无谓的网络等待 */
const USE_CDN = false;

const canvas = Platform.createCanvas();

Render.init({
  canvas,
  view: Platform.view,
  setCanvasSize(w, h) {
    canvas.width = w;
    canvas.height = h;
  },
  bindPointer: Platform.bindPointer,
  frame: Platform.frame,
  onResize: Platform.onResize,
  loadSprite(item, done) {
    if (!USE_CDN) return done(null);
    const img = Platform.createImage();
    if (!img) return done(null);
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = CDN_BASE + item.key + ".png";
  },
  privacy: {
    agreed: () => Platform.storage.get("sortking_privacy") === "1",
    agree: () => Platform.storage.set("sortking_privacy", "1"),
  },
});

GameAudio.setEnabled(Game.state.progress.sound);
