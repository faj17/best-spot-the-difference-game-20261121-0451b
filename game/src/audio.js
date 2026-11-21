// Lantern Row: all sound is synthesized with WebAudio — no audio files, no
// network. A tiny synth: chime on a find, buzz on a miss, shimmer on a hint,
// arpeggio on a level win. Muted until the first gesture (autoplay policy).
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  tone(freq, start, dur, type, vol) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  find() {
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(880, t, 0.25, 'sine', 0.16);
    this.tone(1318.5, t + 0.07, 0.35, 'sine', 0.14);
  }

  wrong() {
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(160, t, 0.22, 'sawtooth', 0.07);
    this.tone(110, t + 0.05, 0.25, 'sawtooth', 0.06);
  }

  hint() {
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(1568, t, 0.3, 'triangle', 0.08);
    this.tone(2093, t + 0.09, 0.4, 'triangle', 0.06);
  }

  win() {
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, t + i * 0.11, 0.4, 'sine', 0.14));
  }

  click() {
    this.ensure();
    if (!this.ctx) return;
    this.tone(660, this.ctx.currentTime, 0.08, 'triangle', 0.05);
  }
}
