/**
 * Procedural magical audio (Web Audio). No external files — works offline.
 * Unlock happens synchronously on the first user gesture.
 */

type Bus = "master" | "music" | "sfx";

class MagicalAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private muted = false;
  private musicOn = false;
  private timer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private drone: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  get isMuted() {
    return this.muted;
  }

  /** Must run inside a click/tap handler (no await before resume). */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.22;
      this.sfxBus.gain.value = 0.55;
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.04);
  }

  startMusic(): void {
    this.unlock();
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.startDrone();
    this.nextNote = this.ctx.currentTime + 0.05;
    this.step = 0;
    const tick = () => {
      if (!this.musicOn || !this.ctx) return;
      const now = this.ctx.currentTime;
      while (this.nextNote < now + 0.25) {
        this.scheduleNote(this.nextNote);
        this.nextNote += 0.55;
        this.step += 1;
      }
      this.timer = window.setTimeout(tick, 120);
    };
    tick();
    document.addEventListener("visibilitychange", this.onVis);
  }

  stopMusic(): void {
    this.musicOn = false;
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.stopDrone();
    document.removeEventListener("visibilitychange", this.onVis);
  }

  private onVis = () => {
    if (document.visibilityState === "visible") this.unlock();
  };

  playDice(): void {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    // Wooden clacks + filtered noise tumble
    for (let i = 0; i < 8; i++) {
      this.noiseBurst(t + i * 0.07, 0.05 + Math.random() * 0.04, 900 - i * 60, 0.18);
      this.tone(t + i * 0.07, 180 + Math.random() * 40, 0.06, "triangle", 0.12, "sfx");
    }
    this.tone(t + 0.62, 240, 0.18, "sine", 0.22, "sfx");
  }

  playMove(): void {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const f = 520 + Math.random() * 180;
    this.tone(t, f, 0.12, "sine", 0.16, "sfx");
    this.tone(t + 0.05, f * 1.5, 0.1, "sine", 0.1, "sfx");
  }

  playObstacle(): void {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.sweep(t, 420, 220, 0.35, 0.2);
    this.tone(t + 0.12, 196, 0.3, "triangle", 0.12, "sfx");
  }

  playAdvantage(): void {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone(t + i * 0.09, f, 0.22, "sine", 0.18, "sfx"));
  }

  playQuestion(): void {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(t, 392, 0.28, "sine", 0.16, "sfx");
    this.tone(t + 0.08, 523.25, 0.32, "sine", 0.14, "sfx");
    this.tone(t + 0.16, 659.25, 0.4, "triangle", 0.1, "sfx");
  }

  playWin(): void {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const fanfare = [392, 523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((f, i) => {
      this.tone(t + i * 0.14, f, 0.45, "triangle", 0.2, "sfx");
      this.tone(t + i * 0.14, f * 2, 0.3, "sine", 0.08, "sfx");
    });
  }

  playUi(): void {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    this.tone(ctx.currentTime, 660, 0.08, "sine", 0.08, "sfx");
  }

  private startDrone(): void {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus) return;
    this.stopDrone();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 640;
    osc.type = "sine";
    osc2.type = "sine";
    osc.frequency.value = 130.81;
    osc2.frequency.value = 196.0;
    g.gain.value = 0.0001;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(bus);
    osc.start();
    osc2.start();
    g.gain.setTargetAtTime(0.18, ctx.currentTime, 0.6);
    this.drone = osc;
    this.droneGain = g;
    // keep osc2 from being GC'd by parenting through filter; stop both later via disconnect
    (osc2 as OscillatorNode & { _keep?: boolean })._keep = true;
    this._drone2 = osc2;
  }

  private _drone2: OscillatorNode | null = null;

  private stopDrone(): void {
    try {
      this.drone?.stop();
      this._drone2?.stop();
    } catch {
      /* already stopped */
    }
    this.drone?.disconnect();
    this._drone2?.disconnect();
    this.droneGain?.disconnect();
    this.drone = null;
    this._drone2 = null;
    this.droneGain = null;
  }

  private scheduleNote(time: number): void {
    // Gentle pentatonic bells over a C lydian-ish color
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const pattern = [0, 2, 4, 2, 5, 4, 3, 1];
    const idx = pattern[this.step % pattern.length]!;
    const f = scale[idx]!;
    this.tone(time, f, 0.7, "sine", 0.11, "music");
    if (this.step % 4 === 0) {
      this.tone(time, f * 0.5, 1.1, "triangle", 0.06, "music");
    }
  }

  private tone(
    time: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    bus: Exclude<Bus, "master">,
  ): void {
    const ctx = this.ctx;
    const dest = bus === "music" ? this.musicBus : this.sfxBus;
    if (!ctx || !dest) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private sweep(time: number, from: number, to: number, dur: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), time + dur);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private noiseBurst(time: number, dur: number, cutoff: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    src.start(time);
    src.stop(time + dur);
  }
}

export const audio = new MagicalAudio();
