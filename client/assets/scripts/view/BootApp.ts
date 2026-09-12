import { _decorator, Color, Component, Node, Overflow, UITransform, Widget, view } from "cc";
import { LEVELS } from "../game/catalog";
import { AppSession } from "../shell/AppSession";
import { agreePrivacy, bindLifecycle, privacyAgreed, safeInsets } from "../shell/WxShell";
import { C, CREAM, applyTopSafe, bindDomTap, ensureUiCamera, makeLabel, makeNode, onTap, paintRound } from "./UiKit";

const { ccclass } = _decorator;

type Page = "privacy" | "home" | "levels";

@ccclass("BootApp")
export class BootApp extends Component {
  private page: Page = "home";
  private root: Node | null = null;

  start(): void {
    try {
      bindLifecycle();
      AppSession.ensure();
      const canvas = this.canvas();
      ensureUiCamera(canvas, true);
      this.page = privacyAgreed() ? "home" : "privacy";
      this.build();
      bindDomTap();
    } catch (e) {
      console.error("[BootApp] start failed", e);
    }
  }

  private canvas(): Node {
    return this.node.name === "Canvas" ? this.node : this.node.getChildByName("Canvas") || this.node;
  }

  private build(): void {
    const canvas = this.canvas();
    ensureUiCamera(canvas, true);
    if (this.root && this.root.isValid) {
      this.root.active = false;
      this.root.destroy();
    }
    canvas.children.slice().forEach((ch) => {
      if (ch.name === "BootRoot") {
        ch.active = false;
        ch.destroy();
      }
    });
    const vis = view.getVisibleSize();
    const canvasUi = canvas.getComponent(UITransform);
    if (canvasUi) canvasUi.setContentSize(vis.width, vis.height);
    this.root = makeNode("BootRoot", canvas, vis.width, vis.height);

    if (this.page === "privacy") this.drawPrivacy();
    else if (this.page === "levels") this.drawLevels();
    else this.drawHome();
  }

  private startPlay(kind: { mode: "infinite" } | { mode: "level"; index: number }): void {
    AppSession.goPlay(kind);
  }

  private drawPrivacy(): void {
    const i18n = AppSession.i18n!;
    const vis = view.getVisibleSize();
    paintRound(this.root!, CREAM, 0, false);
    makeLabel(this.root!, "Title", i18n.t("title"), 42, C.ink, vis.width - 48, 64).node.setPosition(0, 220);
    const body = makeLabel(this.root!, "Body", i18n.t("privacy_body"), 22, C.mute, Math.min(560, vis.width - 72), 220);
    body.enableWrapText = true;
    body.overflow = Overflow.RESIZE_HEIGHT;
    body.node.setPosition(0, 40);
    const btn = makeNode("Agree", this.root!, Math.min(420, vis.width - 80), 64);
    paintRound(btn, C.red, 16);
    makeLabel(btn, "T", i18n.t("privacy_agree"), 24, C.white, 400, 48);
    applyTopSafe(makeNode("Pad", this.root!, 10, 10), 0);
    btn.setPosition(0, -vis.height * 0.22);
    onTap(btn, () => {
      agreePrivacy();
      this.page = "home";
      this.build();
    });
  }

  private drawHome(): void {
    const g = AppSession.ensure();
    const i18n = AppSession.i18n!;
    const vis = view.getVisibleSize();
    paintRound(this.root!, CREAM, 0, false);

    const title = makeLabel(this.root!, "Title", i18n.t("title"), 48, C.ink, vis.width - 40, 70);
    title.node.setPosition(0, 220);
    makeLabel(this.root!, "Tag", i18n.t("tagline"), 20, C.mute, vis.width - 40, 36).node.setPosition(0, 160);

    const btnW = Math.min(420, vis.width - 80);
    const inf = makeNode("Infinite", this.root!, btnW, 64);
    paintRound(inf, C.red, 16);
    makeLabel(inf, "T", i18n.t("btn_infinite"), 26, C.white, btnW - 16, 48);
    inf.setPosition(0, 20);
    onTap(inf, () => this.startPlay({ mode: "infinite" }));

    const lv = makeNode("Levels", this.root!, btnW, 64);
    paintRound(lv, C.paper, 16);
    makeLabel(lv, "T", i18n.t("btn_levels"), 26, C.ink, btnW - 16, 48);
    lv.setPosition(0, -60);
    onTap(lv, () => {
      this.page = "levels";
      this.build();
    });

    const best = g.state.progress.bestInfinite;
    makeLabel(this.root!, "Best", i18n.t("best_score", { n: best }), 16, C.mute, vis.width - 40, 32).node.setPosition(0, -130);
    makeLabel(this.root!, "Hint", i18n.t("home_hint"), 16, C.mute, vis.width - 48, 40).node.setPosition(0, -vis.height * 0.28);

    const lang = makeNode("Lang", this.root!, 88, 40);
    paintRound(lang, C.paper, 12);
    makeLabel(lang, "T", i18n.t("lang_btn"), 18, C.ink, 80, 32);
    lang.setPosition(vis.width * 0.5 - 64, vis.height * 0.5 - 48 - safeInsets().top);
    onTap(lang, () => {
      i18n.toggle();
      this.build();
    });

    const sound = makeNode("Sound", this.root!, 160, 40);
    paintRound(sound, C.paper, 12);
    makeLabel(sound, "T", i18n.t(g.state.progress.sound ? "sound_on" : "sound_off"), 16, C.ink, 150, 32);
    sound.setPosition(-(vis.width * 0.5 - 96), vis.height * 0.5 - 48 - safeInsets().top);
    onTap(sound, () => {
      g.toggleSound();
      this.build();
    });
  }

  private drawLevels(): void {
    const g = AppSession.ensure();
    const i18n = AppSession.i18n!;
    const vis = view.getVisibleSize();
    paintRound(this.root!, CREAM, 0, false);

    const head = makeLabel(this.root!, "Head", i18n.t("select_level"), 32, C.ink, vis.width - 40, 48);
    head.node.setPosition(0, vis.height * 0.42);
    applyTopSafe(head.node, 24);

    const back = makeNode("Back", this.root!, 120, 44);
    paintRound(back, C.paper, 12);
    makeLabel(back, "T", i18n.t("back"), 18, C.ink, 110, 32);
    back.setPosition(-(vis.width * 0.5 - 80), vis.height * 0.42);
    applyTopSafe(back, 24);
    onTap(back, () => {
      this.page = "home";
      this.build();
    });

    const cols = 4;
    const gap = 12;
    const size = Math.min(72, (vis.width - 56 - gap * (cols - 1)) / cols);
    const startX = -((cols - 1) * (size + gap)) / 2;
    const startY = vis.height * 0.28;
    LEVELS.forEach((lv, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cell = makeNode("L" + lv.id, this.root!, size, size);
      const unlocked = lv.id <= g.state.progress.unlocked;
      paintRound(cell, unlocked ? C.paper : new Color(232, 226, 216, 255), 12);
      const stars = g.getStarsForLevel(lv.id);
      const caption = unlocked ? String(lv.id) : "·";
      makeLabel(cell, "N", caption, 22, unlocked ? C.ink : C.mute, size - 8, 28).node.setPosition(0, stars ? 8 : 0);
      if (unlocked && stars) {
        makeLabel(cell, "S", "★".repeat(stars), 12, C.red, size - 8, 18).node.setPosition(0, -16);
      }
      cell.setPosition(startX + col * (size + gap), startY - row * (size + gap));
      if (unlocked) {
        onTap(cell, () => this.startPlay({ mode: "level", index: i }));
      }
    });
  }
}
