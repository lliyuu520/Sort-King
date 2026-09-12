/**
 * 渲染 + 输入：平台无关。由入口（浏览器 main.js / 小游戏 game.js）调用 Render.init(env)。
 * env 提供画布、尺寸、指针绑定、计时、贴图加载、隐私同意状态。
 */
const Render = (() => {
  let env = null;
  let canvas = null;
  let ctx = null;

  let W = 0;
  let H = 0;
  let dpr = 1;
  /** 让开刘海/胶囊后，内容整体下移的量（浏览器为 0，与旧版布局一致） */
  let topPad = 0;
  /** 让开底部手势条 */
  let botPad = 0;

  let layout = {
    buttons: [],
    bins: [],
    slots: [],
  };

  let pointerDown = false;
  let dragStarted = false;
  let downPos = { x: 0, y: 0 };
  let dragFromSlot = null;

  const spriteCache = Object.create(null);

  function loadSprites() {
    Object.values(Game.ITEMS).forEach((item) => {
      if (!item.img || spriteCache[item.key]) return;
      env.loadSprite(item, (img) => {
        if (img) spriteCache[item.key] = img;
      });
    });
  }

  function resize() {
    const v = env.view();
    dpr = v.dpr;
    W = v.width;
    H = v.height;
    // 头部原点上移量为 0 时保持旧布局：原设计中顶栏从 12px 起画
    topPad = Math.max(0, (v.capsuleBottom || 0) + 6 - 12);
    botPad = v.safeBottom || 0;
    env.setCanvasSize(Math.floor(W * dpr), Math.floor(H * dpr), W, H);
    ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- helpers ----------
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  function fillRound(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function strokeRound(x, y, w, h, r, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 1;
    roundRect(x, y, w, h, r);
    ctx.stroke();
  }
  function hitTest(px, py, x, y, w, h) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }
  function font(size, weight) {
    ctx.font = `${weight || 500} ${size}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  }
  function centerText(text, x, y, size, color, weight) {
    font(size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }
  /** 宽度不够时自动缩字号，保证长英文名不溢出 */
  function fitCenterText(text, x, y, maxW, size, color, weight) {
    let s = size;
    font(s, weight);
    while (s > 8 && ctx.measureText(text).width > maxW) {
      s -= 1;
      font(s, weight);
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }
  function drawBackground() {
    ctx.fillStyle = "#F3EDE3";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,0,0,0.03)";
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  function drawStar(cx, cy, r, filled) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = cx + Math.cos(ang) * rad;
      const py = cy + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (filled) {
      ctx.fillStyle = "#E8A33D";
      ctx.fill();
      ctx.strokeStyle = "#C4842A";
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
    }
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  function drawStars(x, y, count, size, gap) {
    for (let i = 0; i < 3; i++) {
      drawStar(x + (i - 1) * (size + gap), y, size / 2, i < count);
    }
  }

  function drawItemSprite(item, cx, cy, size, alpha) {
    const img = spriteCache[item.key];
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    if (img) {
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    } else {
      font(Math.floor(size * 0.85), 400);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.emoji, cx, cy);
    }
    ctx.restore();
  }

  /**
   * 卡面正面：底色 + 图 + 中英文名。
   * 中文主名在下、英文副名更小更淡，便于孩子对照识词。
   */
  function drawItemCardFace(item, x, y, w, h, r, border, lw) {
    fillRound(x, y, w, h, r, item.soft);
    strokeRound(x, y, w, h, r, border || "#D9D0C3", lw || 1.5);
    const cx = x + w / 2;
    const spriteSize = Math.min(w, h) * 0.46;
    drawItemSprite(item, cx, y + h * 0.36, spriteSize);
    const maxTextW = w - 8;
    fitCenterText(item.name, cx, y + h * 0.72, maxTextW, Math.max(11, Math.min(14, w * 0.15)), "#2B2B2B", 600);
    if (item.nameEn) {
      fitCenterText(item.nameEn, cx, y + h * 0.86, maxTextW, Math.max(9, Math.min(11, w * 0.12)), "#8A8378", 400);
    }
  }

  /** 卡背（盲盒未翻开） */
  function drawCardBack(cx, cy, w, h, r) {
    const x = cx - w / 2;
    const y = cy - h / 2;
    fillRound(x, y, w, h, r, "#E85D4C");
    strokeRound(x, y, w, h, r, "#C9483A", 2);
    // 菱形纹
    ctx.save();
    ctx.beginPath();
    roundRect(x + 6, y + 6, w - 12, h - 12, r - 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + h, y + h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + i + h, y);
      ctx.lineTo(x + i, y + h);
      ctx.stroke();
    }
    ctx.restore();
    centerText("?", cx, cy, Math.min(w, h) * 0.35, "#FFF", 700);
  }

  // ---------- bins ----------
  function drawBin(bin, rect, nowT, highlight) {
    const flashing = nowT < bin.flashUntil;
    const wrongFlash = flashing && !bin.locked && bin.items.length < Game.BIN_MAX;
    const fillRatio = bin.items.length / Game.BIN_MAX;

    if (bin.locked) {
      fillRound(rect.x, rect.y, rect.w, rect.h, 12, "#E8E2D8");
      strokeRound(rect.x, rect.y, rect.w, rect.h, 12, "#C9C0B2", 1.5);
      centerText("🔒", rect.x + rect.w / 2, rect.y + rect.h * 0.42, 22, "#A89F92", 400);
      centerText(I18N.t("locked_item"), rect.x + rect.w / 2, rect.y + rect.h - 20, 11, "#A89F92", 500);
      return;
    }

    fillRound(rect.x, rect.y, rect.w, rect.h, 12, wrongFlash ? "#FDEDEC" : "#FFFFFF");
    strokeRound(
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      12,
      wrongFlash ? "#E85D4C" : highlight ? "#E8A33D" : "#D9D0C3",
      highlight || wrongFlash ? 2.5 : 1.5
    );

    const barH = 6;
    const barY = rect.y + rect.h - 10;
    fillRound(rect.x + 8, barY, rect.w - 16, barH, 3, "rgba(0,0,0,0.08)");
    if (fillRatio > 0) {
      fillRound(rect.x + 8, barY, (rect.w - 16) * fillRatio, barH, 3, "#E85D4C");
    }

    if (bin.items.length === 0) {
      centerText("?", rect.x + rect.w / 2, rect.y + rect.h * 0.42, 22, "#C9C0B2", 600);
    }

    const chip = Math.min(rect.w / 6, 20);
    const startY = rect.y + rect.h * 0.4;
    for (let i = 0; i < Math.min(bin.items.length, Game.BIN_MAX); i++) {
      const item = Game.itemDef(bin.items[i]);
      const col = i % 5;
      const row = Math.floor(i / 5);
      const ix = rect.x + rect.w / 2 + (col - 2) * (chip * 0.95);
      const iy = startY + row * (chip * 0.85);
      drawItemSprite(item, ix, iy, chip);
    }

    centerText(
      `${bin.items.length}/${Game.BIN_MAX}`,
      rect.x + rect.w / 2,
      rect.y + rect.h - 22,
      11,
      "#6B655C",
      500
    );
  }

  /**
   * 可见手牌（上限 4）：始终翻开；取走后自动补翻下一张。
   */
  function drawSlotCard(slot, rect, nowT) {
    const cw = rect.w;
    const ch = rect.h;
    const cx = rect.x + cw / 2;
    const cy = rect.y + ch / 2;
    const r = 12;

    fillRound(rect.x - 3, rect.y - 3, cw + 6, ch + 6, r + 2, "rgba(0,0,0,0.06)");

    if (!slot) {
      ctx.save();
      ctx.setLineDash([6, 5]);
      strokeRound(rect.x, rect.y, cw, ch, r, "rgba(0,0,0,0.12)", 1.5);
      ctx.restore();
      return;
    }

    // 补翻动画：背面→正面
    if (slot.flipAt) {
      const t = (nowT - slot.flipAt) / Game.DEAL_MS;
      if (t < 1) {
        const phaseBack = t < 0.5;
        const flip = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2;
        const sx = Math.max(0.08, flip);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sx, 1);
        if (phaseBack) drawCardBack(0, 0, cw, ch, r);
        else {
          const item = Game.itemDef(slot.key);
          drawItemCardFace(item, -cw / 2, -ch / 2, cw, ch, r, "#E8A33D", 2);
        }
        ctx.restore();
        return;
      }
    }

    const item = Game.itemDef(slot.key);
    drawItemCardFace(item, rect.x, rect.y, cw, ch, r);
  }

  // ---------- screens ----------
  function drawHome() {
    drawBackground();
    layout.buttons = [];

    const titleY = topPad + H * 0.16;
    centerText(I18N.t("title"), W / 2, titleY, Math.min(52, W * 0.14), "#2B2B2B", 700);
    centerText(I18N.t("tagline"), W / 2, titleY + 38, 16, "#6B655C", 400);

    // 盒子预览
    const bw = Math.min(64, (W - 80) / 4);
    const gap = 10;
    const totalW = bw * 4 + gap * 3;
    const bx0 = (W - totalW) / 2;
    const by = titleY + 70;
    for (let i = 0; i < 4; i++) {
      const x = bx0 + i * (bw + gap);
      fillRound(x, by, bw, 48, 10, "#FFF");
      strokeRound(x, by, bw, 48, 10, "#D9D0C3", 1.5);
      centerText("?", x + bw / 2, by + 24, 18, "#C9C0B2", 600);
    }
    // 卡背预览
    for (let i = 0; i < 4; i++) {
      const x = bx0 + i * (bw + gap);
      drawCardBack(x + bw / 2, by + 48 + 36, bw * 0.7, 52, 8);
    }

    const btnW = Math.min(280, W - 64);
    const btnH = 56;
    const cx = (W - btnW) / 2;
    let byBtn = topPad + H * 0.48;

    fillRound(cx, byBtn, btnW, btnH, 14, "#E85D4C");
    centerText(I18N.t("btn_infinite"), W / 2, byBtn + btnH / 2, 20, "#FFF", 600);
    layout.buttons.push({ id: "infinite", x: cx, y: byBtn, w: btnW, h: btnH });

    byBtn += btnH + 14;
    fillRound(cx, byBtn, btnW, btnH, 14, "#FFF");
    strokeRound(cx, byBtn, btnW, btnH, 14, "#D9D0C3", 1.5);
    centerText(I18N.t("btn_levels"), W / 2, byBtn + btnH / 2, 20, "#2B2B2B", 600);
    layout.buttons.push({ id: "levels", x: cx, y: byBtn, w: btnW, h: btnH });

    byBtn += btnH + 14;
    fillRound(cx, byBtn, btnW, btnH, 14, "#FFF");
    strokeRound(cx, byBtn, btnW, btnH, 14, "#D9D0C3", 1.5);
    const soundLabel = Game.state.progress.sound ? I18N.t("sound_on") : I18N.t("sound_off");
    centerText(soundLabel, W / 2, byBtn + btnH / 2, 18, "#2B2B2B", 600);
    layout.buttons.push({ id: "sound", x: cx, y: byBtn, w: btnW, h: btnH });

    // 语言切换（右上角，让开胶囊）
    const langW = 52;
    const langH = 32;
    const langX = W - langW - 14;
    const langY = topPad + 14;
    fillRound(langX, langY, langW, langH, 10, "#FFF");
    strokeRound(langX, langY, langW, langH, 10, "#D9D0C3", 1.5);
    centerText(I18N.t("lang_btn"), langX + langW / 2, langY + langH / 2, 14, "#2B2B2B", 600);
    layout.buttons.push({ id: "lang", x: langX, y: langY, w: langW, h: langH });

    const best = Game.state.progress.bestInfinite;
    centerText(
      best > 0 ? I18N.t("best_score", { n: best }) : I18N.t("home_hint"),
      W / 2,
      H * 0.88 - botPad,
      14,
      "#8A8378",
      400
    );
  }

  function drawLevelSelect() {
    drawBackground();
    layout.buttons = [];
    centerText(I18N.t("select_level"), W / 2, topPad + 48, 26, "#2B2B2B", 700);

    const cols = 4;
    const gap = 10;
    const pad = 16;
    let cellW = (W - pad * 2 - gap * (cols - 1)) / cols;
    let cellH = cellW * 1.08;
    const startY = topPad + 84;
    const rows = Math.ceil(Game.LEVELS.length / cols);
    const maxBottom = H - 70 - botPad;
    const gridH = rows * cellH + (rows - 1) * gap;
    if (startY + gridH > maxBottom) {
      const scale = (maxBottom - startY) / gridH;
      cellH *= scale;
      cellW *= scale;
    }

    for (let i = 0; i < Game.LEVELS.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cellW + gap);
      const y = startY + row * (cellH + gap);
      const level = Game.LEVELS[i];
      const unlocked = level.id <= Game.state.progress.unlocked;
      const stars = Game.getStarsForLevel(level.id);
      fillRound(x, y, cellW, cellH, 12, unlocked ? "#FFF" : "#E5DFD4");
      strokeRound(x, y, cellW, cellH, 12, unlocked ? "#D9D0C3" : "#D0C8BA", 1.5);
      centerText(
        String(level.id),
        x + cellW / 2,
        y + cellH * 0.36,
        Math.min(26, cellW * 0.34),
        unlocked ? "#2B2B2B" : "#A89F92",
        700
      );
      if (unlocked) drawStars(x + cellW / 2, y + cellH * 0.68, stars, Math.min(14, cellW * 0.16), 3);
      else centerText("🔒", x + cellW / 2, y + cellH * 0.68, 14, "#A89F92", 400);
      layout.buttons.push({ id: "level:" + i, x, y, w: cellW, h: cellH, enabled: unlocked });
    }

    const bw = 100;
    const bh = 44;
    const bx = (W - bw) / 2;
    const by = H - bh - 16 - botPad;
    fillRound(bx, by, bw, bh, 12, "#FFF");
    strokeRound(bx, by, bw, bh, 12, "#D9D0C3", 1.5);
    centerText(I18N.t("back"), W / 2, by + bh / 2, 16, "#2B2B2B", 600);
    layout.buttons.push({ id: "home", x: bx, y: by, w: bw, h: bh });
  }

  function drawGame(nowT) {
    drawBackground();
    layout.buttons = [];
    layout.bins = [];
    layout.slots = [];

    const st = Game.state;
    const isLevel = st.mode === "level";

    let shakeX = 0;
    if (nowT < st.anim.shakeUntil) shakeX = Math.sin(nowT * 0.09) * 5;

    // header
    if (isLevel) {
      const level = Game.LEVELS[st.levelIndex];
      centerText(
        I18N.t("level_header", { n: level.id, name: I18N.localized(level) }),
        W / 2,
        topPad + 24,
        18,
        "#2B2B2B",
        700
      );
      const goal = Game.goalText();
      if (goal) centerText(goal, W / 2, topPad + 46, 13, "#8A8378", 400);
    } else {
      centerText(I18N.t("infinite_title"), W / 2, topPad + 24, 18, "#2B2B2B", 700);
      centerText(I18N.t("infinite_sub"), W / 2, topPad + 46, 13, "#8A8378", 400);
    }
    centerText(String(st.score), W / 2, topPad + 72, 26, "#E85D4C", 700);
    if (st.streak >= 3) {
      centerText(I18N.t("streak", { n: st.streak }), W / 2, topPad + 94, 12, "#E8A33D", 600);
    }

    fillRound(12, topPad + 12, 56, 30, 8, "rgba(255,255,255,0.85)");
    strokeRound(12, topPad + 12, 56, 30, 8, "#D9D0C3", 1);
    centerText("←", 40, topPad + 27, 18, "#6B655C", 600);
    layout.buttons.push({ id: "home", x: 12, y: topPad + 12, w: 56, h: 30 });

    ctx.save();
    ctx.translate(shakeX, 0);

    // ---- bins ----
    const pad = 10;
    const gap = 8;
    const binTop = topPad + 108;
    const binW = (W - pad * 2 - gap * 3) / 4;
    const binH = Math.min(120, Math.max(96, (H - binTop - 200) * 0.32));
    let hoverBin = null;
    if (st.drag) hoverBin = Game.findBinAt(st.drag.x, st.drag.y, layout);

    st.bins.forEach((bin, i) => {
      const rect = { x: pad + i * (binW + gap), y: binTop, w: binW, h: binH };
      layout.bins.push(rect);
      drawBin(bin, rect, nowT, hoverBin === i);
    });

    // ---- bottom card tray ----
    const trayTop = binTop + binH + 28;
    const trayH = Math.min(H * 0.34, 220);
    const trayY = H - trayH - 36 - botPad;
    // 托盘背景
    fillRound(pad - 4, trayY - 16, W - pad * 2 + 8, trayH + 24, 18, "rgba(255,255,255,0.55)");
    strokeRound(pad - 4, trayY - 16, W - pad * 2 + 8, trayH + 24, 18, "#E0D8CC", 1.5);
    centerText(I18N.t("tray"), W / 2, trayY - 4, 12, "#A89F92", 500);

    const slotGap = 10;
    const slotW = (W - pad * 2 - slotGap * 3) / 4;
    const slotH = Math.min(trayH - 12, slotW * 1.35);
    const slotY = trayY + 8;

    for (let i = 0; i < Game.SLOT_COUNT; i++) {
      const rect = { x: pad + i * (slotW + slotGap), y: slotY, w: slotW, h: slotH };
      layout.slots.push(rect);
      // 拖走时 slots[i] 已是 null，画空位即可
      drawSlotCard(st.slots[i], rect, nowT);
    }

    // particles
    const parts = [];
    for (const p of st.anim.particles) {
      const age = (nowT - p.start) / 1000;
      if (age > p.life / 1000) continue;
      parts.push(p);
      let ox = W / 2;
      let oy = binTop + binH / 2;
      if (p.bin != null && layout.bins[p.bin]) {
        const b = layout.bins[p.bin];
        ox = b.x + b.w / 2;
        oy = b.y + b.h / 2;
      }
      const px = ox + p.vx * age;
      const py = oy + p.vy * age + 140 * age * age;
      const alpha = 1 - age / (p.life / 1000);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.5, p.size * alpha), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    st.anim.particles = parts;

    // floats
    const floats = [];
    for (const f of st.anim.floats) {
      const age = nowT - f.start;
      if (age > f.life) continue;
      floats.push(f);
      const t = age / f.life;
      let fx = W / 2;
      let fy = binTop + 20 - t * 28;
      if (f.bin != null && layout.bins[f.bin]) {
        const b = layout.bins[f.bin];
        fx = b.x + b.w / 2;
        fy = b.y + 20 - t * 28;
      }
      ctx.globalAlpha = 1 - t;
      centerText(f.text, fx, fy, 16, f.color, 700);
      ctx.globalAlpha = 1;
    }
    st.anim.floats = floats;

    // drag ghost
    if (st.drag) {
      const item = Game.itemDef(st.drag.type);
      const gw = Math.min(slotW * 0.95, 90);
      const gh = gw * 1.3;
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.ellipse(st.drag.x, st.drag.y + gh * 0.42, gw * 0.35, gh * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fill();
      drawItemCardFace(item, st.drag.x - gw / 2, st.drag.y - gh / 2, gw, gh, 12, "#E8A33D", 2);
      ctx.restore();
    }

    ctx.restore();

    if (nowT < st.anim.comboShowUntil) {
      const left = st.anim.comboShowUntil - nowT;
      ctx.globalAlpha = Math.min(1, left / 300);
      centerText(I18N.t("streak", { n: st.anim.comboShowValue }), W / 2, H * 0.3, 28, "#E85D4C", 700);
      ctx.globalAlpha = 1;
    }

    if (st.anim.toast && nowT < st.anim.toast.until) {
      const tw = Math.min(240, W - 40);
      const th = 40;
      const tx = (W - tw) / 2;
      const ty = H * 0.4;
      fillRound(tx, ty, tw, th, 20, "rgba(43,43,43,0.88)");
      centerText(st.anim.toast.text, W / 2, ty + th / 2, 15, "#FFF", 500);
    }

    centerText(I18N.t("bottom_tip"), W / 2, H - 18 - botPad, 13, "#8A8378", 400);
  }

  function drawOverlayResult() {
    ctx.fillStyle = "rgba(43,43,43,0.45)";
    ctx.fillRect(0, 0, W, H);
    layout.buttons = [];

    const pw = Math.min(320, W - 40);
    const ph = 320;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;
    fillRound(px, py, pw, ph, 18, "#FFF");
    const st = Game.state;
    centerText(I18N.t("win"), W / 2, py + 44, 28, "#2B2B2B", 700);
    drawStars(W / 2, py + 96, st.stars || 1, 36, 10);
    centerText(I18N.t("win_stats", { s: st.score, b: st.binsCleared }), W / 2, py + 136, 15, "#6B655C", 500);

    const btnW = pw - 48;
    const btnH = 48;
    const bx = px + 24;
    let by = py + 168;
    const hasNext = st.levelIndex < Game.LEVELS.length - 1;
    fillRound(bx, by, btnW, btnH, 12, "#E85D4C");
    centerText(hasNext ? I18N.t("next") : I18N.t("to_levels"), W / 2, by + btnH / 2, 18, "#FFF", 600);
    layout.buttons.push({ id: hasNext ? "next" : "levels", x: bx, y: by, w: btnW, h: btnH });

    by += btnH + 12;
    fillRound(bx, by, btnW, btnH, 12, "#FFF");
    strokeRound(bx, by, btnW, btnH, 12, "#D9D0C3", 1.5);
    centerText(I18N.t("retry"), W / 2, by + btnH / 2, 18, "#2B2B2B", 600);
    layout.buttons.push({ id: "retry", x: bx, y: by, w: btnW, h: btnH });
  }

  /** 首屏隐私同意：未同意不进游戏 */
  function drawPrivacy() {
    drawBackground();
    layout.buttons = [];
    const pw = Math.min(330, W - 40);
    const ph = 300;
    const px = (W - pw) / 2;
    const py = Math.max(topPad + 40, (H - ph) / 2);
    fillRound(px, py, pw, ph, 18, "#FFF");
    strokeRound(px, py, pw, ph, 18, "#E0D8CC", 1.5);

    centerText(I18N.t("title"), W / 2, py + 42, 30, "#2B2B2B", 700);
    const lines = I18N.t("privacy_body").split("\n");
    lines.forEach((line, i) => {
      centerText(line, W / 2, py + 92 + i * 24, 14, "#6B655C", 400);
    });

    const btnW = pw - 56;
    const btnH = 50;
    const bx = px + 28;
    let by = py + ph - btnH - 26;
    fillRound(bx, by, btnW, btnH, 12, "#E85D4C");
    centerText(I18N.t("privacy_agree"), W / 2, by + btnH / 2, 19, "#FFF", 600);
    layout.buttons.push({ id: "privacy_ok", x: bx, y: by, w: btnW, h: btnH });
  }

  function render(nowT) {
    if (!env.privacy.agreed()) {
      drawPrivacy();
      return;
    }
    const st = Game.state;
    if (st.screen === "home") drawHome();
    else if (st.screen === "levelSelect") drawLevelSelect();
    else if (st.screen === "game") drawGame(nowT);
    else if (st.screen === "win") {
      drawGame(nowT);
      drawOverlayResult();
    }
  }

  function loop(ts) {
    render(typeof ts === "number" ? ts : Platform.now());
    env.frame(loop);
  }

  // ---------- input ----------
  function handleButton(x, y) {
    if (!env.privacy.agreed()) {
      for (const b of layout.buttons) {
        if (b.id === "privacy_ok" && hitTest(x, y, b.x, b.y, b.w, b.h)) {
          env.privacy.agree();
          GameAudio.init();
          GameAudio.click();
          return true;
        }
      }
      return false;
    }
    for (const b of layout.buttons) {
      if (!hitTest(x, y, b.x, b.y, b.w, b.h)) continue;
      if (b.enabled === false) continue;
      GameAudio.init();
      GameAudio.click();
      if (b.id === "infinite") Game.startInfinite();
      else if (b.id === "levels") Game.goLevelSelect();
      else if (b.id === "sound") {
        Game.state.progress.sound = !Game.state.progress.sound;
        GameAudio.setEnabled(Game.state.progress.sound);
        Game.saveProgress();
      } else if (b.id === "lang") {
        I18N.toggle();
      } else if (b.id === "home") Game.goHome();
      else if (b.id === "retry") Game.retryLevel();
      else if (b.id === "next") Game.startNextLevel();
      else if (b.id.startsWith("level:")) {
        Game.startLevel(parseInt(b.id.split(":")[1], 10));
      }
      return true;
    }
    return false;
  }

  function onDown(x, y) {
    GameAudio.init();
    pointerDown = true;
    dragStarted = false;
    downPos = { x, y };
    dragFromSlot = null;
    if (handleButton(x, y)) {
      pointerDown = false;
      return;
    }
    if (!env.privacy.agreed()) return;
    if (Game.state.screen !== "game" || Game.locked()) return;
    const si = Game.findSlotAt(x, y, layout);
    if (si != null) dragFromSlot = si;
  }

  function onMove(x, y) {
    if (!pointerDown || Game.state.screen !== "game") return;
    if (Game.locked()) return;
    const dist = Math.hypot(x - downPos.x, y - downPos.y);
    if (!dragStarted && dist > 8 && dragFromSlot != null) {
      if (Game.tryPickSlot(dragFromSlot)) {
        dragStarted = true;
        Game.updateDragPos(x, y);
      }
    }
    if (dragStarted) Game.updateDragPos(x, y);
  }

  function onUp(x, y) {
    if (!pointerDown) return;
    pointerDown = false;
    if (Game.state.screen !== "game") {
      dragStarted = false;
      dragFromSlot = null;
      return;
    }
    if (dragStarted) Game.tryDrop(x, y, layout);
    dragStarted = false;
    dragFromSlot = null;
  }

  function onCancel() {
    if (!pointerDown) return;
    pointerDown = false;
    if (dragStarted) Game.cancelDrag();
    dragStarted = false;
    dragFromSlot = null;
  }

  function init(e) {
    env = e;
    canvas = env.canvas;
    ctx = canvas.getContext("2d");
    resize();
    loadSprites();
    env.bindPointer({ down: onDown, move: onMove, up: onUp, cancel: onCancel });
    env.onResize(resize);
    env.frame(loop);
  }

  return { init, get layout() { return layout; } };
})();

if (typeof globalThis !== "undefined") globalThis.Render = Render;
if (typeof module !== "undefined" && module.exports) module.exports = { Render };
