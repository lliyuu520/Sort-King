import {
  _decorator,
  Camera,
  Color,
  Component,
  EventTouch,
  Input,
  Label,
  Node,
  UITransform,
  Tween,
  Vec3,
  input,
  Layers,
  tween,
  view,
} from "cc";
import { BIN_MAX, SLOT_COUNT } from "../game/catalog";
import type { Game } from "../game/Game";
import { DragController } from "../input/DragController";
import { AppSession } from "../shell/AppSession";
import { paused, safeInsets } from "../shell/WxShell";
import { binXs, makeBin, SLOT_XS } from "./BinView";
import { makeItemToy } from "./ItemView";
import { addMesh, boxMesh, hexColor, planeMesh, setMeshColor } from "./PrimitiveFactory";
import { C, applyBottomSafe, applyTopSafe, ensureUiCamera, makeLabel, makeNode, onTap, paintRound } from "./UiKit";

const { ccclass, property } = _decorator;

const DESK_Y = 0;
const BIN_Z = -2.4;
const SLOT_Z = 2.15;
const LIFT = 0.55;
const SNAP = 1.7;
const PICK_S = 0.1;
const PLACE_S = 0.2;
const REJECT_S = 0.2;
const CLEAR_S = 0.4;

@ccclass("PlayView")
export class PlayView extends Component {
  @property(Camera)
  cameraRef: Camera | null = null;

  private game!: Game;
  private world: Node | null = null;
  private hud: Node | null = null;
  private binRoots: Node[] = [];
  private binLids: Node[] = [];
  private binLabels: Label[] = [];
  private binFillToys: Node[][] = [];
  private slotPads: Node[] = [];
  private slotToys: Array<Node | null> = [null, null, null, null];
  private dragToy: Node | null = null;
  private scoreLab: Label | null = null;
  private goalLab: Label | null = null;
  private toastLab: Label | null = null;
  private winPanel: Node | null = null;
  private drag = new DragController(DESK_Y);
  private dragging = false;
  private busy = false;
  private lastKeys: Array<string | null> = [null, null, null, null];
  private lastFills: number[] = [];
  private lastRevealed: boolean[] = [];
  private lastFlash: number[] = [];
  private leaveAsk: Node | null = null;
  private slotSig = "";
  private xsBin: number[] = [];

  start(): void {
    try {
      AppSession.startPending();
      this.game = AppSession.ensure();
      ensureUiCamera(this.canvas(), false);
      this.lockCamera();
      this.buildWorld();
      try {
        this.buildHud();
      } catch (e) {
        console.error("[PlayView] HUD failed", e);
      }
      this.syncToys(true);
      this.syncBins(true);
      this.refreshHud();
      input.on(Input.EventType.TOUCH_START, this.onDown, this);
      input.on(Input.EventType.TOUCH_MOVE, this.onMove, this);
      input.on(Input.EventType.TOUCH_END, this.onUp, this);
      input.on(Input.EventType.TOUCH_CANCEL, this.onCancel, this);
    } catch (e) {
      console.error("[PlayView] start failed", e);
    }
  }

  onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.onDown, this);
    input.off(Input.EventType.TOUCH_MOVE, this.onMove, this);
    input.off(Input.EventType.TOUCH_END, this.onUp, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.onCancel, this);
    if (this.world && this.world.isValid) this.world.destroy();
    this.world = null;
  }

  update(): void {
    if (!this.game) return;
    if (!this.hud || !this.hud.isValid) {
      try {
        this.buildHud();
      } catch (_) {}
    }
    this.refreshHud();
    if (this.busy) return;
    const sig = this.game.state.slots.map((s) => (s ? s.id : "")).join(",");
    if (sig !== this.slotSig) {
      this.slotSig = sig;
      this.syncToys(true);
    }
    this.syncBins(false);
    if (this.game.state.screen === "win") this.showWin();
    if (this.game.state.drag && this.dragToy && this.dragging) {
      this.dragToy.setWorldPosition(this.game.state.drag.x, LIFT, this.game.state.drag.y);
    }
  }

  private cam(): Camera {
    if (this.cameraRef && this.cameraRef.isValid) return this.cameraRef;
    const n = this.node.scene.getChildByName("Main Camera");
    const found = n && n.getComponent(Camera);
    if (found) return found;
    return this.node.getComponent(Camera) || this.node.addComponent(Camera);
  }

  private lockCamera(): void {
    const cam = this.cam();
    const n = cam.node;
    n.setPosition(0, 9.2, 9.6);
    n.lookAt(new Vec3(0, 0.2, 0.15));
    cam.projection = Camera.ProjectionType.PERSPECTIVE;
    cam.fov = 28;
    cam.near = 0.1;
    cam.far = 80;
    cam.priority = 0;
    cam.visibility = Layers.Enum.DEFAULT;
    cam.clearColor = hexColor("#F3EDE3");
    cam.clearFlags = 7;
    cam.enabled = true;
  }

  private buildWorld(): void {
    const leftover = this.node.scene.getChildByName("DeskWorld");
    if (leftover && leftover.isValid) leftover.destroy();
    this.world = new Node("DeskWorld");
    this.world.layer = Layers.Enum.DEFAULT;
    this.node.scene.addChild(this.world);

    const desk = addMesh(this.world, "Desk", planeMesh(9.2, 11.2), hexColor("#D7C4A3"));
    desk.setPosition(0, DESK_Y, 0);
    const lip = addMesh(this.world, "Lip", boxMesh(9.2, 0.18, 11.2), hexColor("#C4A574"));
    lip.setPosition(0, -0.12, 0);

    for (let i = 0; i < SLOT_COUNT; i++) {
      const pad = addMesh(this.world, "Pad" + i, boxMesh(1.55, 0.06, 1.55), hexColor("#E8DFD0"));
      pad.setPosition(SLOT_XS[i], 0.03, SLOT_Z);
      this.slotPads.push(pad);
    }

    this.xsBin = binXs(this.game.binCount());
    this.game.state.bins.forEach((bin, i) => {
      const cat = this.game.catDef(bin.cat);
      const made = makeBin(this.world!, "Bin" + i, this.xsBin[i], BIN_Z, cat ? cat.soft : "#F4EEE4");
      this.binRoots.push(made.root);
      this.binLids.push(made.lid);
      this.binFillToys.push([]);
    });
  }

  private canvas(): Node {
    return this.node.name === "Canvas" ? this.node : this.node.getChildByName("Canvas") || this.node;
  }

  private buildHud(): void {
    const canvas = this.canvas();
    const vis = view.getVisibleSize();
    this.hud = makeNode("HUD", canvas, vis.width, vis.height);
    const hudUi = this.hud.getComponent(UITransform);
    if (hudUi) hudUi.hitTest = () => false;
    const i18n = AppSession.i18n!;

    this.scoreLab = makeLabel(this.hud, "Score", "0", 28, C.ink, vis.width - 160, 40);
    applyTopSafe(this.scoreLab.node, 8);

    this.goalLab = makeLabel(this.hud, "Goal", "", 16, C.mute, vis.width - 48, 32);
    this.goalLab.node.setPosition(0, vis.height * 0.5 - 88 - safeInsets().top);

    const back = makeNode("Back", this.hud, 100, 44);
    paintRound(back, C.paper, 12);
    makeLabel(back, "T", i18n.t("back"), 18, C.ink, 90, 32);
    back.setPosition(-(vis.width * 0.5 - 70), vis.height * 0.5 - 40);
    applyTopSafe(back, 8);
    onTap(back, () => this.confirmLeave());

    this.toastLab = makeLabel(this.hud, "Toast", "", 20, C.white, 420, 44);
    paintRound(this.toastLab.node, C.toast, 12);
    this.toastLab.node.active = false;
    applyBottomSafe(this.toastLab.node, 24);

    this.binLabels = [];
    for (let i = 0; i < this.game.binCount(); i++) {
      const lab = makeLabel(this.hud, "BinName" + i, "", 16, C.ink, 140, 28);
      this.binLabels.push(lab);
    }
    this.layoutBinLabels();
  }

  private layoutBinLabels(): void {
    const vis = view.getVisibleSize();
    const n = Math.max(this.binLabels.length, 1);
    const y = vis.height * 0.18;
    const span = Math.min(vis.width - 48, 560);
    const step = n <= 1 ? 0 : span / (n - 1);
    const x0 = n <= 1 ? 0 : -span / 2;
    this.binLabels.forEach((lab, i) => lab.node.setPosition(x0 + i * step, y));
  }

  private syncToys(force: boolean): void {
    if (!this.world || !this.world.isValid) return;
    const slots = this.game.state.slots;
    const draggingI = this.game.state.drag ? this.game.state.drag.from.i : -1;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const key = slots[i] ? slots[i]!.key : null;
      const existing = this.slotToys[i];
      const alive = !!(existing && existing.isValid);
      if (!force && key === this.lastKeys[i] && alive) continue;
      if (alive) existing!.destroy();
      this.slotToys[i] = null;
      this.lastKeys[i] = key;
      if (!key || draggingI === i) continue;
      const toy = makeItemToy(key, this.world);
      toy.setPosition(SLOT_XS[i], 0, SLOT_Z);
      this.slotToys[i] = toy;
      this.pop(toy);
    }
  }

  private syncBins(force: boolean): void {
    const i18n = AppSession.i18n!;
    this.game.state.bins.forEach((bin, i) => {
      const fill = bin.items.length;
      const lab = this.binLabels[i];
      if (!lab) return;
      if (this.lastFills[i] == null) this.lastFills[i] = -1;
      if (force || fill !== this.lastFills[i] || bin.revealed !== this.lastRevealed[i]) {
        this.lastFills[i] = fill;
        this.lastRevealed[i] = bin.revealed;
        const cat = this.game.catDef(bin.cat);
        const lid = this.binLids[i];
        if (bin.revealed) {
          lid.active = false;
          setMeshColor(this.binRoots[i].getChildByName("Body")!, hexColor(cat ? cat.soft : "#FFFFFF"));
          lab.string = `${i18n.localized(cat)} ${fill}/${BIN_MAX}`;
        } else {
          lid.active = true;
          lab.string = `${fill}/${BIN_MAX}`;
        }
        this.syncBinFill(i, bin.items);
      }
      if (bin.flashUntil > Date.now() && bin.flashUntil !== this.lastFlash[i]) {
        this.lastFlash[i] = bin.flashUntil;
        this.shake(this.binRoots[i]);
      }
    });
  }

  private syncBinFill(i: number, keys: string[]): void {
    if (!this.world) return;
    const old = this.binFillToys[i] || [];
    old.forEach((n) => n.isValid && n.destroy());
    this.binFillToys[i] = [];
    keys.forEach((key, k) => {
      const toy = makeItemToy(key, this.world!);
      toy.setScale(0.42, 0.42, 0.42);
      const ox = ((k % 3) - 1) * 0.28;
      const oz = Math.floor(k / 3) * 0.28 - 0.1;
      toy.setPosition(this.xsBin[i] + ox, 0.55, BIN_Z + oz);
      this.binFillToys[i].push(toy);
    });
  }

  private refreshHud(): void {
    if (!this.scoreLab) return;
    const s = this.game.state;
    const i18n = AppSession.i18n!;
    this.scoreLab.string = String(s.score) + (s.streak >= 3 ? "  " + i18n.t("streak", { n: s.streak }) : "");
    const goal = this.game.goalText();
    this.goalLab!.string = goal || i18n.t("infinite_sub");
    if (s.toast && Date.now() < s.toast.until) {
      this.toastLab!.string = s.toast.text;
      this.toastLab!.node.active = true;
    } else if (this.toastLab) this.toastLab.node.active = false;
  }

  private onDown(ev: EventTouch): void {
    if (paused || this.busy || this.game.locked() || this.game.state.screen !== "game") return;
    if (this.leaveAsk && this.leaveAsk.active) return;
    const ui = ev.getUILocation();
    const vis = view.getVisibleSize();
    if (ui.y > vis.height - 72) return;
    const p = this.drag.screenToDesk(this.cam(), ev);
    if (!p) return;
    const si = this.drag.nearest(p.x, p.z, SLOT_XS, SLOT_Z, SNAP);
    if (si == null) return;
    if (!this.game.tryPickSlot(si)) return;
    const toy = this.slotToys[si];
    this.slotToys[si] = null;
    this.lastKeys[si] = null;
    this.dragToy = toy;
    this.dragging = true;
    if (toy) {
      Tween.stopAllByTarget(toy);
      tween(toy)
        .to(PICK_S, { scale: new Vec3(1.08, 1.08, 1.08) }, { easing: "sineOut" })
        .start();
      this.game.updateDragPos(p.x, p.z);
      toy.setWorldPosition(p.x, LIFT, p.z);
    }
  }

  private onMove(ev: EventTouch): void {
    if (!this.dragging || !this.game.state.drag) return;
    const p = this.drag.screenToDesk(this.cam(), ev);
    if (!p) return;
    this.game.updateDragPos(p.x, p.z);
    if (this.dragToy) this.dragToy.setWorldPosition(p.x, LIFT, p.z);
  }

  private onUp(ev: EventTouch): void {
    if (!this.dragging) return;
    this.dragging = false;
    const p = this.drag.screenToDesk(this.cam(), ev) || new Vec3(this.game.state.drag?.x || 0, 0, this.game.state.drag?.y || 0);
    const bi = this.drag.nearest(p.x, p.z, this.xsBin, BIN_Z, SNAP);
    const drag = this.game.state.drag;
    const toy = this.dragToy;
    this.dragToy = null;
    if (!drag) {
      if (toy && toy.isValid) toy.destroy();
      this.syncToys(true);
      return;
    }
    if (bi != null) {
      const bin = this.game.state.bins[bi];
      const result = this.game.placeItem(drag.id, bin.id);
      if (result.success) this.playPlaceOk(toy, bi, result.completed);
      else this.playReject(toy, drag.from.i, bi);
    } else {
      this.playReject(toy, drag.from.i, -1);
    }
  }

  private onCancel(): void {
    if (!this.dragging) return;
    this.dragging = false;
    const drag = this.game.state.drag;
    const toy = this.dragToy;
    this.dragToy = null;
    if (drag) this.playReject(toy, drag.from.i, -1);
    else {
      if (toy && toy.isValid) toy.destroy();
      this.game.cancelDrag();
      this.syncToys(true);
    }
  }

  private playPlaceOk(toy: Node | null, binI: number, completed: boolean): void {
    this.busy = true;
    const dest = new Vec3(this.xsBin[binI], 0.7, BIN_Z);
    const body = this.binRoots[binI] && this.binRoots[binI].getChildByName("Body");
    if (body) this.shake(body);
    if (!toy || !toy.isValid) {
      this.afterPlace(binI, completed, null);
      return;
    }
    Tween.stopAllByTarget(toy);
    tween(toy)
      .to(PLACE_S, { position: dest, scale: new Vec3(0.42, 0.42, 0.42) }, { easing: "sineIn" })
      .call(() => this.afterPlace(binI, completed, toy))
      .start();
  }

  private afterPlace(binI: number, completed: boolean, incoming: Node | null): void {
    const lab = this.binLabels[binI];
    const bin = this.game.state.bins[binI];
    const cat = this.game.catDef(bin.cat);
    const i18n = AppSession.i18n!;
    if (lab) lab.string = `${i18n.localized(cat)} ${completed ? 0 : bin.items.length}/${BIN_MAX}`;
    if (completed) {
      if (incoming && incoming.isValid) this.binFillToys[binI].push(incoming);
      this.playClear(binI);
      return;
    }
    if (incoming && incoming.isValid) {
      const k = this.binFillToys[binI].length;
      const ox = ((k % 3) - 1) * 0.28;
      const oz = Math.floor(k / 3) * 0.28 - 0.1;
      incoming.setScale(0.42, 0.42, 0.42);
      incoming.setPosition(this.xsBin[binI] + ox, 0.55, BIN_Z + oz);
      this.binFillToys[binI].push(incoming);
    }
    this.lastFills[binI] = bin.items.length;
    this.lastRevealed[binI] = bin.revealed;
    this.busy = false;
    this.slotSig = "";
    this.syncToys(true);
  }

  private playReject(toy: Node | null, slotI: number, binI: number): void {
    this.busy = true;
    this.game.cancelDrag();
    if (binI >= 0) {
      const body = this.binRoots[binI] && this.binRoots[binI].getChildByName("Body");
      if (body) this.shake(body);
    }
    const dest = new Vec3(SLOT_XS[slotI], 0, SLOT_Z);
    if (!toy || !toy.isValid) {
      this.busy = false;
      this.slotSig = "";
      this.syncToys(true);
      return;
    }
    Tween.stopAllByTarget(toy);
    tween(toy)
      .to(REJECT_S, { position: dest, scale: Vec3.ONE }, { easing: "backOut" })
      .call(() => {
        this.slotToys[slotI] = toy;
        this.lastKeys[slotI] = this.game.state.slots[slotI] ? this.game.state.slots[slotI]!.key : null;
        this.busy = false;
        this.slotSig = this.game.state.slots.map((s) => (s ? s.id : "")).join(",");
      })
      .start();
  }

  private playClear(binI: number): void {
    const root = this.binRoots[binI];
    const fills = this.binFillToys[binI] || [];
    Tween.stopAllByTarget(root);
    tween(root)
      .to(0.12, { scale: new Vec3(1.12, 1.12, 1.12) }, { easing: "sineOut" })
      .to(0.08, { scale: new Vec3(1.04, 0.96, 1.04) })
      .to(0.12, { scale: Vec3.ONE }, { easing: "sineInOut" })
      .start();
    const body = root.getChildByName("Body");
    if (body) this.shake(body);
    fills.forEach((n) => {
      if (!n.isValid) return;
      Tween.stopAllByTarget(n);
      tween(n)
        .to(CLEAR_S * 0.7, { scale: new Vec3(0.02, 0.02, 0.02) }, { easing: "sineIn" })
        .call(() => n.isValid && n.destroy())
        .start();
    });
    this.scheduleOnce(() => {
      this.binFillToys[binI] = [];
      this.busy = false;
      this.syncBins(true);
      this.syncToys(true);
    }, CLEAR_S);
  }

  private pop(n: Node): void {
    n.setScale(0.2, 0.2, 0.2);
    tween(n)
      .to(0.18, { scale: new Vec3(1.08, 0.92, 1.08) }, { easing: "backOut" })
      .to(0.1, { scale: Vec3.ONE })
      .start();
  }

  private shake(n: Node): void {
    const p = n.position.clone();
    tween(n)
      .to(0.04, { position: new Vec3(p.x + 0.06, p.y, p.z) })
      .to(0.08, { position: new Vec3(p.x - 0.06, p.y, p.z) })
      .to(0.04, { position: p })
      .start();
  }

  private confirmLeave(): void {
    if (this.game.state.screen === "win") {
      AppSession.goBoot();
      return;
    }
    const i18n = AppSession.i18n!;
    const vis = view.getVisibleSize();
    if (this.leaveAsk && this.leaveAsk.isValid) {
      this.leaveAsk.active = true;
      return;
    }
    const panel = makeNode("Leave", this.hud!, vis.width, vis.height);
    paintRound(panel, new Color(0, 0, 0, 140), 0);
    const card = makeNode("Card", panel, 420, 220);
    paintRound(card, C.paper, 16);
    card.setPosition(0, 20);
    makeLabel(card, "Q", i18n.t("home") + "?", 24, C.ink, 380, 48).node.setPosition(0, 50);
    const yes = makeNode("Yes", card, 160, 48);
    paintRound(yes, C.red, 12);
    makeLabel(yes, "T", i18n.t("home"), 18, C.white, 150, 36);
    yes.setPosition(-90, -40);
    onTap(yes, () => {
      this.game.goHome();
      AppSession.goBoot();
    });
    const no = makeNode("No", card, 160, 48);
    paintRound(no, C.line, 12);
    makeLabel(no, "T", i18n.t("back"), 18, C.ink, 150, 36);
    no.setPosition(90, -40);
    onTap(no, () => {
      panel.active = false;
    });
    this.leaveAsk = panel;
  }

  private showWin(): void {
    if (this.winPanel && this.winPanel.active) return;
    const i18n = AppSession.i18n!;
    const vis = view.getVisibleSize();
    if (this.winPanel && this.winPanel.isValid) {
      this.winPanel.active = true;
      return;
    }
    this.winPanel = makeNode("Win", this.hud!, vis.width, vis.height);
    paintRound(this.winPanel, new Color(243, 237, 227, 235), 0);
    makeLabel(this.winPanel, "T", i18n.t("win"), 40, C.ink, 480, 56).node.setPosition(0, 160);
    makeLabel(
      this.winPanel,
      "S",
      i18n.t("win_stats", { s: this.game.state.score, b: this.game.state.binsCleared }),
      20,
      C.mute,
      480,
      40,
    ).node.setPosition(0, 100);
    makeLabel(this.winPanel, "Stars", "★".repeat(this.game.state.stars), 28, C.red, 240, 40).node.setPosition(0, 50);

    const next = makeNode("Next", this.winPanel, 280, 56);
    paintRound(next, C.red, 14);
    makeLabel(next, "T", i18n.t("next"), 22, C.white, 260, 40);
    next.setPosition(0, -20);
    onTap(next, () => {
      this.game.startNextLevel();
      if (this.game.state.screen === "game") {
        this.winPanel!.active = false;
        this.syncToys(true);
        this.syncBins(true);
      } else AppSession.goBoot();
    });

    const retry = makeNode("Retry", this.winPanel, 280, 56);
    paintRound(retry, C.paper, 14);
    makeLabel(retry, "T", i18n.t("retry"), 22, C.ink, 260, 40);
    retry.setPosition(0, -90);
    onTap(retry, () => {
      this.game.retryLevel();
      this.winPanel!.active = false;
      this.syncToys(true);
      this.syncBins(true);
    });

    const home = makeNode("Home", this.winPanel, 280, 48);
    makeLabel(home, "T", i18n.t("home"), 18, C.mute, 260, 36);
    home.setPosition(0, -150);
    onTap(home, () => AppSession.goBoot());
    this.winPanel.active = true;
  }
}
