'use client';

/**
 * All sound on the site is synthesised with the Web Audio API, so there are no
 * audio files to download and nothing can play before the user opts in.
 * Swap in recorded assets later by decoding them into AudioBuffers here.
 */

import { DEMO_PATH, ROOM, type Vec3 } from './speakers';

export type DemoFrame = {
  /** Position on the top-down plan, normalised 0..1. */
  plan: { x: number; y: number };
  /** Index into DEMO_PATH of the speaker the sound is passing, or -1. */
  active: number;
  /** 0..1 through the whole demo. */
  t: number;
};

const DEMO_SECONDS = 14;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private stopDemo: (() => void) | null = null;

  get supported() {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  /** Create / resume the context. Must be called from a user gesture. */
  unlock() {
    if (!this.supported) return null;
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Silence everything (audio toggle off). */
  mute() {
    this.stopDemo?.();
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  private getNoise(ctx: AudioContext) {
    if (this.noise) return this.noise;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return buf;
  }

  /** Soft magnetic "click": a short bandpassed tick over a low thump. */
  playClick() {
    const ctx = this.ctx;
    if (!ctx || !this.master || ctx.state !== 'running') return;
    const t = ctx.currentTime;

    const tick = ctx.createBufferSource();
    tick.buffer = this.getNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 1.4;
    const tickGain = ctx.createGain();
    tickGain.gain.setValueAtTime(0.0001, t);
    tickGain.gain.exponentialRampToValueAtTime(0.5, t + 0.002);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    tick.connect(bp).connect(tickGain).connect(this.master);
    tick.start(t);
    tick.stop(t + 0.08);

    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(180, t);
    thump.frequency.exponentialRampToValueAtTime(60, t + 0.09);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.0001, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.35, t + 0.004);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    thump.connect(thumpGain).connect(this.master);
    thump.start(t);
    thump.stop(t + 0.16);
  }

  /** Six soft plucks, one per speaker, for the waitlist success moment. */
  playChime() {
    const ctx = this.ctx;
    if (!ctx || !this.master || ctx.state !== 'running') return;
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      const pan = ctx.createStereoPanner();
      pan.pan.value = (i / (notes.length - 1)) * 1.6 - 0.8;
      osc.connect(g).connect(pan).connect(this.master!);
      osc.start(t);
      osc.stop(t + 1.3);
    });
  }

  get demoPlaying() {
    return this.stopDemo !== null;
  }

  /**
   * A synthesised helicopter (chopped broadband noise + rotor thump) carried
   * around all six speaker positions by an HRTF PannerNode. The listener sits
   * on the sofa facing the TV wall, so it reads correctly on headphones.
   */
  startSpatialDemo(onFrame: (f: DemoFrame) => void, onEnd: () => void) {
    const ctx = this.unlock();
    if (!ctx || !this.master) return;
    this.stopDemo?.();

    const t0 = ctx.currentTime + 0.05;

    // Listener on the sofa, facing the TV wall (-Z), head up (+Y).
    const L = ROOM.listener;
    const l = ctx.listener;
    if (l.positionX) {
      l.positionX.value = L[0];
      l.positionY.value = L[1];
      l.positionZ.value = L[2];
      l.forwardX.value = 0;
      l.forwardY.value = 0;
      l.forwardZ.value = -1;
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    } else {
      l.setPosition(L[0], L[1], L[2]);
      l.setOrientation(0, 0, -1, 0, 1, 0);
    }

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1.2;
    panner.rolloffFactor = 0.8;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(1, t0 + 0.8);
    out.gain.setValueAtTime(1, t0 + DEMO_SECONDS - 1);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + DEMO_SECONDS);
    panner.connect(out).connect(this.master);

    // Rotor chop: an LFO amplitude-modulates everything below.
    const chop = ctx.createGain();
    chop.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.value = 11;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.45;
    lfo.connect(lfoDepth).connect(chop.gain);
    chop.connect(panner);

    // Blade wash: looping noise, low-passed.
    const wash = ctx.createBufferSource();
    wash.buffer = this.getNoise(ctx);
    wash.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    const washGain = ctx.createGain();
    washGain.gain.value = 0.9;
    wash.connect(lp).connect(washGain).connect(chop);

    // Rotor thump.
    const thump = ctx.createOscillator();
    thump.type = 'triangle';
    thump.frequency.value = 58;
    const thumpGain = ctx.createGain();
    thumpGain.gain.value = 0.5;
    thump.connect(thumpGain).connect(chop);

    // Faint turbine whine, unchopped, so the source stays traceable.
    const whine = ctx.createOscillator();
    whine.type = 'sine';
    whine.frequency.value = 1760;
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.025;
    whine.connect(whineGain).connect(panner);

    const sources = [lfo, wash, thump, whine];
    sources.forEach((s) => s.start(t0));
    sources.forEach((s) => s.stop(t0 + DEMO_SECONDS + 0.05));

    let raf = 0;
    const setPos = (p: Vec3) => {
      if (panner.positionX) {
        const now = ctx.currentTime;
        panner.positionX.setTargetAtTime(p[0], now, 0.03);
        panner.positionY.setTargetAtTime(p[1], now, 0.03);
        panner.positionZ.setTargetAtTime(p[2], now, 0.03);
      } else {
        panner.setPosition(p[0], p[1], p[2]);
      }
    };
    setPos(DEMO_PATH.sample(0).world);

    const loop = () => {
      const t = Math.min(1, Math.max(0, (ctx.currentTime - t0) / DEMO_SECONDS));
      const s = DEMO_PATH.sample(t);
      setPos(s.world);
      onFrame({ plan: s.plan, active: s.active, t });
      if (t >= 1) {
        cleanup();
        onEnd();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const cleanup = () => {
      cancelAnimationFrame(raf);
      sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
      out.disconnect();
      if (this.stopDemo === stop) this.stopDemo = null;
    };

    const stop = () => {
      // Quick fade to avoid a pop, then tear down.
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      cancelAnimationFrame(raf);
      if (this.stopDemo === stop) this.stopDemo = null;
      setTimeout(cleanup, 180);
      onEnd();
    };
    this.stopDemo = stop;
  }

  stopSpatialDemo() {
    this.stopDemo?.();
  }
}

export const audioEngine = new AudioEngine();
