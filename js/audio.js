/**
 * 音效：Web Audio API 合成，无外部资源。
 */
const GameAudio = (() => {
  let ctx = null;
  let enabled = true;

  function ensureCtx() {
    if (!ctx) {
      if (typeof wx !== "undefined" && typeof wx.createWebAudioContext === "function") {
        // 小游戏：Web Audio 由 wx 提供，没有 window.AudioContext
        ctx = wx.createWebAudioContext();
      } else {
        const AC =
          typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return null;
        ctx = new AC();
      }
    }
    if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type = "sine", volume = 0.08, when = 0) {
    const ac = ensureCtx();
    if (!ac || !enabled) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  function noise(duration = 0.12, volume = 0.05) {
    const ac = ensureCtx();
    if (!ac || !enabled) return;
    const len = Math.floor(ac.sampleRate * duration);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 800;
    gain.gain.value = volume;
    src.buffer = buf;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
  }

  return {
    init() {
      ensureCtx();
    },
    setEnabled(v) {
      enabled = !!v;
    },
    isEnabled() {
      return enabled;
    },
    pick() {
      tone(520, 0.05, "triangle", 0.04);
    },
    place() {
      tone(680, 0.06, "triangle", 0.05);
    },
    reject() {
      tone(180, 0.12, "sawtooth", 0.04);
      tone(140, 0.14, "sawtooth", 0.03, 0.06);
    },
    clear(combo = 1) {
      const base = 440 + combo * 40;
      tone(base, 0.08, "sine", 0.06);
      tone(base * 1.26, 0.1, "sine", 0.06, 0.06);
      tone(base * 1.5, 0.14, "sine", 0.07, 0.12);
      noise(0.1, 0.04 + combo * 0.01);
    },
    combo(n) {
      const notes = [523, 659, 784, 880, 1047, 1175, 1319];
      const idx = Math.min(n - 1, notes.length - 1);
      for (let i = 0; i <= idx; i++) {
        tone(notes[i], 0.1, "sine", 0.05, i * 0.05);
      }
    },
    perfect() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        tone(f, 0.12, "sine", 0.06, i * 0.08);
      });
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => {
        tone(f, 0.12, "sine", 0.06, i * 0.1);
      });
    },
    fail() {
      tone(392, 0.2, "sine", 0.05);
      tone(311, 0.25, "sine", 0.05, 0.18);
    },
    click() {
      tone(800, 0.04, "square", 0.025);
    },
    spawn() {
      tone(300, 0.04, "triangle", 0.02);
    },
  };
})();

if (typeof globalThis !== "undefined") globalThis.GameAudio = GameAudio;
if (typeof module !== "undefined" && module.exports) {
  module.exports = { GameAudio };
}
