'use client';

import { hrtfPanner, makeReverb, mtof, noiseBuffer, setListener, setPannerPosition } from './dsp';
import { DEMO_PATH, ROOM, SPEAKERS, speakerPoint, type Vec3 } from './speakers';

/**
 * "Afterglow": an original ~65 s lo-fi house track composed for six corners,
 * synthesised live with Web Audio (no audio files, no licensing).
 *
 * Every stem has a home, so playing it is a speaker test:
 *   kick + bass   → front floor corners (or the Corner Sub, if present)
 *   claps         → front ceiling corners
 *   e-piano keys  → front ceiling corners, low notes left, high notes right
 *   hats          → rear corners, alternating left / right
 *   pad           → all around, weighted to the rear
 *   melody        → orbits the room through every corner (chorus + outro)
 */

export type StemId = 'kick' | 'clap' | 'hats' | 'bass' | 'keys' | 'pad' | 'melody';

/** Speaker indices follow SPEAKERS: 0 flh, 1 frh, 2 fll, 3 frl, 4 rlh, 5 rrh; 6 = Corner Sub. */
export const SUB_INDEX = 6;

export const STEMS: { id: StemId; label: string; where: string; whereWithSub?: string }[] = [
  { id: 'kick', label: 'Kick', where: 'Front floor', whereWithSub: 'Corner Sub' },
  { id: 'bass', label: 'Bass', where: 'Front floor', whereWithSub: 'Corner Sub' },
  { id: 'clap', label: 'Clap', where: 'Front ceiling' },
  { id: 'keys', label: 'Keys', where: 'Front ceiling, split L/R' },
  { id: 'hats', label: 'Hats', where: 'Rear, alternating' },
  { id: 'pad', label: 'Pad', where: 'All around' },
  { id: 'melody', label: 'Melody', where: 'Orbits every corner' },
];

const BPM = 92;
const STEP = 60 / BPM / 4; // a 16th note
const BAR = STEP * 16;
const BARS = 24;
const TAIL = 3.5;

export const SONG = {
  title: 'Afterglow',
  artist: 'HEXA Sound Lab',
  bpm: BPM,
  key: 'D major',
  duration: BARS * BAR + TAIL,
  sections: [
    { name: 'Intro', from: 0 },
    { name: 'Verse', from: 4 },
    { name: 'Chorus', from: 12 },
    { name: 'Outro', from: 20 },
  ],
};

const sectionAt = (bar: number) => [...SONG.sections].reverse().find((s) => bar >= s.from)!.name;

// Dmaj9 → Bm9 → Gmaj9 → A6/9, one chord per bar.
const CHORDS = [
  [50, 54, 57, 61, 64],
  [47, 50, 54, 57, 61],
  [43, 47, 50, 54, 57],
  [45, 49, 54, 59, 64],
];
const ROOTS = [38, 35, 31, 33];
// Melody on 8th notes, one row per chord (D major pentatonic plus the odd colour note).
const MELODY: (number | null)[][] = [
  [81, null, 78, null, 76, 78, 81, null],
  [83, null, 81, 78, null, 76, 74, null],
  [74, 76, 78, null, 81, null, 78, 76],
  [76, null, 73, null, 76, 78, 76, null],
];

export type SongFrame = {
  /** Seconds since the start. */
  t: number;
  total: number;
  section: string;
  /** Plan position of the orbiting melody, when it is playing. */
  orbit: { x: number; y: number } | null;
};

export type SongCallbacks = {
  onHit: (speakers: number[], stem: StemId) => void;
  onFrame: (f: SongFrame) => void;
  onEnd: () => void;
};

/** Plays the song into `dest`. Returns a stop function. */
export function playSong(
  ctx: AudioContext,
  dest: AudioNode,
  cb: SongCallbacks,
  { withSub = false }: { withSub?: boolean } = {},
) {
  setListener(ctx);
  const t0 = ctx.currentTime + 0.15;
  const end = t0 + SONG.duration;

  // Master: gentle glue compression, then a fade in / out.
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(0.9, t0 + 0.6);
  out.gain.setValueAtTime(0.9, t0 + (BARS - 2) * BAR);
  out.gain.exponentialRampToValueAtTime(0.0001, end);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  out.connect(comp).connect(dest);

  const reverb = makeReverb(ctx, 2.8);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  reverb.connect(wet).connect(out);

  // One bus per speaker, each feeding a fixed HRTF panner at that corner.
  const busAt = (p: Vec3, send = 0.25) => {
    const bus = ctx.createGain();
    const pn = hrtfPanner(ctx, p);
    bus.connect(pn).connect(out);
    const s = ctx.createGain();
    s.gain.value = send;
    pn.connect(s).connect(reverb);
    return bus;
  };
  const buses = SPEAKERS.map((s) => busAt(speakerPoint(s, 0.3)));
  // The Sub sits in the free rear-right floor corner.
  const subBus = withSub ? busAt([ROOM.w / 2 - 0.4, 0.2, ROOM.d / 2 - 0.4], 0.05) : null;
  const lowDests = subBus ? [subBus] : [buses[2], buses[3]];

  // The orbiting melody voice.
  const moverBus = ctx.createGain();
  const mover = hrtfPanner(ctx, DEMO_PATH.sample(0).world);
  const moverSend = ctx.createGain();
  moverSend.gain.value = 0.4;
  moverBus.connect(mover).connect(out);
  mover.connect(moverSend).connect(reverb);

  const timers: number[] = [];
  const hit = (at: number, speakers: number[], stem: StemId) => {
    timers.push(window.setTimeout(() => cb.onHit(speakers, stem), Math.max(0, (at - ctx.currentTime) * 1000)));
  };
  const to = (node: AudioNode, dests: AudioNode[]) => dests.forEach((d) => node.connect(d));

  // ---- Instruments --------------------------------------------------------

  const kick = (at: number, vel: number) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, at);
    o.frequency.exponentialRampToValueAtTime(44, at + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vel, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    o.connect(g);
    to(g, lowDests);
    o.start(at);
    o.stop(at + 0.5);
  };

  const clap = (at: number, vel: number) => {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1700;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    // Three quick bursts, like hands, then a short tail.
    g.gain.setValueAtTime(0.0001, at);
    [0, 0.011, 0.022].forEach((d) => {
      g.gain.setValueAtTime(vel, at + d);
      g.gain.exponentialRampToValueAtTime(vel * 0.3, at + d + 0.009);
    });
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    n.connect(bp).connect(g);
    to(g, [buses[0], buses[1]]);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    g.connect(send).connect(reverb);
    n.start(at, Math.random());
    n.stop(at + 0.25);
  };

  const hat = (at: number, vel: number, open: boolean, side: number) => {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6200;
    const g = ctx.createGain();
    const len = open ? 0.24 : 0.045;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vel, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    n.connect(hp).connect(g).connect(buses[side]);
    n.start(at, Math.random());
    n.stop(at + len + 0.02);
  };

  const bass = (at: number, midi: number, dur: number) => {
    const f = mtof(midi);
    const tri = ctx.createOscillator();
    tri.type = 'triangle';
    tri.frequency.value = f;
    const sine = ctx.createOscillator();
    sine.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, at);
    lp.frequency.exponentialRampToValueAtTime(420, at + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.2, at + 0.012);
    g.gain.setValueAtTime(0.16, at + dur - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.08);
    tri.connect(lp);
    sine.connect(lp);
    lp.connect(g);
    to(g, lowDests);
    [tri, sine].forEach((o) => {
      o.start(at);
      o.stop(at + dur + 0.12);
    });
  };

  /** Two-operator FM electric piano: a soft body plus a short "tine" on the attack. */
  const epiano = (at: number, midi: number, dur: number, vel: number, dest: AudioNode) => {
    const f = mtof(midi);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const body = ctx.createOscillator();
    body.frequency.value = f;
    const bodyIdx = ctx.createGain();
    bodyIdx.gain.setValueAtTime(f * 1.6, at);
    bodyIdx.gain.exponentialRampToValueAtTime(f * 0.25, at + 0.9);
    const tine = ctx.createOscillator();
    tine.frequency.value = f * 13.9;
    const tineIdx = ctx.createGain();
    tineIdx.gain.setValueAtTime(f * 0.9, at);
    tineIdx.gain.exponentialRampToValueAtTime(1, at + 0.07);
    body.connect(bodyIdx).connect(car.frequency);
    tine.connect(tineIdx).connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vel, at + 0.004);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, at + 1.1);
    g.gain.setValueAtTime(vel * 0.35, at + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.35);
    car.connect(g).connect(dest);
    [car, body, tine].forEach((o) => {
      o.start(at);
      o.stop(at + dur + 0.4);
    });
  };

  const keys = (at: number, chord: number[], dur: number, vel: number) => {
    const notes = chord.slice(1).map((m) => m + 12);
    notes.forEach((m, i) => epiano(at + i * 0.008, m, dur, vel, buses[i < notes.length / 2 ? 0 : 1]));
  };

  const PAD_HOMES = [4, 5, 4, 5, 0, 1];
  const pad = (at: number, chord: number[], dur: number) => {
    chord.forEach((m, i) => {
      const f = mtof(m + 12);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1300;
      lp.Q.value = 0.3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.036, at + 1.1);
      g.gain.setValueAtTime(0.036, at + dur - 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 1.2);
      lp.connect(g).connect(buses[PAD_HOMES[i % PAD_HOMES.length]]);
      [-7, 7].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = cents;
        o.connect(lp);
        o.start(at);
        o.stop(at + dur + 1.3);
      });
    });
  };

  /** Mallet / bell voice for the orbiting melody. */
  const mallet = (at: number, midi: number, vel: number) => {
    const f = mtof(midi);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const mod = ctx.createOscillator();
    mod.frequency.value = f * 3.01;
    const idx = ctx.createGain();
    idx.gain.setValueAtTime(f * 1.5, at);
    idx.gain.exponentialRampToValueAtTime(f * 0.05, at + 0.3);
    mod.connect(idx).connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vel, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.3);
    car.connect(g).connect(moverBus);
    [car, mod].forEach((o) => {
      o.start(at);
      o.stop(at + 1.35);
    });
  };

  // ---- Arrangement --------------------------------------------------------

  const scheduleStep = (bar: number, s: number, at: number) => {
    const ci = bar % 4;
    const chord = CHORDS[ci];
    const section = sectionAt(bar);
    const drums = section === 'Verse' || section === 'Chorus';
    const chorus = section === 'Chorus';

    if (s === 0) {
      pad(at, chord, BAR);
      hit(at, [4, 5], 'pad');
    }

    // Keys: sparse in the intro, a syncopated comp everywhere else.
    const keyHits = section === 'Intro' ? { 0: 10, 12: 4 } : { 0: 6, 6: 4, 12: 4 };
    const keyLen = (keyHits as Record<number, number>)[s];
    if (keyLen) {
      keys(at, chord, keyLen * STEP, s === 0 ? 0.24 : 0.17);
      hit(at, [0, 1], 'keys');
    }

    if (drums && (s === 0 || s === 6 || s === 10)) {
      kick(at, s === 0 ? 0.6 : 0.46);
      hit(at, subBus ? [SUB_INDEX] : [2, 3], 'kick');
    }
    if ((chorus || (section === 'Verse' && bar >= 8)) && (s === 4 || s === 12)) {
      clap(at, chorus ? 0.55 : 0.4);
      hit(at, [0, 1], 'clap');
    }
    if (drums && s % 2 === 0) {
      const side = (s / 2) % 2 === 0 ? 4 : 5;
      const open = chorus && s === 14;
      hat(at, s % 4 === 2 ? 0.5 : 0.3, open, side);
      hit(at, [side], 'hats');
    } else if (chorus && s % 2 === 1) {
      hat(at, 0.09, false, s % 4 === 1 ? 5 : 4);
    }

    const bassOn = drums || (section === 'Outro' && bar < 22);
    const bassHits: Record<number, [number, number]> = { 0: [0, 5], 6: [0, 2], 10: [7, 3], 14: [12, 2] };
    if (bassOn && bassHits[s]) {
      const [interval, len] = bassHits[s];
      bass(at, ROOTS[ci] + interval, len * STEP);
      if (s === 0) hit(at, subBus ? [SUB_INDEX] : [2, 3], 'bass');
    }

    const melodyOn = chorus || section === 'Outro';
    if (melodyOn && s % 2 === 0) {
      const m = MELODY[ci][s / 2];
      const sparse = section === 'Outro' && s % 4 !== 0;
      if (m !== null && !sparse) {
        const lift = bar >= 16 && bar < 20 && ci >= 2 ? 12 : 0;
        mallet(at, m + lift, section === 'Outro' ? 0.13 : 0.17);
      }
    }
  };

  // Look-ahead scheduler: queue each 16th about 150 ms before it plays.
  let step = 0;
  const total = BARS * 16;
  const scheduler = window.setInterval(() => {
    while (step < total) {
      const s = step % 16;
      const swing = s % 2 === 1 ? STEP * 0.12 : 0;
      const at = t0 + step * STEP + swing;
      if (at > ctx.currentTime + 0.15) break;
      scheduleStep(Math.floor(step / 16), s, at);
      step++;
    }
  }, 25);

  // Per frame: move the melody round the room and report progress.
  const orbitFrom = SONG.sections.find((x) => x.name === 'Chorus')!.from * BAR;
  let raf = 0;
  const frame = () => {
    const t = ctx.currentTime - t0;
    if (t >= SONG.duration) {
      cleanup();
      cb.onEnd();
      return;
    }
    const bar = Math.max(0, Math.floor(t / BAR));
    let orbit: SongFrame['orbit'] = null;
    if (t >= orbitFrom) {
      // One lap every four bars.
      const sample = DEMO_PATH.sample(((t - orbitFrom) / (4 * BAR)) % 1);
      setPannerPosition(mover, sample.world, { ctx, tau: 0.05 });
      orbit = sample.plan;
    }
    cb.onFrame({ t: Math.max(0, t), total: SONG.duration, section: sectionAt(Math.min(bar, BARS - 1)), orbit });
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  let stopped = false;
  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(scheduler);
    cancelAnimationFrame(raf);
    timers.forEach((id) => window.clearTimeout(id));
    window.setTimeout(() => out.disconnect(), 250);
  };

  return () => {
    if (stopped) return;
    // Quick fade to avoid a pop; scheduled notes play out into a disconnected bus.
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), now);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    cleanup();
  };
}

/** A short two-note chime from a single speaker (index 6 = the Corner Sub). */
export function pingSpeaker(ctx: AudioContext, dest: AudioNode, index: number) {
  setListener(ctx);
  const at = ctx.currentTime + 0.02;
  const p: Vec3 = index === SUB_INDEX ? [ROOM.w / 2 - 0.4, 0.2, ROOM.d / 2 - 0.4] : speakerPoint(SPEAKERS[index], 0.3);
  const pn = hrtfPanner(ctx, p);
  const g = ctx.createGain();
  g.gain.value = 0.9;
  pn.connect(g).connect(dest);
  // The Sub gets a low thump; the corners get a bright two-note chime.
  const notes = index === SUB_INDEX ? [43.65, 65.41] : [880, 1318.51];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = index === SUB_INDEX ? 'sine' : 'triangle';
    o.frequency.value = f;
    const e = ctx.createGain();
    const t = at + i * 0.12;
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(index === SUB_INDEX ? 0.8 : 0.25, t + 0.006);
    e.gain.exponentialRampToValueAtTime(0.0001, t + (index === SUB_INDEX ? 0.9 : 0.7));
    o.connect(e).connect(pn);
    o.start(t);
    o.stop(t + 1);
  });
  // A whisper of noise helps the ear place the corner chime.
  if (index !== SUB_INDEX) {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4000;
    const e = ctx.createGain();
    e.gain.setValueAtTime(0.0001, at);
    e.gain.exponentialRampToValueAtTime(0.08, at + 0.01);
    e.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
    n.connect(bp).connect(e).connect(pn);
    n.start(at, Math.random());
    n.stop(at + 0.3);
  }
  window.setTimeout(() => g.disconnect(), 1400);
}
