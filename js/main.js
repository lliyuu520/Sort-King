/**
 * 浏览器原型入口：装配 DOM 画布与指针事件，渲染与逻辑都在 Render / Game 里。
 * 上线入口是小游戏 game.js；本文件仅用于浏览器对照调试。
 */
(function () {
  const canvas = Platform.createCanvas("game");

  Render.init({
    canvas,
    view: Platform.view,
    setCanvasSize(w, h, cssW, cssH) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
    },
    bindPointer: Platform.bindPointer,
    frame: Platform.frame,
    onResize: Platform.onResize,
    loadSprite(item, done) {
      const img = Platform.createImage();
      if (!img) return done(null);
      img.onload = () => done(img);
      img.onerror = () => done(null);
      img.src = item.img;
    },
    privacy: {
      agreed: () => Platform.storage.get("sortking_privacy") === "1",
      agree: () => Platform.storage.set("sortking_privacy", "1"),
    },
  });

  GameAudio.setEnabled(Game.state.progress.sound);
})();
