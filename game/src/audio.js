// audio.js — every sound is synthesized with WebAudio: no audio files,
// no network. Footsteps, alert stings, pickups and win/lose phrases.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Call from a user gesture (click / keypress) so the browser unlocks audio.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  _tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // A soft shoe tap. Guards step lower and duller than the player.
  step(isGuard, loud) {
    this._tone(isGuard ? 110 : 190, 0.07, 'triangle', loud ? 0.10 : 0.05);
  }

  // Two-note alarm when a guard spots you for real.
  alarm() {
    this._tone(620, 0.14, 'square', 0.07);
    this._tone(830, 0.2, 'square', 0.07, 0.13);
  }

  // A guard grows curious: one short rising blip.
  noticed() {
    this._tone(420, 0.1, 'sine', 0.06, 0, 560);
  }

  // The pebble's clatter.
  clatter() {
    this._tone(1400, 0.05, 'square', 0.05);
    this._tone(900, 0.08, 'square', 0.04, 0.06);
  }

  // The brass coin lure: a bright metallic ring that draws every guard.
  coin() {
    this._tone(2093, 0.1, 'sine', 0.08);
    this._tone(1568, 0.16, 'sine', 0.07, 0.07);
    this._tone(2637, 0.08, 'sine', 0.05, 0.14);
  }

  // The smoke veil: a soft descending whoosh as the vial bursts.
  smoke() {
    this._tone(320, 0.35, 'sine', 0.06, 0, 120);
    this._tone(180, 0.4, 'triangle', 0.05, 0.05, 90);
  }

  pickup() {
    this._tone(880, 0.12, 'sine', 0.09);
    this._tone(1318, 0.18, 'sine', 0.09, 0.1);
  }

  bell() {
    this._tone(523, 0.5, 'sine', 0.1);
    this._tone(784, 0.7, 'sine', 0.08, 0.08);
    this._tone(1046, 0.9, 'sine', 0.06, 0.16);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.35, 'triangle', 0.09, i * 0.14));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => this._tone(f, 0.3, 'sawtooth', 0.05, i * 0.16));
  }
}
