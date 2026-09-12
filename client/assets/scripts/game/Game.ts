/**
 * 纯逻辑：牌库 / 手牌 / 盒子 / 拖拽规则。不碰 wx、不碰 Cocos 节点。
 */
import {
  BIN_MAX,
  CatKey,
  CATEGORIES,
  DEAL_MS,
  DECK_SIZE,
  DEFAULT_CATS,
  ITEMS,
  LEVELS,
  SCORE_BIN,
  SCORE_PLACE,
  SLOT_COUNT,
  STORAGE_PROGRESS,
  catDef,
  itemDef,
  itemsOfCat,
  type ItemDef,
  type LevelDef,
} from "./catalog";
import type { I18n } from "./i18n";

export type ScreenId = "home" | "levelSelect" | "game" | "win";
export type ModeId = "infinite" | "level";

export interface SlotCard {
  key: string;
  flipAt: number;
}

export interface BinState {
  cat: CatKey;
  items: string[];
  /** 第一次放对后显示分类名 */
  revealed: boolean;
  flashUntil: number;
}

export interface DragState {
  from: { kind: "slot"; i: number };
  type: string;
  x: number;
  y: number;
}

export interface Progress {
  unlocked: number;
  stars: Record<string, number>;
  sound: boolean;
  bestInfinite: number;
}

export interface GameState {
  screen: ScreenId;
  mode: ModeId;
  levelIndex: number;
  cats: CatKey[];
  bins: BinState[];
  deck: string[];
  slots: Array<SlotCard | null>;
  score: number;
  streak: number;
  bestStreak: number;
  binsCleared: number;
  goalProgress: number;
  drag: DragState | null;
  stars: number;
  lockUntil: number;
  toast: { text: string; until: number } | null;
  progress: Progress;
}

export interface HitRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DropLayout {
  bins: HitRect[];
  slots: HitRect[];
}

export interface StorageJson {
  getJSON(key: string): unknown;
  setJSON(key: string, value: unknown): void;
}

export interface AudioHooks {
  spawn(): void;
  pick(): void;
  place(): void;
  reject(): void;
  clear(n: number): void;
  combo(n: number): void;
  win(): void;
}

export interface GameDeps {
  now: () => number;
  storage: StorageJson;
  audio: AudioHooks;
  vibrate: (ms: number) => void;
  i18n: I18n;
  random?: () => number;
}

const silentAudio: AudioHooks = {
  spawn() {},
  pick() {},
  place() {},
  reject() {},
  clear() {},
  combo() {},
  win() {},
};

function defaultProgress(): Progress {
  return { unlocked: 1, stars: {}, sound: true, bestInfinite: 0 };
}

export class Game {
  readonly SLOT_COUNT = SLOT_COUNT;
  readonly DEAL_MS = DEAL_MS;
  readonly BIN_MAX = BIN_MAX;
  readonly LEVELS = LEVELS;
  readonly CATEGORIES = CATEGORIES;
  readonly ITEMS = ITEMS;
  readonly DEFAULT_CATS = DEFAULT_CATS;

  readonly state: GameState;

  constructor(private deps: GameDeps) {
    this.state = {
      screen: "home",
      mode: "infinite",
      levelIndex: 0,
      cats: DEFAULT_CATS.slice(),
      bins: [],
      deck: [],
      slots: [],
      score: 0,
      streak: 0,
      bestStreak: 0,
      binsCleared: 0,
      goalProgress: 0,
      drag: null,
      stars: 0,
      lockUntil: 0,
      toast: null,
      progress: defaultProgress(),
    };
    this.loadProgress();
  }

  itemDef(key: string): ItemDef | undefined {
    return itemDef(key);
  }

  catDef(key: string) {
    return catDef(key);
  }

  locked(): boolean {
    return this.deps.now() < this.state.lockUntil;
  }

  setToast(text: string, ms = 900): void {
    this.state.toast = { text, until: this.deps.now() + ms };
  }

  visibleCount(): number {
    return this.state.slots.filter(Boolean).length;
  }

  getStarsForLevel(levelId: number): number {
    return this.state.progress.stars[String(levelId)] || 0;
  }

  goalText(): string | null {
    const { state } = this;
    if (state.mode === "infinite") return null;
    const g = LEVELS[state.levelIndex].goal;
    const en = this.deps.i18n.isEn();
    if (g.type === "bins") {
      return en
        ? `Clear ${g.value} bins (${state.binsCleared}/${g.value})`
        : `装满消除 ${g.value} 盒（${state.binsCleared}/${g.value}）`;
    }
    if (g.type === "score") {
      return en ? `Reach ${g.value} pts (${state.score})` : `达到 ${g.value} 分（${state.score}）`;
    }
    if (g.type === "streak") {
      return en
        ? `${g.value} streak (best ${state.goalProgress})`
        : `连续正确 ${g.value} 次（最高 ${state.goalProgress}）`;
    }
    return "";
  }

  goHome(): void {
    this.cancelDrag();
    this.state.screen = "home";
  }

  goLevelSelect(): void {
    this.cancelDrag();
    this.state.screen = "levelSelect";
  }

  startInfinite(): void {
    this.state.mode = "infinite";
    this.resetRun(DEFAULT_CATS);
    this.state.screen = "game";
  }

  startLevel(index: number): void {
    if (index < 0 || index >= LEVELS.length) return;
    if (index + 1 > this.state.progress.unlocked) return;
    this.state.mode = "level";
    this.state.levelIndex = index;
    const lv = LEVELS[index];
    this.resetRun(lv.cats || DEFAULT_CATS);
    this.state.screen = "game";
  }

  startNextLevel(): void {
    const next = this.state.levelIndex + 1;
    if (next < LEVELS.length) this.startLevel(next);
    else this.goLevelSelect();
  }

  retryLevel(): void {
    this.startLevel(this.state.levelIndex);
  }

  tryPickSlot(i: number): boolean {
    const { state } = this;
    if (this.locked() || state.screen !== "game" || state.drag) return false;
    const slot = state.slots[i];
    if (!slot) return false;
    if (slot.flipAt && this.deps.now() - slot.flipAt < DEAL_MS) return false;
    state.drag = { from: { kind: "slot", i }, type: slot.key, x: 0, y: 0 };
    state.slots[i] = null;
    this.audio().pick();
    return true;
  }

  updateDragPos(x: number, y: number): void {
    if (!this.state.drag) return;
    this.state.drag.x = x;
    this.state.drag.y = y;
  }

  tryDropOnBin(binIndex: number, itemKey: string): boolean {
    if (this.locked()) return false;
    const bin = this.state.bins[binIndex];
    if (!bin || !itemKey) return false;
    const item = itemDef(itemKey);
    if (!item) return false;

    if (item.category !== bin.cat) {
      this.state.streak = 0;
      bin.flashUntil = this.deps.now() + 280;
      this.audio().reject();
      this.setToast(this.deps.i18n.t("toast_wrong"), 800);
      this.deps.vibrate(40);
      return false;
    }

    const firstReveal = !bin.revealed;
    bin.items.push(itemKey);
    bin.revealed = true;
    this.state.score += SCORE_PLACE + streakBonus(this.state.streak);
    this.state.streak += 1;
    this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
    this.audio().place();
    if (firstReveal) bin.flashUntil = this.deps.now() + 360;

    if (this.state.mode === "level") {
      const goal = LEVELS[this.state.levelIndex].goal;
      if (goal.type === "streak") this.state.goalProgress = Math.max(this.state.goalProgress, this.state.streak);
      else if (goal.type === "score") this.state.goalProgress = this.state.score;
    }

    if (bin.items.length >= BIN_MAX) this.clearBin(binIndex);
    this.refillHand(true);

    if (this.state.mode === "infinite" && this.state.score > this.state.progress.bestInfinite) {
      this.state.progress.bestInfinite = this.state.score;
      this.saveProgress();
    }
    if (this.state.mode === "level") this.checkLevelWin();
    return true;
  }

  tryDrop(x: number, y: number, layout: DropLayout): boolean {
    if (!this.state.drag) return false;
    const drag = this.state.drag;
    const binIdx = findNearest(x, y, layout.bins, 0.75);
    if (binIdx != null) {
      const ok = this.tryDropOnBin(binIdx, drag.type);
      if (!ok) this.putBack(drag);
      else this.state.drag = null;
      return ok;
    }
    this.putBack(drag);
    return false;
  }

  cancelDrag(): void {
    if (this.state.drag) this.putBack(this.state.drag);
  }

  dealToSlot(i: number, animate: boolean): boolean {
    if (i < 0 || i >= SLOT_COUNT) return false;
    if (this.state.slots[i]) return false;
    this.refillDeck();
    if (!this.state.deck.length) return false;
    const key = this.state.deck.pop() as string;
    this.state.slots[i] = { key, flipAt: animate === false ? 0 : this.deps.now() };
    if (animate !== false) this.audio().spawn();
    return true;
  }

  refillHand(animate: boolean): void {
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (!this.state.slots[i]) this.dealToSlot(i, animate !== false);
    }
  }

  saveProgress(): void {
    try {
      this.deps.storage.setJSON(STORAGE_PROGRESS, this.state.progress);
    } catch (_) {}
  }

  toggleSound(): boolean {
    this.state.progress.sound = !this.state.progress.sound;
    this.saveProgress();
    return this.state.progress.sound;
  }

  private audio(): AudioHooks {
    return this.deps.audio || silentAudio;
  }

  private rand(): number {
    return this.deps.random ? this.deps.random() : Math.random();
  }

  private loadProgress(): void {
    try {
      const data = this.deps.storage.getJSON(STORAGE_PROGRESS) as Partial<Progress> | null;
      if (data) {
        this.state.progress = {
          unlocked: Math.max(1, data.unlocked || 1),
          stars: data.stars || {},
          sound: data.sound !== false,
          bestInfinite: data.bestInfinite || 0,
        };
      }
    } catch (_) {}
  }

  private resetRun(cats: CatKey[]): void {
    const next = cats.slice(0, 4);
    while (next.length < 4) {
      const extra = DEFAULT_CATS.find((c) => next.indexOf(c) < 0);
      next.push(extra || DEFAULT_CATS[next.length % 4]);
    }
    this.state.cats = next;
    this.state.bins = next.map((c) => ({ cat: c, items: [], revealed: false, flashUntil: 0 }));
    this.state.deck = [];
    this.state.slots = [];
    this.refillDeck();
    for (let i = 0; i < SLOT_COUNT; i++) this.dealToSlot(i, false);
    this.state.score = 0;
    this.state.streak = 0;
    this.state.bestStreak = 0;
    this.state.binsCleared = 0;
    this.state.goalProgress = 0;
    this.state.stars = 0;
    this.state.drag = null;
    this.state.toast = null;
    this.state.lockUntil = 0;
  }

  private refillDeck(): void {
    while (this.state.deck.length < DECK_SIZE) this.state.deck.push(this.dealKey());
  }

  private dealKey(): string {
    const counts: Record<string, number> = {};
    for (const c of this.state.cats) counts[c] = 0;
    for (const s of this.state.slots) {
      if (s) {
        const it = itemDef(s.key);
        if (it) counts[it.category] = (counts[it.category] || 0) + 1;
      }
    }
    for (const bin of this.state.bins) counts[bin.cat] += bin.items.length * 0.35;
    const sorted = this.state.cats.slice().sort((a, b) => counts[a] - counts[b]);
    const cat = this.rand() < 0.72 ? sorted[0] : sorted[Math.floor(this.rand() * sorted.length)];
    const list = itemsOfCat(cat);
    return list[Math.floor(this.rand() * list.length)].key;
  }

  private putBack(drag: DragState): void {
    if (drag.from && drag.from.kind === "slot") {
      const i = drag.from.i;
      if (!this.state.slots[i]) this.state.slots[i] = { key: drag.type, flipAt: 0 };
    }
    this.state.drag = null;
    this.refillHand(false);
  }

  private clearBin(binIndex: number): void {
    const bin = this.state.bins[binIndex];
    const n = bin.items.length;
    const gained = scoreForBinClear(n);
    this.state.score += gained;
    this.state.binsCleared += 1;
    bin.items = [];
    bin.flashUntil = this.deps.now() + 400;
    this.audio().clear(1);
    if (this.state.streak >= 5) this.audio().combo(Math.min(this.state.streak, 7));
    this.deps.vibrate(30);
    if (this.state.mode === "level") {
      const goal = LEVELS[this.state.levelIndex].goal;
      if (goal.type === "bins") this.state.goalProgress = this.state.binsCleared;
      else if (goal.type === "score") this.state.goalProgress = this.state.score;
    }
    this.state.lockUntil = this.deps.now() + 280;
  }

  private checkLevelWin(): void {
    const level: LevelDef = LEVELS[this.state.levelIndex];
    const goal = level.goal;
    const done =
      (goal.type === "bins" && this.state.binsCleared >= goal.value) ||
      (goal.type === "score" && this.state.score >= goal.value) ||
      (goal.type === "streak" && this.state.goalProgress >= goal.value);
    if (!done) return;

    let stars = 1;
    if (goal.type === "score") {
      stars = this.state.score >= goal.value * 1.5 ? 3 : this.state.score >= goal.value * 1.2 ? 2 : 1;
    } else if (this.state.bestStreak >= 10) stars = 3;
    else if (this.state.bestStreak >= 6) stars = 2;

    const levelId = String(level.id);
    const prev = this.state.progress.stars[levelId] || 0;
    if (stars > prev) this.state.progress.stars[levelId] = stars;
    if (level.id >= this.state.progress.unlocked && level.id < LEVELS.length) {
      this.state.progress.unlocked = level.id + 1;
    }
    this.saveProgress();
    this.state.stars = stars;
    this.state.lockUntil = this.deps.now() + 400;
    this.state.screen = "win";
    this.audio().win();
  }
}

function scoreForBinClear(fillCount: number): number {
  const i = Math.min(fillCount, SCORE_BIN.length - 1);
  return SCORE_BIN[i] || 100;
}

function streakBonus(streak: number): number {
  if (streak >= 12) return 80;
  if (streak >= 8) return 40;
  if (streak >= 5) return 20;
  if (streak >= 3) return 10;
  return 0;
}

function findNearest(x: number, y: number, rects: HitRect[] | undefined, snapMul: number): number | null {
  if (!rects) return null;
  let best: number | null = null;
  let bestDist = Infinity;
  rects.forEach((b, i) => {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(x - cx, y - cy);
    const snap = Math.max(b.w, b.h) * snapMul;
    if (d < snap && d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}
