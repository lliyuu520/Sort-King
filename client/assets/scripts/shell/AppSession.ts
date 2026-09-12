import { director } from "cc";
import { Game } from "../game/Game";
import { I18n } from "../game/i18n";
import { bindLifecycle, silentAudio, storage, vibrate } from "./WxShell";

export type PendingStart = { mode: "infinite" } | { mode: "level"; index: number };

class Session {
  game: Game | null = null;
  i18n: I18n | null = null;
  pending: PendingStart | null = null;

  ensure(): Game {
    if (!this.i18n) this.i18n = new I18n(storage);
    if (!this.game) {
      bindLifecycle();
      this.game = new Game({
        now: () => Date.now(),
        storage,
        audio: silentAudio,
        vibrate,
        i18n: this.i18n,
      });
    }
    return this.game;
  }

  startPending(): void {
    const g = this.ensure();
    const p = this.pending;
    this.pending = null;
    if (!p || p.mode === "infinite") {
      g.startSlice();
      return;
    }
    g.startLevel(p.index);
  }

  goPlay(pending: PendingStart): void {
    this.pending = pending;
    director.loadScene("play");
  }

  goBoot(): void {
    director.loadScene("boot");
  }
}

export const AppSession = new Session();
