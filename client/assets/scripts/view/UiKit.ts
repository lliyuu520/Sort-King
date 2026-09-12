import {
  Camera,
  Canvas,
  Color,
  EventMouse,
  EventTouch,
  Graphics,
  Input,
  Label,
  LabelOutline,
  Layers,
  Node,
  Overflow,
  UITransform,
  Widget,
  game,
  input,
  view,
} from "cc";
import { safeInsets } from "../shell/WxShell";

export const UI_LAYER = Layers.Enum.UI_2D;
export const CREAM = new Color(243, 237, 227, 255);

function clearFlag(kind: "solid" | "depth"): number {
  const flags = Camera.ClearFlag as { SOLID_COLOR?: number; DEPTH_ONLY?: number } | undefined;
  if (kind === "solid") return flags && flags.SOLID_COLOR != null ? flags.SOLID_COLOR : 7;
  return flags && flags.DEPTH_ONLY != null ? flags.DEPTH_ONLY : 6;
}

export function ensureUiCamera(canvasNode: Node, solidClear = true): Camera | null {
  const canvas = canvasNode.getComponent(Canvas);
  if (!canvas) return null;
  canvasNode.layer = UI_LAYER;
  canvas.alignCanvasWithScreen = true;
  const vis = view.getVisibleSize();
  const uit = canvasNode.getComponent(UITransform);
  if (uit) uit.setContentSize(Math.max(vis.width, 1), Math.max(vis.height, 1));

  let cam: Camera | null = null;
  const scene = canvasNode.scene;
  const mainNode = scene && scene.getChildByName("Main Camera");
  const mainCam = mainNode && mainNode.getComponent(Camera);

  if (solidClear) {
    cam = mainCam || canvas.cameraComponent;
    if (cam) {
      cam.enabled = true;
      canvas.cameraComponent = cam;
    }
  } else {
    let overlay = canvas.cameraComponent;
    if (overlay && overlay.node && overlay.node.name === "Main Camera") overlay = null;
    if (!overlay || !overlay.isValid) {
      let uiNode = scene && scene.getChildByName("UI Camera");
      if (!uiNode) {
        uiNode = new Node("UI Camera");
        scene.addChild(uiNode);
      }
      overlay = uiNode.getComponent(Camera) || uiNode.addComponent(Camera);
      canvas.cameraComponent = overlay;
    }
    cam = overlay;
    if (mainCam) mainCam.enabled = true;
  }

  if (!cam || !cam.isValid) return null;
  const n = cam.node;
  n.setRotationFromEuler(0, 0, 0);
  cam.projection = Camera.ProjectionType.ORTHO;
  cam.priority = solidClear ? 0 : 10;
  cam.near = 0.1;
  cam.far = 2000;
  cam.clearColor = CREAM;
  cam.clearFlags = solidClear ? clearFlag("solid") : clearFlag("depth");
  cam.visibility = UI_LAYER;
  cam.orthoHeight = Math.max(vis.height, 640) / 2;
  cam.enabled = true;
  return cam;
}

export function makeNode(name: string, parent: Node, w: number, h: number): Node {
  const n = new Node(name);
  n.layer = UI_LAYER;
  const ui = n.addComponent(UITransform);
  ui.setContentSize(w, h);
  parent.addChild(n);
  return n;
}

export function paintRound(node: Node, color: Color, radius = 16, hittable = true): Graphics {
  let g = node.getComponent(Graphics);
  if (!g) g = node.addComponent(Graphics);
  const ui = node.getComponent(UITransform)!;
  const w = Math.max(ui.contentSize.width, ui.width, 8);
  const h = Math.max(ui.contentSize.height, ui.height, 8);
  g.clear();
  g.fillColor = color;
  g.roundRect(-w / 2, -h / 2, w, h, Math.min(radius, w / 2, h / 2));
  g.fill();
  if (!hittable) ui.setContentSize(0, 0);
  return g;
}

export function makeLabel(
  parent: Node,
  name: string,
  text: string,
  size: number,
  color: Color,
  w = 600,
  h = 48,
): Label {
  const n = makeNode(name, parent, w, h);
  const lab = n.addComponent(Label);
  lab.string = text;
  lab.fontSize = size;
  lab.lineHeight = Math.ceil(size * 1.25);
  lab.color = color;
  lab.overflow = Overflow.SHRINK;
  lab.enableWrapText = false;
  lab.horizontalAlign = Label.HorizontalAlign.CENTER;
  lab.verticalAlign = Label.VerticalAlign.CENTER;
  lab.cacheMode = Label.CacheMode.NONE;
  const ui = n.getComponent(UITransform);
  if (ui) ui.hitTest = () => false;
  return lab;
}

export function outline(lab: Label, color: Color, width = 2): void {
  const o = lab.node.addComponent(LabelOutline);
  o.color = color;
  o.width = width;
}

type TapRec = { node: Node; handler: () => void; last: number };
const taps: TapRec[] = [];
let tapBound = false;

function pruneTaps(): void {
  for (let i = taps.length - 1; i >= 0; i--) {
    if (!taps[i].node.isValid) taps.splice(i, 1);
  }
}

function canvasOf(node: Node): Node | null {
  let n: Node | null = node;
  while (n) {
    if (n.getComponent(Canvas)) return n;
    n = n.parent;
  }
  return null;
}

function canvasLocal(node: Node): { x: number; y: number } {
  const canvas = canvasOf(node);
  let x = 0;
  let y = 0;
  let n: Node | null = node;
  while (n && n !== canvas) {
    x += n.position.x;
    y += n.position.y;
    n = n.parent;
  }
  return { x, y };
}

function hitLocal(node: Node, localX: number, localY: number): boolean {
  const nodeTr = node.getComponent(UITransform);
  if (!nodeTr || nodeTr.width <= 1 || nodeTr.height <= 1) return false;
  const p = canvasLocal(node);
  const hw = (nodeTr.width * Math.abs(node.scale.x)) / 2 + 8;
  const hh = (nodeTr.height * Math.abs(node.scale.y)) / 2 + 8;
  return Math.abs(localX - p.x) <= hw && Math.abs(localY - p.y) <= hh;
}

function containsTap(node: Node, uiX: number, uiY: number): boolean {
  if (!node.activeInHierarchy) return false;
  const vis = view.getVisibleSize();
  if (vis.width <= 0 || vis.height <= 0) return false;
  const localX = uiX - vis.width * 0.5;
  const localY = uiY - vis.height * 0.5;
  if (hitLocal(node, localX, localY)) return true;
  return hitLocal(node, localX, vis.height - uiY - vis.height * 0.5);
}

function fireTap(rec: TapRec): void {
  const now = Date.now();
  if (now - rec.last < 250) return;
  rec.last = now;
  rec.handler();
}

function dispatchTap(uiX: number, uiY: number): void {
  pruneTaps();
  let best: TapRec | null = null;
  let bestArea = Infinity;
  for (const t of taps) {
    if (!containsTap(t.node, uiX, uiY)) continue;
    const tr = t.node.getComponent(UITransform);
    const area = tr ? tr.width * tr.height : 1;
    if (area < bestArea) {
      bestArea = area;
      best = t;
    }
  }
  if (best) fireTap(best);
}

function onGlobalPointer(ev: EventTouch | EventMouse): void {
  const loc = ev.getUILocation();
  dispatchTap(loc.x, loc.y);
}

export function bindDomTap(): void {
  const g = globalThis as { __skTapBound?: boolean; document?: { getElementById(id: string): HTMLCanvasElement | null } };
  if (g.__skTapBound) return;
  const el =
    (game.canvas as HTMLCanvasElement | null) ||
    (g.document && g.document.getElementById("GameCanvas"));
  if (!el || typeof el.addEventListener !== "function") {
    setTimeout(bindDomTap, 100);
    return;
  }
  g.__skTapBound = true;
  const handle = (e: Event): void => {
    const ev = e as PointerEvent & { changedTouches?: Array<{ clientX: number; clientY: number }> };
    let cx = ev.clientX;
    let cy = ev.clientY;
    const t = ev.changedTouches && ev.changedTouches[0];
    if (t) {
      cx = t.clientX;
      cy = t.clientY;
    }
    if (cx == null || cy == null) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const vis = view.getVisibleSize();
    const uiX = ((cx - rect.left) / rect.width) * vis.width;
    const uiY = vis.height - ((cy - rect.top) / rect.height) * vis.height;
    dispatchTap(uiX, uiY);
  };
  el.addEventListener("pointerup", handle, true);
  el.addEventListener("mouseup", handle, true);
  el.addEventListener("touchend", handle, true);
}

function hookCanvas(canvas: Node): void {
  const flagged = canvas as Node & { __tapHooked?: boolean };
  if (flagged.__tapHooked) return;
  flagged.__tapHooked = true;
  const pass = (ev: EventTouch | EventMouse): void => {
    (ev as EventTouch).preventSwallow = true;
    onGlobalPointer(ev);
  };
  canvas.on(Node.EventType.TOUCH_END, pass);
  canvas.on(Node.EventType.MOUSE_UP, pass);
}

export function onTap(node: Node, handler: () => void): void {
  node.layer = UI_LAYER;
  pruneTaps();
  let rec = taps.find((t) => t.node === node);
  if (rec) rec.handler = handler;
  else {
    rec = { node, handler, last: 0 };
    taps.push(rec);
  }
  node.off(Node.EventType.TOUCH_END);
  node.on(Node.EventType.TOUCH_END, () => fireTap(rec!));
  const canvas = canvasOf(node);
  if (canvas) hookCanvas(canvas);
  bindDomTap();
  if (tapBound) return;
  tapBound = true;
  input.on(Input.EventType.TOUCH_END, onGlobalPointer);
  input.on(Input.EventType.MOUSE_UP, onGlobalPointer);
}

export function applyTopSafe(node: Node, extra = 12): void {
  const vis = view.getVisibleSize();
  const inset = safeInsets();
  let w = node.getComponent(Widget);
  if (!w) w = node.addComponent(Widget);
  w.isAlignTop = true;
  w.isAlignHorizontalCenter = true;
  w.top = Math.max(12, inset.top + extra);
  w.horizontalCenter = 0;
  w.alignMode = Widget.AlignMode.ALWAYS;
  void vis;
}

export function applyBottomSafe(node: Node, extra = 16): void {
  const inset = safeInsets();
  let w = node.getComponent(Widget);
  if (!w) w = node.addComponent(Widget);
  w.isAlignBottom = true;
  w.isAlignHorizontalCenter = true;
  w.bottom = Math.max(12, inset.bottom + extra);
  w.horizontalCenter = 0;
  w.alignMode = Widget.AlignMode.ALWAYS;
}

export const C = {
  ink: new Color(43, 43, 43, 255),
  mute: new Color(107, 101, 92, 255),
  paper: new Color(255, 255, 255, 255),
  cream: new Color(243, 237, 227, 255),
  line: new Color(217, 208, 195, 255),
  red: new Color(232, 93, 76, 255),
  white: new Color(255, 255, 255, 255),
  dim: new Color(0, 0, 0, 150),
  toast: new Color(43, 43, 43, 220),
};
