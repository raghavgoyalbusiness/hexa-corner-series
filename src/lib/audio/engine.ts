'use client';

/**
 * All sound on the site is synthesised with the Web Audio API, so there are no
 * audio files to download and nothing can play before the user opts in.
 * Swap in recorded assets later by decoding them into AudioBuffers here.
 */

import { DEMO_PATH, ROOM, SPEAKERS, speakerPoint, type Vec3 } from './speakers';

export type DemoFrame = {
  /** Position on the top-down plan, normalised 0..1. */
  plan: { x: number; y: number };
  /** Index into DEMO_PATH of the speaker the sound is passing, or -1. */
  active: number;
  /** 0..1 through the whole demo. */
  t: number;
};

const DEMO_SECONDS = 20;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private stopDemo: (() => void) | null = null;
  private stopLow: (() => void) | null = null;

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
    this.stopLow?.();
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

  /** Synthesised room reverb: stereo noise with an exponential tail. */
  private makeReverb(ctx: AudioContext, seconds = 3.4) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        // Gently low-passed noise so the tail is warm, not hissy.
        lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45;
        d[i] = lp * Math.pow(1 - i / len, 2.6);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    return conv;
  }

  /**
   * "Orbit": a ~20 s ambient piece written for six corners.
   * - A Dmaj9 → Bm9 → Gmaj9 chord blooms around the listener, one voice
   *   pinned to each speaker (six static HRTF panners).
   * - A music-box melody and a shimmer trail fly a lap through every corner
   *   on a moving HRTF panner; a bell accent rings as it passes each speaker.
   * - Everything sits in a synthesised room reverb.
   * The listener is on the sofa facing the TV wall, so it reads on headphones.
   */
  startSpatialDemo(onFrame: (f: DemoFrame) => void, onEnd: () => void) {
    const ctx = this.unlock();
    if (!ctx || !this.master) return;
    this.stopDemo?.();
    this.stopLow?.();

    const t0 = ctx.currentTime + 0.08;
    const tEnd = t0 + DEMO_SECONDS;

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

    const hrtf = () => {
      const pn = ctx.createPanner();
      pn.panningModel = 'HRTF';
      pn.distanceModel = 'inverse';
      pn.refDistance = 1.2;
      pn.rolloffFactor = 0.7;
      return pn;
    };

    // Output: dry + reverb, with a gentle fade in / out.
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(1, t0 + 1.2);
    out.gain.setValueAtTime(1, tEnd - 2.5);
    out.gain.exponentialRampToValueAtTime(0.0001, tEnd);
    out.connect(this.master);
    const bus = ctx.createGain();
    bus.gain.value = 0.85;
    const reverb = this.makeReverb(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    bus.connect(out);
    bus.connect(reverb).connect(wet).connect(out);

    const sources: AudioScheduledSourceNode[] = [];
    const track = <T extends AudioScheduledSourceNode>(n: T) => {
      sources.push(n);
      n.onended = () => {
        const i = sources.indexOf(n);
        if (i >= 0) sources.splice(i, 1);
      };
      return n;
    };

    // --- Chord bed: one voice per speaker -------------------------------
    const CHORDS: { at: number; notes: number[] }[] = [
      // Order matches SPEAKERS: flh, frh, fll, frl, rlh, rrh.
      { at: 0, notes: [329.63, 369.99, 146.83, 220.0, 440.0, 554.37] }, // Dmaj9
      { at: 0.45, notes: [277.18, 293.66, 123.47, 185.0, 369.99, 440.0] }, // Bm9
      { at: 0.72, notes: [246.94, 293.66, 98.0, 146.83, 369.99, 440.0] }, // Gmaj9
    ];
    SPEAKERS.forEach((spk, i) => {
      const pn = hrtf();
      const [x, y, z] = speakerPoint(spk);
      if (pn.positionX) {
        pn.positionX.value = x;
        pn.positionY.value = y;
        pn.positionZ.value = z;
      } else {
        pn.setPosition(x, y, z);
      }
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      lp.Q.value = 0.4;
      const amp = ctx.createGain();
      const level = i >= 2 && i <= 3 ? 0.075 : 0.05; // low voices a touch louder
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(level, t0 + 2.6 + i * 0.35);
      lp.connect(amp).connect(pn).connect(bus);

      [-5, 5].forEach((cents, j) => {
        const osc = track(ctx.createOscillator());
        osc.type = j === 0 ? 'triangle' : 'sawtooth';
        osc.detune.value = cents;
        CHORDS.forEach((c, k) => {
          const at = t0 + c.at * DEMO_SECONDS;
          if (k === 0) osc.frequency.setValueAtTime(c.notes[i], at);
          else osc.frequency.setTargetAtTime(c.notes[i], at, 0.35);
        });
        const g = ctx.createGain();
        g.gain.value = j === 0 ? 1 : 0.35;
        osc.connect(g).connect(lp);
        osc.start(t0);
        osc.stop(tEnd + 0.1);
      });

      // Slow filter breathing, offset per speaker so the bed shimmers around you.
      const lfo = track(ctx.createOscillator());
      lfo.frequency.value = 0.07 + i * 0.013;
      const depth = ctx.createGain();
      depth.gain.value = 380;
      lfo.connect(depth).connect(lp.frequency);
      lfo.start(t0);
      lfo.stop(tEnd + 0.1);
    });

    // Warm sub swell under the bed (non-directional).
    const sub = track(ctx.createOscillator());
    sub.type = 'sine';
    sub.frequency.setValueAtTime(73.42, t0);
    sub.frequency.setTargetAtTime(61.74, t0 + 0.45 * DEMO_SECONDS, 0.4);
    sub.frequency.setTargetAtTime(49.0, t0 + 0.72 * DEMO_SECONDS, 0.4);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, t0);
    subGain.gain.exponentialRampToValueAtTime(0.12, t0 + 4);
    sub.connect(subGain).connect(bus);
    sub.start(t0);
    sub.stop(tEnd + 0.1);

    // --- The orbiting voice ---------------------------------------------
    const panner = hrtf();
    const voice = ctx.createGain();
    voice.gain.value = 1;
    voice.connect(panner).connect(bus);

    // Shimmer trail: airy band-passed noise, so the ear can track position.
    const air = track(ctx.createBufferSource());
    air.buffer = this.getNoise(ctx);
    air.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 5200;
    bp.Q.value = 1.1;
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.0001, t0);
    airGain.gain.exponentialRampToValueAtTime(0.03, t0 + 1.5);
    air.connect(bp).connect(airGain).connect(voice);
    air.start(t0);
    air.stop(tEnd + 0.1);

    /** FM bell / music-box tone. */
    const bell = (at: number, freq: number, gain: number, decay = 1.6) => {
      const car = track(ctx.createOscillator());
      car.frequency.value = freq;
      const mod = track(ctx.createOscillator());
      mod.frequency.value = freq * 3.51;
      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(freq * 1.8, at);
      modGain.gain.exponentialRampToValueAtTime(freq * 0.05, at + decay * 0.6);
      mod.connect(modGain).connect(car.frequency);
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      amp.gain.exponentialRampToValueAtTime(gain, at + 0.006);
      amp.gain.exponentialRampToValueAtTime(0.0001, at + decay);
      car.connect(amp).connect(voice);
      car.start(at);
      mod.start(at);
      car.stop(at + decay + 0.05);
      mod.stop(at + decay + 0.05);
    };

    // D major pentatonic, two octaves; a looping, slightly varied figure.
    const SCALE = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98];
    const FIGURE = [0, 2, 3, 5, 4, 3, 2, 1, 2, 4, 5, 7, 6, 5, 3, 2];
    const STEP = 0.3;
    let nextNote = t0 + 0.9;
    let noteIndex = 0;
    let lastActive = -1;

    const schedule = (active: number) => {
      while (nextNote < ctx.currentTime + 0.12 && nextNote < tEnd - 1.8) {
        const deg = FIGURE[noteIndex % FIGURE.length] + (noteIndex >= 32 ? -1 : 0);
        const f = SCALE[Math.max(0, deg)];
        const accent = noteIndex % 4 === 0;
        bell(nextNote, f, accent ? 0.11 : 0.07, accent ? 2.2 : 1.4);
        nextNote += STEP;
        noteIndex++;
      }
      // Passing a speaker: a brighter two-note chime.
      if (active >= 0 && active !== lastActive && ctx.currentTime < tEnd - 1.5) {
        const at = ctx.currentTime + 0.02;
        bell(at, 1760, 0.06, 2.6);
        bell(at + 0.04, 2637.02, 0.035, 2.2);
      }
      lastActive = active;
    };

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
      schedule(s.active);
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
      [...sources].forEach((s) => {
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

  get lowEndPlaying() {
    return this.stopLow !== null;
  }

  /**
   * Corner Sub preview: eight deep, punchy notes walking D → B → G → A.
   * Gentle saturation adds harmonics so the line still reads on laptop
   * speakers that can't reproduce the fundamental.
   */
  startLowEnd(onBeat: (i: number) => void, onEnd: () => void) {
    const ctx = this.unlock();
    if (!ctx || !this.master) return;
    this.stopLow?.();
    this.stopDemo?.();

    const NOTES = [36.71, 36.71, 61.74, 61.74, 49.0, 49.0, 55.0, 55.0];
    const BEAT = 1.15;
    const t0 = ctx.currentTime + 0.1;
    const total = NOTES.length * BEAT + 1.6;

    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 2.4);
    }
    shaper.curve = curve;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const out = ctx.createGain();
    out.gain.value = 0.9;
    shaper.connect(lp).connect(out).connect(this.master);

    const sources: AudioScheduledSourceNode[] = [];
    const timers: number[] = [];
    NOTES.forEach((f, i) => {
      const at = t0 + i * BEAT;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * 2.2, at);
      osc.frequency.exponentialRampToValueAtTime(f, at + 0.07);
      const env = ctx.createGain();
      const peak = i % 2 === 0 ? 0.9 : 0.6;
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(peak, at + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 1.25);
      osc.connect(env).connect(shaper);
      osc.start(at);
      osc.stop(at + BEAT * 1.3);
      sources.push(osc);
      timers.push(window.setTimeout(() => onBeat(i), (at - ctx.currentTime) * 1000));
    });

    const cleanup = () => {
      timers.forEach((id) => window.clearTimeout(id));
      sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
      out.disconnect();
      if (this.stopLow === stop) this.stopLow = null;
    };
    const endTimer = window.setTimeout(() => {
      cleanup();
      onEnd();
    }, total * 1000);
    const stop = () => {
      window.clearTimeout(endTimer);
      const now = ctx.currentTime;
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      if (this.stopLow === stop) this.stopLow = null;
      setTimeout(cleanup, 150);
      onEnd();
    };
    this.stopLow = stop;
  }

  stopLowEnd() {
    this.stopLow?.();
  }
}

export const audioEngine = new AudioEngine();
