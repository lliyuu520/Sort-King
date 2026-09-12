/**
 * 手牌区测试：首次 4 张翻开，取走自动补翻，可见上限 4
 */
const path = require("path");
const fs = require("fs");
const vm = require("vm");

globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.localStorage = {
  _d: {},
  getItem(k) {
    return this._d[k] || null;
  },
  setItem(k, v) {
    this._d[k] = v;
  },
  removeItem(k) {
    delete this._d[k];
  },
};
globalThis.navigator = {};
globalThis.GameAudio = {
  init() {},
  setEnabled() {},
  pick() {},
  place() {},
  reject() {},
  clear() {},
  combo() {},
  perfect() {},
  win() {},
  fail() {},
  click() {},
  spawn() {},
};

function loadScript(file) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, file), "utf8"), { filename: file });
}
loadScript("platform.js");
loadScript("i18n.js");
loadScript("levels.js");
loadScript("game.js");

let fail = 0;
function assert(cond, msg) {
  if (!cond) {
    fail++;
    console.error("FAIL:", msg);
  }
}

Game.startInfinite();
assert(Game.SLOT_COUNT === 4, "visible max 4");
assert(Game.state.slots.length === 4, "4 slots");
assert(Game.state.slots.every(Boolean), "first 4 are dealt");
assert(Game.state.slots.every((s) => s.key), "all have keys");
assert(Game.state.deck.length > 0, "deck has remaining cards");

// pick then successful drop → auto refill
const key0 = Game.state.slots[0].key;
Game.state.anim.lockUntil = 0;
// skip flip wait
Game.state.slots[0].flipAt = 0;
assert(Game.tryPickSlot(0), "pick");
assert(Game.state.slots[0] === null, "slot empty while drag");
const cat = Game.ITEMS[key0].category;
const bi = Game.state.bins.findIndex((b) => b.cat === cat);
assert(Game.tryDropOnBin(bi, key0), "drop ok");
Game.state.drag = null; // tryDropOnBin 本身不管理 drag
assert(Game.state.slots[0] != null, "auto refilled after take");
assert(Game.state.slots.every(Boolean), "visible still 4");

// cancel put back
Game.state.anim.lockUntil = 0;
Game.state.slots[1].flipAt = 0;
const key1 = Game.state.slots[1].key;
assert(Game.tryPickSlot(1), "pick 1");
Game.cancelDrag();
assert(Game.state.slots[1] && Game.state.slots[1].key === key1, "put back same card");
assert(Game.state.slots.every(Boolean), "still 4 visible");

// wrong drop put back + still 4
Game.state.anim.lockUntil = 0;
Game.state.slots[2].flipAt = 0;
const key2 = Game.state.slots[2].key;
const cat2 = Game.ITEMS[key2].category;
const wrongBin = Game.state.bins.findIndex((b) => b.cat !== cat2 && !b.locked);
assert(Game.tryPickSlot(2), "pick 2");
const layout = {
  bins: Game.state.bins.map((_, i) => ({ x: i * 80, y: 0, w: 70, h: 90 })),
  slots: [0, 1, 2, 3].map((i) => ({ x: i * 80, y: 300, w: 70, h: 90 })),
};
const ok = Game.tryDrop(wrongBin * 80 + 35, 45, layout);
assert(ok === false, "wrong drop fails");
assert(Game.state.slots.every(Boolean), "4 visible after wrong");
assert(Game.state.slots.some((s) => s && s.key === key2), "card returned");

// never exceed 4 visible
assert(Game.visibleCount() <= 4, "visible <= 4");

if (fail === 0) {
  console.log("✓ 手牌区测试通过");
  console.log("  - 首次 4 张已翻开");
  console.log("  - 取走自动补翻");
  console.log("  - 可见上限 4");
} else {
  console.error(`✗ ${fail} 项失败`);
  process.exit(1);
}
