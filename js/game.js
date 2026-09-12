/**
 * 《分类之王》核心：顶栏 4 匿名分类盒 + 底部手牌区（可见上限 4，取走自动补翻）
 */
const Game = (() => {
  const STORAGE_KEY = "sortking_v2";
  const SCORE_PLACE = 20;
  const SCORE_BIN = [0, 100, 250, 500, 800, 1200, 1600, 2100];
  const SLOT_COUNT = 4; // 同屏可见手牌上限
  const DEAL_MS = 320;
  const DECK_SIZE = 24; // 牌库补充量

  const state = {
    screen: "home",
    mode: "infinite",
    levelIndex: 0,
    cats: DEFAULT_CATS.slice(),
    bins: [],
    /** 牌库（盖着） */
    deck: [],
    /**
     * 可见手牌区，上限 4，始终尽量填满并翻开：
     * null | { key, flipAt }
     */
    slots: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    binsCleared: 0,
    goalProgress: 0,
    drag: null,
    anim: {
      clearingBins: [],
      particles: [],
      floats: [],
      toast: null,
      shakeUntil: 0,
      comboShowUntil: 0,
      comboShowValue: 0,
      perfectUntil: 0,
      lockUntil: 0,
    },
    tutorialDone: false,
    stars: 0,
    progress: {
      unlocked: 1,
      stars: {},
      sound: true,
      bestInfinite: 0,
      tutorialDone: false,
      unlockedSlots: 4,
      props: { unlockSlot: 0 },
    },
  };

  // ---------- helpers ----------
  function now() {
    return performance.now();
  }
  function locked() {
    return now() < state.anim.lockUntil;
  }
  function setToast(text, ms = 900) {
    state.anim.toast = { text, until: now() + ms };
  }
  function itemDef(key) {
    return ITEMS[key];
  }
  function catDef(key) {
    return CATEGORIES[key];
  }

  function loadProgress() {
    try {
      const data = Platform.storage.getJSON(STORAGE_KEY);
      if (data) {
        state.progress = {
          unlocked: Math.max(1, data.unlocked || 1),
          stars: data.stars || {},
          sound: data.sound !== false,
          bestInfinite: data.bestInfinite || 0,
          tutorialDone: !!data.tutorialDone,
          unlockedSlots: Math.min(4, Math.max(1, data.unlockedSlots || 4)),
          props: { unlockSlot: 0, ...(data.props || {}) },
        };
      }
    } catch (_) {}
    state.tutorialDone = state.progress.tutorialDone;
  }

  function saveProgress() {
    try {
      Platform.storage.setJSON(STORAGE_KEY, state.progress);
    } catch (_) {}
  }

  function addFloat(text, binIndex, color) {
    state.anim.floats.push({
      text,
      bin: binIndex,
      color: color || "#2B2B2B",
      start: now(),
      life: 900,
    });
  }

  function itemsOfCat(cat) {
    return Object.values(ITEMS).filter((it) => it.category === cat);
  }

  function randomItemKey(cats) {
    const pool = [];
    for (const c of cats) {
      for (const it of itemsOfCat(c)) pool.push(it.key);
    }
    if (!pool.length) return "cola";
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** 盲盒出牌：偏向当前盒子更缺的分类 */
  function dealKey() {
    const counts = {};
    for (const c of state.cats) counts[c] = 0;
    for (const s of state.slots) {
      if (s) counts[itemDef(s.key).category]++;
    }
    for (const bin of state.bins) {
      if (!bin.locked) counts[bin.cat] += bin.items.length * 0.35;
    }
    const sorted = state.cats.slice().sort((a, b) => counts[a] - counts[b]);
    const cat = Math.random() < 0.72 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
    const list = itemsOfCat(cat);
    return list[Math.floor(Math.random() * list.length)].key;
  }

  function refillDeck() {
    while (state.deck.length < DECK_SIZE) {
      state.deck.push(dealKey());
    }
  }

  /**
   * 向空位自动翻开/补一张。animate=false 用于开局直接亮牌。
   */
  function dealToSlot(i, animate) {
    if (i < 0 || i >= SLOT_COUNT) return false;
    if (state.slots[i]) return false;
    refillDeck();
    if (!state.deck.length) return false;
    const key = state.deck.pop();
    state.slots[i] = { key, flipAt: animate === false ? 0 : now() };
    if (animate !== false) GameAudio.spawn();
    return true;
  }

  /** 取走后自动补翻，保持可见上限 4 */
  function refillHand(animate) {
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (!state.slots[i]) dealToSlot(i, animate !== false);
    }
  }

  function visibleCount() {
    return state.slots.filter(Boolean).length;
  }

  // ---------- bins ----------
  function makeBins(cats) {
    const open = Math.min(4, Math.max(1, state.progress.unlockedSlots || 4));
    return cats.map((c, i) => ({
      cat: c,
      items: [],
      flashUntil: 0,
      locked: i >= open,
    }));
  }

  function openSlotCount() {
    return state.bins.filter((b) => !b.locked).length || state.progress.unlockedSlots;
  }

  function unlockBinSlot() {
    const open = Math.min(4, Math.max(1, state.progress.unlockedSlots || 4));
    if (open >= 4) {
      setToast(I18N.t("toast_all_unlocked"), 900);
      return false;
    }
    if (((state.progress.props && state.progress.props.unlockSlot) || 0) <= 0) {
      setToast(I18N.t("toast_need_item"), 900);
      return false;
    }
    state.progress.props.unlockSlot -= 1;
    state.progress.unlockedSlots = open + 1;
    saveProgress();
    if (state.bins[open]) {
      state.bins[open].locked = false;
      state.bins[open].flashUntil = now() + 500;
    }
    GameAudio.win();
    setToast(I18N.t("toast_slot_unlocked"), 1000);
    return true;
  }

  // ---------- scoring ----------
  function scoreForBinClear(fillCount) {
    const i = Math.min(fillCount, SCORE_BIN.length - 1);
    return SCORE_BIN[i] || 100;
  }

  function streakBonus(streak) {
    if (streak >= 12) return 80;
    if (streak >= 8) return 40;
    if (streak >= 5) return 20;
    if (streak >= 3) return 10;
    return 0;
  }

  // ---------- drop on bin ----------
  function tryDropOnBin(binIndex, itemKey) {
    if (locked()) return false;
    const bin = state.bins[binIndex];
    if (!bin || !itemKey) return false;
    if (bin.locked) {
      state.anim.shakeUntil = now() + 240;
      setToast(I18N.t("toast_slot_locked"), 800);
      GameAudio.reject();
      return false;
    }
    const item = itemDef(itemKey);
    if (!item) return false;

    if (item.category !== bin.cat) {
      state.streak = 0;
      state.anim.shakeUntil = now() + 280;
      bin.flashUntil = now() + 280;
      GameAudio.reject();
      setToast(I18N.t("toast_wrong"), 800);
      Platform.vibrate(40);
      return false;
    }

    bin.items.push(itemKey);
    state.score += SCORE_PLACE + streakBonus(state.streak);
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    GameAudio.place();

    if (state.mode === "level") {
      const goal = LEVELS[state.levelIndex].goal;
      if (goal.type === "streak") {
        state.goalProgress = Math.max(state.goalProgress, state.streak);
      } else if (goal.type === "score") {
        state.goalProgress = state.score;
      }
    }

    if (bin.items.length >= BIN_MAX) {
      clearBin(binIndex);
    }

    // 取走后自动补翻下一张，可见手牌保持 4
    refillHand(true);

    if (state.mode === "infinite" && state.score > state.progress.bestInfinite) {
      state.progress.bestInfinite = state.score;
      saveProgress();
    }
    if (!state.tutorialDone && state.binsCleared > 0) finishTutorial();
    if (state.mode === "level") checkLevelWin();
    return true;
  }

  function clearBin(binIndex) {
    const bin = state.bins[binIndex];
    const n = bin.items.length;
    const cat = catDef(bin.cat);
    const gained = scoreForBinClear(n);
    state.score += gained;
    state.binsCleared += 1;
    state.anim.clearingBins.push({ bin: binIndex, start: now(), life: 420 });
    bin.items = [];
    bin.flashUntil = now() + 400;

    addFloat(`+${gained}`, binIndex, cat.color);
    for (let i = 0; i < 12; i++) {
      const ang = (Math.PI * 2 * i) / 12;
      const sp = 60 + Math.random() * 80;
      state.anim.particles.push({
        bin: binIndex,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 20,
        color: cat.color,
        start: now(),
        life: 550 + Math.random() * 250,
        size: 3 + Math.random() * 4,
      });
    }

    GameAudio.clear(1);
    if (state.streak >= 5) {
      GameAudio.combo(Math.min(state.streak, 7));
      state.anim.comboShowUntil = now() + 1000;
      state.anim.comboShowValue = state.streak;
    }
    Platform.vibrate(30);

    if (state.mode === "level") {
      const goal = LEVELS[state.levelIndex].goal;
      if (goal.type === "bins") state.goalProgress = state.binsCleared;
      else if (goal.type === "score") state.goalProgress = state.score;
    }
    state.anim.lockUntil = now() + 280;
  }

  function checkLevelWin() {
    const level = LEVELS[state.levelIndex];
    const goal = level.goal;
    const done =
      (goal.type === "bins" && state.binsCleared >= goal.value) ||
      (goal.type === "score" && state.score >= goal.value) ||
      (goal.type === "streak" && state.goalProgress >= goal.value);
    if (!done) return;

    let stars = 1;
    if (goal.type === "score") {
      stars = state.score >= goal.value * 1.5 ? 3 : state.score >= goal.value * 1.2 ? 2 : 1;
    } else if (state.bestStreak >= 10) stars = 3;
    else if (state.bestStreak >= 6) stars = 2;

    const levelId = level.id;
    const prev = state.progress.stars[levelId] || 0;
    if (stars > prev) state.progress.stars[levelId] = stars;
    if (levelId + 1 > state.progress.unlocked && levelId < LEVELS.length) {
      state.progress.unlocked = levelId + 1;
    }
    saveProgress();
    state.stars = stars;
    state.anim.lockUntil = now() + 400;
    setScreen("win");
    GameAudio.win();
  }

  // ---------- drag / pick ----------
  /** 拿起可见手牌 */
  function tryPickSlot(i) {
    if (locked() || state.screen !== "game" || state.drag) return false;
    const slot = state.slots[i];
    if (!slot) return false;
    if (slot.flipAt && now() - slot.flipAt < DEAL_MS) return false;
    state.drag = {
      from: { kind: "slot", i },
      type: slot.key,
      x: 0,
      y: 0,
    };
    state.slots[i] = null;
    GameAudio.pick();
    return true;
  }

  function updateDragPos(x, y) {
    if (!state.drag) return;
    state.drag.x = x;
    state.drag.y = y;
  }

  function findBinAt(x, y, layout) {
    if (!layout || !layout.bins) return null;
    let best = null;
    let bestDist = Infinity;
    layout.bins.forEach((b, i) => {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const d = Math.hypot(x - cx, y - cy);
      const snap = Math.max(b.w, b.h) * 0.75;
      if (d < snap && d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  function findSlotAt(x, y, layout) {
    if (!layout || !layout.slots) return null;
    let best = null;
    let bestDist = Infinity;
    layout.slots.forEach((s, i) => {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const d = Math.hypot(x - cx, y - cy);
      const snap = Math.max(s.w, s.h) * 0.65;
      if (d < snap && d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  function putBack(drag) {
    if (drag.from && drag.from.kind === "slot") {
      const i = drag.from.i;
      if (!state.slots[i]) {
        state.slots[i] = { key: drag.type, flipAt: 0 };
      }
    }
    state.drag = null;
    // 可见上限 4：若有空位则补
    refillHand(false);
  }

  function cancelDrag() {
    if (state.drag) putBack(state.drag);
  }

  /**
   * 放下：优先盒子；失败退回原堆翻开位。
   */
  function tryDrop(x, y, layout) {
    if (!state.drag) return false;
    const drag = state.drag;
    const binIdx = findBinAt(x, y, layout);
    if (binIdx != null) {
      const ok = tryDropOnBin(binIdx, drag.type);
      if (!ok) putBack(drag);
      else state.drag = null;
      return ok;
    }
    // 没进盒子：退回
    putBack(drag);
    return false;
  }

  // ---------- screens ----------
  function setScreen(s) {
    state.screen = s;
  }
  function goHome() {
    cancelDrag();
    setScreen("home");
  }
  function goLevelSelect() {
    cancelDrag();
    setScreen("levelSelect");
  }

  function resetRun(cats) {
    state.cats = cats.slice(0, 4);
    while (state.cats.length < 4) {
      const extra = DEFAULT_CATS.find((c) => !state.cats.includes(c));
      state.cats.push(extra || DEFAULT_CATS[state.cats.length % 4]);
    }
    state.bins = makeBins(state.cats);
    state.deck = [];
    state.slots = [];
    refillDeck();
    // 首次四张直接翻开（无等待）
    for (let i = 0; i < SLOT_COUNT; i++) dealToSlot(i, false);
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.binsCleared = 0;
    state.goalProgress = 0;
    state.stars = 0;
    state.drag = null;
    state.anim.clearingBins = [];
    state.anim.particles = [];
    state.anim.floats = [];
    state.anim.toast = null;
    state.anim.lockUntil = 0;
    // 手牌区已填满 4 张翻开牌
  }

  function startInfinite() {
    state.mode = "infinite";
    resetRun(DEFAULT_CATS);
    setScreen("game");
  }

  function startLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    state.mode = "level";
    state.levelIndex = index;
    const lv = LEVELS[index];
    resetRun(lv.cats || DEFAULT_CATS);
    setScreen("game");
  }

  function startNextLevel() {
    const next = state.levelIndex + 1;
    if (next < LEVELS.length) startLevel(next);
    else goLevelSelect();
  }

  function retryLevel() {
    startLevel(state.levelIndex);
  }

  function finishTutorial() {
    if (state.tutorialDone) return;
    state.tutorialDone = true;
    state.progress.tutorialDone = true;
    saveProgress();
  }

  function getStarsForLevel(levelId) {
    return state.progress.stars[levelId] || 0;
  }

  function goalText() {
    if (state.mode === "infinite") return null;
    const g = LEVELS[state.levelIndex].goal;
    if (I18N.isEn()) {
      if (g.type === "bins") return `Clear ${g.value} bins (${state.binsCleared}/${g.value})`;
      if (g.type === "score") return `Reach ${g.value} pts (${state.score})`;
      if (g.type === "streak") return `${g.value} streak (best ${state.goalProgress})`;
    } else {
      if (g.type === "bins") return `装满消除 ${g.value} 盒（${state.binsCleared}/${g.value}）`;
      if (g.type === "score") return `达到 ${g.value} 分（${state.score}）`;
      if (g.type === "streak") return `连续正确 ${g.value} 次（最高 ${state.goalProgress}）`;
    }
    return "";
  }

  loadProgress();

  return {
    state,
    SLOT_COUNT,
    DEAL_MS,
    BIN_MAX,
    LEVELS,
    CATEGORIES,
    ITEMS,
    DEFAULT_CATS,
    goHome,
    goLevelSelect,
    startInfinite,
    startLevel,
    startNextLevel,
    retryLevel,
    saveProgress,
    getStarsForLevel,
    tryPickSlot,
    dealToSlot,
    refillHand,
    visibleCount,
    updateDragPos,
    tryDrop,
    tryDropOnBin,
    unlockBinSlot,
    openSlotCount,
    cancelDrag,
    findBinAt,
    findSlotAt,
    goalText,
    finishTutorial,
    itemDef,
    catDef,
    locked,
    setToast,
  };
})();

if (typeof globalThis !== "undefined") globalThis.Game = Game;
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Game };
}
