import { Color, EventTouch, Label, Node, UITransform, Vec3, view } from "cc";
import { BIN_MAX, SLOT_COUNT, itemDef } from "../game/catalog";
import type { Game } from "../game/Game";
import { AppSession } from "../shell/AppSession";
import { C, makeLabel, makeNode, onTap, paintRound } from "./UiKit";

const XS = [-255, -85, 85, 255];
const BIN_Y = 140;
const SLOT_Y = -280;
const CARD_W = 150;
const CARD_H = 168;
const BIN_W = 150;
const BIN_H = 176;

function uiToLocal(root: Node, ev: EventTouch): Vec3 {
  const loc = ev.getUILocation();
  const ui = root.getComponent(UITransform)!;
  return ui.convertToNodeSpaceAR(new Vec3(loc.x, loc.y, 0));
}

function nearest(x: number, y: number, ys: number, snap: number): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const d = Math.hypot(x - XS[i], y - ys);
    if (d < snap && d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export class PlayBoard {
  private binNodes: Node[] = [];
  private binCaptions: Label[] = [];
  private slotNodes: Node[] = [];
  private scoreLab: Label | null = null;
  private goalLab: Label | null = null;
  private toastLab: Label | null = null;
  private ghost: Node | null = null;
  private dragging = false;
  private winShown = false;

  constructor(private root: Node, private game: Game, private onExit: () => void) {}

  build(): void {
    const i18n = AppSession.i18n!;
    const vis = view.getVisibleSize();
    paintRound(this.root, new Color(243, 237, 227, 255), 0);

    this.scoreLab = makeLabel(this.root, "Score", "0", 28, C.ink, vis.width - 160, 40);
    this.scoreLab.node.setPosition(0, 420);
    this.goalLab = makeLabel(this.root, "Goal", i18n.t("infinite_sub"), 16, C.mute, vis.width - 48, 32);
    this.goalLab.node.setPosition(0, 380);

    const back = makeNode("Back", this.root, 100, 44);
    paintRound(back, C.paper, 12);
    makeLabel(back, "T", i18n.t("back"), 18, C.ink, 90, 32);
    back.setPosition(-(Math.min(vis.width, 720) * 0.5 - 70), 420);
    onTap(back, () => this.onExit());

    for (let i = 0; i < SLOT_COUNT; i++) {
      const bin = makeNode("Bin" + i, this.root, BIN_W, BIN_H);
      paintRound(bin, C.paper, 16);
      bin.setPosition(XS[i], BIN_Y);
      const cap = makeLabel(bin, "Cap", "?", 22, C.mute, BIN_W - 12, 36);
      cap.node.setPosition(0, 40);
      makeLabel(bin, "Hint", i18n.t("anonymous"), 14, C.mute, BIN_W - 12, 24).node.setPosition(0, -50);
      this.binNodes.push(bin);
      this.binCaptions.push(cap);
    }

    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = makeNode("Slot" + i, this.root, CARD_W, CARD_H);
      paintRound(slot, C.paper, 16);
      slot.setPosition(XS[i], SLOT_Y);
      makeLabel(slot, "Emoji", "", 42, C.ink, CARD_W - 8, 56).node.setPosition(0, 28);
      makeLabel(slot, "Name", "", 18, C.ink, CARD_W - 12, 32).node.setPosition(0, -36);
      this.slotNodes.push(slot);
    }

    this.toastLab = makeLabel(this.root, "Toast", "", 20, C.ink, 420, 40);
    this.toastLab.node.setPosition(0, -40);
    this.toastLab.node.active = false;

    this.root.on(Node.EventType.TOUCH_START, this.onDown, this);
    this.root.on(Node.EventType.TOUCH_MOVE, this.onMove, this);
    this.root.on(Node.EventType.TOUCH_END, this.onUp, this);
    this.root.on(Node.EventType.TOUCH_CANCEL, this.onCancel, this);
    this.syncSlots();
    this.syncBins();
    this.refreshHud();
  }

  tick(): void {
    if (!this.game) return;
    this.refreshHud();
    this.syncSlots();
    this.syncBins();
    if (this.game.state.screen === "win") this.showWin();
  }

  dispose(): void {
    this.root.off(Node.EventType.TOUCH_START, this.onDown, this);
    this.root.off(Node.EventType.TOUCH_MOVE, this.onMove, this);
    this.root.off(Node.EventType.TOUCH_END, this.onUp, this);
    this.root.off(Node.EventType.TOUCH_CANCEL, this.onCancel, this);
  }

  private syncSlots(): void {
    const i18n = AppSession.i18n!;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = this.game.state.slots[i];
      const node = this.slotNodes[i];
      const emojiNode = node.getChildByName("Emoji");
      const nameNode = node.getChildByName("Name");
      const emoji = emojiNode ? emojiNode.getComponent(Label) : null;
      const name = nameNode ? nameNode.getComponent(Label) : null;
      const draggingThis = this.game.state.drag && this.game.state.drag.from.i === i;
      if (!slot || draggingThis) {
        if (emoji) emoji.string = "";
        if (name) name.string = "";
        paintRound(node, new Color(232, 226, 216, 255), 16);
        continue;
      }
      const it = itemDef(slot.key);
      if (emoji) emoji.string = it ? it.emoji : "?";
      if (name) name.string = i18n.localized(it);
      paintRound(node, C.paper, 16);
    }
  }

  private syncBins(): void {
    const i18n = AppSession.i18n!;
    this.game.state.bins.forEach((bin, i) => {
      const cat = this.game.catDef(bin.cat);
      const cap = this.binCaptions[i];
      const node = this.binNodes[i];
      const fill = `${bin.items.length}/${BIN_MAX}`;
      if (bin.revealed) {
        cap.string = i18n.localized(cat);
        cap.color = C.ink;
        paintRound(node, hexToColor(cat ? cat.soft : "#FFFFFF"), 16);
      } else {
        cap.string = "?";
        cap.color = C.mute;
        paintRound(node, C.paper, 16);
      }
      const hintNode = node.getChildByName("Hint");
      const hint = hintNode ? hintNode.getComponent(Label) : null;
      if (hint) hint.string = fill;
    });
  }

  private refreshHud(): void {
    if (!this.scoreLab) return;
    const i18n = AppSession.i18n!;
    const s = this.game.state;
    this.scoreLab.string = String(s.score) + (s.streak >= 3 ? "  " + i18n.t("streak", { n: s.streak }) : "");
    const goal = this.game.goalText();
    if (this.goalLab) this.goalLab.string = goal || i18n.t("infinite_sub");
    if (s.toast && Date.now() < s.toast.until) {
      this.toastLab!.string = s.toast.text;
      this.toastLab!.node.active = true;
    } else if (this.toastLab) this.toastLab.node.active = false;
  }

  private onDown(ev: EventTouch): void {
    if (this.game.state.screen !== "game" || this.game.locked()) return;
    const p = uiToLocal(this.root, ev);
    if (p.y > 360) return;
    const si = nearest(p.x, p.y, SLOT_Y, 90);
    if (si == null) return;
    if (!this.game.tryPickSlot(si)) return;
    this.dragging = true;
    this.makeGhost(this.game.state.drag!.type, p);
    this.syncSlots();
  }

  private onMove(ev: EventTouch): void {
    if (!this.dragging || !this.game.state.drag) return;
    const p = uiToLocal(this.root, ev);
    this.game.updateDragPos(p.x, p.y);
    if (this.ghost) this.ghost.setPosition(p.x, p.y);
  }

  private onUp(ev: EventTouch): void {
    if (!this.dragging) return;
    this.dragging = false;
    const p = uiToLocal(this.root, ev);
    const drag = this.game.state.drag;
    if (this.ghost && this.ghost.isValid) this.ghost.destroy();
    this.ghost = null;
    if (!drag) {
      this.syncSlots();
      return;
    }
    const bi = nearest(p.x, p.y, BIN_Y, 100);
    if (bi != null) {
      const ok = this.game.tryDropOnBin(bi, drag.type);
      if (!ok) this.game.cancelDrag();
      else this.game.state.drag = null;
    } else this.game.cancelDrag();
    this.syncSlots();
    this.syncBins();
    this.refreshHud();
  }

  private onCancel(): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.ghost && this.ghost.isValid) this.ghost.destroy();
    this.ghost = null;
    this.game.cancelDrag();
    this.syncSlots();
  }

  private makeGhost(key: string, p: Vec3): void {
    const i18n = AppSession.i18n!;
    const it = itemDef(key);
    const g = makeNode("Ghost", this.root, CARD_W, CARD_H);
    paintRound(g, C.paper, 16);
    makeLabel(g, "E", it ? it.emoji : "?", 42, C.ink, CARD_W - 8, 56).node.setPosition(0, 28);
    makeLabel(g, "N", i18n.localized(it), 18, C.ink, CARD_W - 12, 32).node.setPosition(0, -36);
    g.setPosition(p.x, p.y);
    this.ghost = g;
  }

  private showWin(): void {
    if (this.winShown) return;
    this.winShown = true;
    const i18n = AppSession.i18n!;
    const vis = view.getVisibleSize();
    const panel = makeNode("Win", this.root, vis.width, vis.height);
    paintRound(panel, new Color(243, 237, 227, 235), 0);
    makeLabel(panel, "T", i18n.t("win"), 40, C.ink, 480, 56).node.setPosition(0, 160);
    makeLabel(
      panel,
      "S",
      i18n.t("win_stats", { s: this.game.state.score, b: this.game.state.binsCleared }),
      20,
      C.mute,
      480,
      40,
    ).node.setPosition(0, 100);
    makeLabel(panel, "Stars", "★".repeat(this.game.state.stars || 1), 28, C.red, 240, 40).node.setPosition(0, 50);
    const next = makeNode("Next", panel, 280, 56);
    paintRound(next, C.red, 14);
    makeLabel(next, "T", i18n.t("next"), 22, C.white, 260, 40);
    next.setPosition(0, -20);
    onTap(next, () => {
      this.game.startNextLevel();
      this.winShown = false;
      if (panel.isValid) panel.destroy();
      if (this.game.state.screen === "game") {
        this.syncSlots();
        this.syncBins();
        this.refreshHud();
      } else this.onExit();
    });
    const home = makeNode("Home", panel, 280, 48);
    makeLabel(home, "T", i18n.t("home"), 18, C.mute, 260, 36);
    home.setPosition(0, -90);
    onTap(home, () => this.onExit());
  }
}

function hexToColor(hex: string): Color {
  const h = hex.replace("#", "");
  return new Color(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255);
}
