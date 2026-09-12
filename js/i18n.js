/**
 * 中英双语：词条表 + 语言状态（localStorage 持久化）。
 */
const I18N = (() => {
  const STORAGE_KEY = "sortking_lang";
  let lang = "zh";
  try {
    const v = Platform.storage.get(STORAGE_KEY);
    if (v === "en" || v === "zh") lang = v;
  } catch (_) {}

  const dict = {
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
      tray: "盲盒卡槽",
      bottom_tip: "下方 4 张手牌 · 取走自动补翻 · 归进同类盒子",
      win: "过关！",
      win_stats: "得分 {s} · 消除 {b} 盒",
      next: "下一关",
      to_levels: "回到关卡",
      retry: "重玩本关",
      locked_item: "道具解锁",
      toast_all_unlocked: "卡槽已全部解锁",
      toast_need_item: "需要解锁道具",
      toast_slot_unlocked: "新卡槽已解锁",
      toast_slot_locked: "卡槽未解锁",
      toast_wrong: "不是同一类",
      lang_btn: "EN",
      privacy_body: "儿童益智游戏，不收集个人信息。\n游戏进度只保存在本机。\n继续即表示同意用户协议与隐私政策。",
      privacy_agree: "同意并开始",
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
      tray: "Mystery Cards",
      bottom_tip: "4 cards below · take one to refill · sort into matching bins",
      win: "Cleared!",
      win_stats: "Score {s} · {b} bins cleared",
      next: "Next Level",
      to_levels: "Levels",
      retry: "Replay",
      locked_item: "Unlock",
      toast_all_unlocked: "All slots unlocked",
      toast_need_item: "Need an unlock item",
      toast_slot_unlocked: "New slot unlocked!",
      toast_slot_locked: "Slot locked",
      toast_wrong: "Wrong category!",
      lang_btn: "中",
      privacy_body: "A puzzle game for kids. No personal data is collected.\nProgress is stored on this device only.\nBy continuing you accept the Terms and Privacy Policy.",
      privacy_agree: "Agree & Start",
    },
  };

  function t(key, vars) {
    let s = (dict[lang] && dict[lang][key]) || dict.zh[key] || key;
    if (vars) {
      for (const k of Object.keys(vars)) s = s.replace("{" + k + "}", vars[k]);
    }
    return s;
  }

  /** 取双语字段：对象含 name / nameEn 时按当前语言返回 */
  function localized(obj) {
    if (!obj) return "";
    if (lang === "en" && obj.nameEn) return obj.nameEn;
    return obj.name;
  }

  /** 浏览器里同步标签标题；小游戏的 document 垫片里该属性只读，忽略失败 */
  function setDocumentTitle() {
    try {
      if (typeof document !== "undefined" && document.title !== undefined) {
        document.title = t("title");
      }
    } catch (_) {}
  }

  function setLang(l) {
    lang = l === "en" ? "en" : "zh";
    try {
      Platform.storage.set(STORAGE_KEY, lang);
    } catch (_) {}
    setDocumentTitle();
  }

  function toggle() {
    setLang(lang === "zh" ? "en" : "zh");
  }

  function isEn() {
    return lang === "en";
  }

  setDocumentTitle();

  return {
    t,
    localized,
    setLang,
    toggle,
    isEn,
    get lang() {
      return lang;
    },
  };
})();

if (typeof globalThis !== "undefined") globalThis.I18N = I18N;
if (typeof module !== "undefined" && module.exports) {
  module.exports = { I18N };
}
