import { STORAGE_LANG } from "./catalog";

export type Lang = "zh" | "en";

export interface StorageLike {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

const DICT: Record<Lang, Record<string, string>> = {
  zh: {
    title: "分类之王",
    tagline: "抽卡归类，装满就消",
    btn_infinite: "无限解压",
    btn_levels: "关卡挑战",
    sound_on: "音效：开",
    sound_off: "音效：关",
    best_score: "无限模式最高分 {n}",
    home_hint: "下方 4 张手牌，取走自动补翻",
    select_level: "选择关卡",
    back: "返回",
    level_header: "第 {n} 关 · {name}",
    infinite_title: "无限解压",
    infinite_sub: "抽卡归类 · 装满 5 个消除",
    streak: "连续正确 ×{n}",
    bottom_tip: "把玩具拖进同类盒子",
    win: "过关！",
    win_stats: "得分 {s} · 消除 {b} 盒",
    next: "下一关",
    to_levels: "回到关卡",
    retry: "重玩本关",
    home: "回首页",
    toast_wrong: "不是同一类",
    lang_btn: "EN",
    privacy_body: "儿童益智游戏，不收集个人信息。\n游戏进度只保存在本机。\n继续即表示同意用户协议与隐私政策。",
    privacy_agree: "同意并开始",
    anonymous: "?",
  },
  en: {
    title: "Sort-King",
    tagline: "Draw, sort, clear!",
    btn_infinite: "Endless Mode",
    btn_levels: "Level Mode",
    sound_on: "Sound: On",
    sound_off: "Sound: Off",
    best_score: "Endless best {n}",
    home_hint: "4 cards below — take one to reveal the next",
    select_level: "Select Level",
    back: "Back",
    level_header: "Level {n} · {name}",
    infinite_title: "Endless Mode",
    infinite_sub: "Draw & sort · fill 5 to clear",
    streak: "Streak ×{n}",
    bottom_tip: "Drag toys into matching bins",
    win: "Cleared!",
    win_stats: "Score {s} · {b} bins cleared",
    next: "Next Level",
    to_levels: "Levels",
    retry: "Replay",
    home: "Home",
    toast_wrong: "Wrong category!",
    lang_btn: "中",
    privacy_body: "A puzzle game for kids. No personal data is collected.\nProgress is stored on this device only.\nBy continuing you accept the Terms and Privacy Policy.",
    privacy_agree: "Agree & Start",
    anonymous: "?",
  },
};

export class I18n {
  lang: Lang = "zh";

  constructor(private storage: StorageLike) {
    try {
      const v = this.storage.get(STORAGE_LANG);
      if (v === "en" || v === "zh") this.lang = v;
    } catch (_) {}
  }

  t(key: string, vars?: Record<string, string | number>): string {
    let s = (DICT[this.lang] && DICT[this.lang][key]) || DICT.zh[key] || key;
    if (vars) {
      for (const k of Object.keys(vars)) s = s.replace("{" + k + "}", String(vars[k]));
    }
    return s;
  }

  localized(obj: { name?: string; nameEn?: string } | null | undefined): string {
    if (!obj) return "";
    if (this.lang === "en" && obj.nameEn) return obj.nameEn;
    return obj.name || "";
  }

  setLang(l: Lang): void {
    this.lang = l === "en" ? "en" : "zh";
    try {
      this.storage.set(STORAGE_LANG, this.lang);
    } catch (_) {}
  }

  toggle(): void {
    this.setLang(this.lang === "zh" ? "en" : "zh");
  }

  isEn(): boolean {
    return this.lang === "en";
  }
}
