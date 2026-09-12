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
  geometry,
  input,
  Layers,
  tween,
  view,
} from "cc";
import { BIN_MAX, SLOT_COUNT, itemDef } from "../game/catalog";
import type { Game } from "../game/Game";
import { AppSession } from "../shell/AppSession";
import { paused, safeInsets } from "../shell/WxShell";
import { addMesh, boxMesh, cylinderMesh, hexColor, planeMesh, setMeshColor, sphereMesh } from "./PrimitiveFactory";
import { C, applyBottomSafe, applyTopSafe, ensureUiCamera, makeLabel, makeNode, onTap, paintRound } from "./UiKit";

const { ccclass, property } = _decorator;

const DESK_Y = 0;
const BIN_Z = -2.4;
const SLOT_Z = 2.15;
const XS = [-2.7, -0.9, 0.9, 2.7];
const LIFT = 0.55;
  const SNAP = 1.7;

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
  private slotPads: Node[] = [];
  private slotToys: Array<Node | null> = [null, null, null, null];
  private dragToy: Node | null = null;
  private scoreLab: Label | null = null;
  private goalLab: Label | null = null;
  private toastLab: Label | null = null;
  private winPanel: Node | null = null;
  private plane = new geometry.Plane(0, 1, 0, -DESK_Y);
  private ray = new geometry.Ray();
  private hit = new Vec3();
  private dragging = false;
  private lastKeys: Array<string | null> = [null, null, null, null];
  private lastFills = [0, 0, 0, 0];
  private lastRevealed = [false, false, false, false];
  private lastFlash = [0, 0, 0, 0];
  private leaveAsk: Node | null = null;
  private slotSig = "";

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
    const sig = this.game.state.slots.map((s) => (s ? s.key : "")).join(",");
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
    const scene = this.node.scene;
    const leftover = scene.getChildByName("DeskWorld");
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
      pad.setPosition(XS[i], 0.03, SLOT_Z);
      this.slotPads.push(pad);

      const root = new Node("Bin" + i);
      root.layer = this.world.layer;
      this.world.addChild(root);
      root.setPosition(XS[i], 0, BIN_Z);
      const body = addMesh(root, "Body", boxMesh(1.7, 0.85, 1.7), hexColor("#F4EEE4"));
      body.setPosition(0, 0.42, 0);
      const lid = addMesh(root, "Lid", boxMesh(1.78, 0.12, 1.78), hexColor("#C9C0B2"));
      lid.setPosition(0, 0.92, 0);
      this.binRoots.push(root);
      this.binLids.push(lid);
    }
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

    for (let i = 0; i < SLOT_COUNT; i++) {
      const lab = makeLabel(this.hud, "BinName" + i, "", 16, C.ink, 140, 28);
      this.binLabels.push(lab);
    }
    this.layoutBinLabels();
  }

  private layoutBinLabels(): void {
    const vis = view.getVisibleSize();
    const y = vis.height * 0.18;
    const span = Math.min(vis.width - 48, 560);
    const step = span / 3;
    const x0 = -span / 2;
    this.binLabels.forEach((lab, i) => lab.node.setPosition(x0 + i * step, y));
  }

  private makeToy(key: string, parent: Node): Node {
    const it = itemDef(key);
    const color = hexColor(it ? it.color : "#888888");
    const cat = it ? it.category : "toy";
      const root = new Node("Toy_" + key);
      root.layer = parent.layer;
      parent.addChild(root);
    if (cat === "drink") {
      const body = addMesh(root, "b", cylinderMesh(0.22, 0.24, 0.7), color);
      body.setPosition(0, 0.35, 0);
      const cap = addMesh(root, "c", cylinderMesh(0.16, 0.16, 0.1), hexColor("#ECF0F1"));
      cap.setPosition(0, 0.74, 0);
    } else if (cat === "fruit" || cat === "veg") {
      const body = addMesh(root, "b", sphereMesh(0.38), color);
      body.setPosition(0, 0.38, 0);
    } else if (cat === "snack") {
      const body = addMesh(root, "b", boxMesh(0.7, 0.22, 0.5), color);
      body.setPosition(0, 0.16, 0);
    } else {
      const body = addMesh(root, "b", boxMesh(0.55, 0.55, 0.55), color);
      body.setPosition(0, 0.28, 0);
    }
    const blob = addMesh(root, "shadow", cylinderMesh(0.32, 0.32, 0.02), new Color(0, 0, 0, 50), true);
    blob.setPosition(0, 0.02, 0);
    return root;
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
      const toy = this.makeToy(key, this.world);
      toy.setPosition(XS[i], 0, SLOT_Z);
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
      if (force || fill !== this.lastFills[i] || bin.revealed !== this.lastRevealed[i]) {
        this.lastFills[i] = fill;
        this.lastRevealed[i] = bin.revealed;
        const cat = this.game.catDef(bin.cat);
        const lid = this.binLids[i];
        if (bin.revealed) {
          lid.active = false;
          setMeshColor(this.binRoots[i].getChildByName("Body")!, hexColor(cat ? cat.soft : "#FFFFFF"));
          lab.string = i18n.localized(cat);
        } else {
          lid.active = true;
          lab.string = `${fill}/${BIN_MAX}`;
        }
        if (fill === 0 && bin.revealed) this.squash(this.binRoots[i]);
      }
      if (bin.flashUntil > Date.now() && bin.flashUntil !== this.lastFlash[i]) {
        this.lastFlash[i] = bin.flashUntil;
        this.flashWrong(this.binRoots[i]);
      }
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

  private screenToDesk(ev: EventTouch): Vec3 | null {
    const cam = this.cam();
    const loc = ev.getLocation();
    cam.screenPointToRay(loc.x, loc.y, this.ray);
    let d = geometry.intersect.rayPlane(this.ray, this.plane);
    if (!(d > 0) || d === Infinity) {
      const ui = ev.getUILocation();
      cam.screenPointToRay(ui.x, ui.y, this.ray);
      d = geometry.intersect.rayPlane(this.ray, this.plane);
    }
    if (!(d > 0) || d === Infinity) return null;
    Vec3.scaleAndAdd(this.hit, this.ray.o, this.ray.d, d);
    return this.hit;
  }

  private nearest(x: number, z: number, zs: number, snap: number): number | null {
    let best: number | null = null;
    let bestD = Infinity;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const d = Math.hypot(x - XS[i], z - zs);
      if (d < snap && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  private onDown(ev: EventTouch): void {
    if (paused || this.game.locked() || this.game.state.screen !== "game") return;
    if (this.leaveAsk && this.leaveAsk.active) return;
    const ui = ev.getUILocation();
    const vis = view.getVisibleSize();
    if (ui.y > vis.height - 72) return;
    const p = this.screenToDesk(ev);
    if (!p) return;
    const si = this.nearest(p.x, p.z, SLOT_Z, SNAP);
    if (si == null) return;
    if (!this.game.tryPickSlot(si)) return;
    const toy = this.slotToys[si];
    this.slotToys[si] = null;
    this.lastKeys[si] = null;
    this.dragToy = toy;
    this.dragging = true;
    if (toy) {
      this.squash(toy);
      this.game.updateDragPos(p.x, p.z);
      toy.setWorldPosition(p.x, LIFT, p.z);
    }
  }

  private onMove(ev: EventTouch): void {
    if (!this.dragging || !this.game.state.drag) return;
    const p = this.screenToDesk(ev);
    if (!p) return;
    this.game.updateDragPos(p.x, p.z);
    if (this.dragToy) this.dragToy.setWorldPosition(p.x, LIFT, p.z);
  }

  private onUp(ev: EventTouch): void {
    if (!this.dragging) return;
    this.dragging = false;
    const p = this.screenToDesk(ev) || new Vec3(this.game.state.drag?.x || 0, 0, this.game.state.drag?.y || 0);
    const bi = this.nearest(p.x, p.z, BIN_Z, SNAP);
    const drag = this.game.state.drag;
    if (this.dragToy && this.dragToy.isValid) this.dragToy.destroy();
    this.dragToy = null;
    if (!drag) {
      this.syncToys(true);
      return;
    }
    if (bi != null) {
      const ok = this.game.tryDropOnBin(bi, drag.type);
      if (!ok) this.game.cancelDrag();
      else this.game.state.drag = null;
    } else this.game.cancelDrag();
    this.slotSig = "";
    this.syncBins(true);
  }

  private onCancel(): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.dragToy && this.dragToy.isValid) this.dragToy.destroy();
    this.dragToy = null;
    this.game.cancelDrag();
    this.syncToys(true);
  }

  private pop(n: Node): void {
    n.setScale(0.2, 0.2, 0.2);
    tween(n)
      .to(0.18, { scale: new Vec3(1.08, 0.92, 1.08) }, { easing: "backOut" })
      .to(0.1, { scale: Vec3.ONE })
      .start();
  }

  private squash(n: Node): void {
    Tween.stopAllByTarget(n);
    tween(n)
      .to(0.07, { scale: new Vec3(1.18, 0.78, 1.18) })
      .to(0.14, { scale: Vec3.ONE }, { easing: "backOut" })
      .start();
  }

  private flashWrong(n: Node): void {
    // visual handled by bin flashUntil + toast; keep a tiny shake
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
      const title = this.winPanel.getChildByName("T");
      const stats = this.winPanel.getChildByName("S");
      const stars = this.winPanel.getChildByName("Stars");
      if (title) {
        const lab = title.getComponent(Label);
        if (lab) lab.string = i18n.t("win");
      }
      if (stats) {
        const lab = stats.getComponent(Label);
        if (lab) lab.string = i18n.t("win_stats", { s: this.game.state.score, b: this.game.state.binsCleared });
      }
      if (stars) {
        const lab = stars.getComponent(Label);
        if (lab) lab.string = "★".repeat(this.game.state.stars);
      }
      this.winPanel.active = true;
      return;
    }
    if (!this.winPanel) {
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
    }
    this.winPanel.active = true;
  }
}
