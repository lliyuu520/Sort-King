/**
 * 纯逻辑测试：手牌 4 张、取走补翻、放错退回、满盒消除、第 1 关过关。
 * 运行：npx --yes tsx scripts/test-game.ts
 */
import { Game } from "../client/assets/scripts/game/Game";
import { I18n } from "../client/assets/scripts/game/i18n";
import { BIN_MAX } from "../client/assets/scripts/game/catalog";

const mem: Record<string, string> = {};
const storage = {
  get(key: string) {
    return mem[key] ?? null;
  },
  set(key: string, value: string) {
    mem[key] = value;
  },
  getJSON(key: string) {
    const raw = mem[key];
    if (!raw) return null;
    return JSON.parse(raw);
  },
  setJSON(key: string, value: unknown) {
    mem[key] = JSON.stringify(value);
  },
};

const audio = {
  spawn() {},
  pick() {},
  place() {},
  reject() {},
  clear() {},
  combo() {},
  win() {},
};

let now = 10_000;
function makeGame() {
  return new Game({
    now: () => now,
    storage,
    audio,
    vibrate() {},
    i18n: new I18n(storage),
    random: () => 0.1,
  });
}

let fail = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    fail++;
    console.error("FAIL:", msg);
  }
}

const g = makeGame();
g.startInfinite();
assert(g.SLOT_COUNT === 4, "visible max 4");
assert(g.state.slots.length === 4, "4 slots");
assert(g.state.slots.every(Boolean), "first 4 are dealt");
assert(g.state.slots.every((s) => s && s.key), "all have keys");
assert(g.state.deck.length > 0, "deck has remaining cards");
assert(g.state.bins.length === 4 && g.state.bins.every((b) => !b.revealed), "bins anonymous");

const key0 = g.state.slots[0]!.key;
g.state.lockUntil = 0;
g.state.slots[0]!.flipAt = 0;
assert(g.tryPickSlot(0), "pick");
assert(g.state.slots[0] === null, "slot empty while drag");
const cat = g.ITEMS[key0].category;
const bi = g.state.bins.findIndex((b) => b.cat === cat);
assert(g.tryDropOnBin(bi, key0), "drop ok");
g.state.drag = null;
assert(g.state.slots[0] != null, "auto refilled after take");
assert(g.state.slots.every(Boolean), "visible still 4");
assert(g.state.bins[bi].revealed, "bin revealed after first correct drop");

g.state.lockUntil = 0;
g.state.slots[1]!.flipAt = 0;
const key1 = g.state.slots[1]!.key;
assert(g.tryPickSlot(1), "pick 1");
g.cancelDrag();
assert(g.state.slots[1] && g.state.slots[1]!.key === key1, "put back same card");
assert(g.state.slots.every(Boolean), "still 4 visible");

g.state.lockUntil = 0;
g.state.slots[2]!.flipAt = 0;
const key2 = g.state.slots[2]!.key;
const cat2 = g.ITEMS[key2].category;
const wrongBin = g.state.bins.findIndex((b) => b.cat !== cat2);
assert(g.tryPickSlot(2), "pick 2");
const layout = {
  bins: g.state.bins.map((_, i) => ({ x: i * 80, y: 0, w: 70, h: 90 })),
  slots: [0, 1, 2, 3].map((i) => ({ x: i * 80, y: 300, w: 70, h: 90 })),
};
const ok = g.tryDrop(wrongBin * 80 + 35, 45, layout);
assert(ok === false, "wrong drop fails");
assert(g.state.slots.every(Boolean), "4 visible after wrong");
assert(g.state.slots.some((s) => s && s.key === key2), "card returned");
assert(g.visibleCount() <= 4, "visible <= 4");

const g2 = makeGame();
g2.startInfinite();
const fillKey = g2.state.slots[0]!.key;
const fillCat = g2.ITEMS[fillKey].category;
const fillBin = g2.state.bins.findIndex((b) => b.cat === fillCat);
for (let n = 0; n < BIN_MAX; n++) {
  g2.state.lockUntil = 0;
  assert(g2.tryDropOnBin(fillBin, fillKey), "fill " + n);
}
assert(g2.state.bins[fillBin].items.length === 0, "bin cleared at 5");
assert(g2.state.binsCleared === 1, "binsCleared 1");

const g3 = makeGame();
g3.startLevel(0);
assert(g3.state.screen === "game", "level 1 started");
assert(g3.state.mode === "level", "level mode");
const k = g3.state.slots[0]!.key;
const b = g3.state.bins.findIndex((x) => x.cat === g3.ITEMS[k].category);
for (let n = 0; n < BIN_MAX * 2; n++) {
  g3.state.lockUntil = 0;
  const key = g3.state.slots.find((s) => s && g3.ITEMS[s.key].category === g3.state.bins[b].cat)?.key || k;
  g3.tryDropOnBin(b, key);
  if (g3.state.screen === "win") break;
}
assert(g3.state.screen === "win", "level 1 can win by clearing 2 bins");
assert((g3.state.progress.stars["1"] || 0) >= 1, "star saved");
assert(g3.state.progress.unlocked >= 2, "level 2 unlocked");

const g4 = makeGame();
g4.startSlice();
assert(g4.state.mode === "slice", "slice mode");
assert(g4.state.screen === "game", "slice starts in game");
assert(g4.state.bins.length === 3, "slice 3 bins");
assert(g4.state.bins.map((b) => b.cat).join(",") === "fruit,sport,vehicle", "fruit sport vehicle");
assert(g4.state.bins.every((b) => b.revealed), "slice bins labeled");
assert(g4.state.slots.length === 4 && g4.state.slots.every(Boolean), "slice 4 hand");
assert(g4.state.deck.length === 14, "18 cards minus 4 hand");
assert(g4.state.slots.every((s) => s && s.id), "hand cards have ids");

const fruitBin = g4.state.bins.find((b) => b.cat === "fruit")!;
const vehicleBin = g4.state.bins.find((b) => b.cat === "vehicle")!;
g4.state.lockUntil = 0;
g4.state.slots[0] = { id: "item-apple", key: "apple", flipAt: 0 };
const wrong = g4.placeItem("item-apple", vehicleBin.id);
assert(wrong.success === false && wrong.reason === "WRONG_CATEGORY", "wrong category rejected");
assert(g4.state.slots[0] && g4.state.slots[0]!.key === "apple", "wrong place keeps hand");
assert(vehicleBin.items.length === 0, "wrong place does not enter");
assert(g4.state.screen === "game", "no game over on wrong");

g4.state.lockUntil = 0;
const okPlace = g4.placeItem("item-apple", fruitBin.id);
assert(okPlace.success === true, "apple into fruit");
assert(okPlace.completed === false, "not full yet");
assert(fruitBin.items[0] === "apple", "apple in fruit bin");
assert(g4.state.slots.every(Boolean) || g4.visibleCount() <= 4, "hand refilled or finite");

const g5 = makeGame();
g5.startSlice();
const fill = g5.state.bins.find((b) => b.cat === "fruit")!;
for (let n = 0; n < BIN_MAX; n++) {
  g5.state.lockUntil = 0;
  g5.state.slots[0] = { id: "fill-" + n, key: "apple", flipAt: 0 };
  const r = g5.placeItem("fill-" + n, fill.id);
  assert(r.success, "slice fill " + n);
  if (n === BIN_MAX - 1) assert(r.completed === true, "5th completes");
}
assert(fill.items.length === 0, "slice bin cleared at 5");
assert(g5.state.binsCleared === 1, "slice binsCleared 1");
assert(g5.state.screen === "game", "slice has no game over");

if (fail === 0) {
  console.log("✓ 规则测试通过");
  console.log("  - 首次 4 张已翻开");
  console.log("  - 取走自动补翻 / 放错退回");
  console.log("  - 第一次放对揭盖");
  console.log("  - 满 5 消除");
  console.log("  - 第 1 关过关解锁下一关");
  console.log("  - 切片 3 盒 / placeItem / 放错不失败 / 满 5 清空");
} else {
  console.error(`✗ ${fail} 项失败`);
  process.exit(1);
}
