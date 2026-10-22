'use client';

import { ROOM, type Vec3 } from './speakers';

/** Small Web Audio building blocks shared by the demos and the test song. */

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/** Two seconds of white noise, generated once per context. */
export function noiseBuffer(ctx: BaseAudioContext) {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

/** Synthesised room reverb: stereo noise with an exponential tail. */
export function makeReverb(ctx: BaseAudioContext, seconds = 3.4) {
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

/** Listener on the sofa, facing the TV wall (-Z), head up (+Y). */
export function setListener(ctx: BaseAudioContext) {
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
}

/** An HRTF panner, optionally placed at a fixed position. */
export function hrtfPanner(ctx: BaseAudioContext, at?: Vec3) {
  const pn = ctx.createPanner();
  pn.panningModel = 'HRTF';
  pn.distanceModel = 'inverse';
  pn.refDistance = 1.2;
  pn.rolloffFactor = 0.7;
  if (at) setPannerPosition(pn, at);
  return pn;
}

export function setPannerPosition(pn: PannerNode, [x, y, z]: Vec3, smoothing?: { ctx: BaseAudioContext; tau: number }) {
  if (pn.positionX) {
    if (smoothing) {
      const now = smoothing.ctx.currentTime;
      pn.positionX.setTargetAtTime(x, now, smoothing.tau);
      pn.positionY.setTargetAtTime(y, now, smoothing.tau);
      pn.positionZ.setTargetAtTime(z, now, smoothing.tau);
    } else {
      pn.positionX.value = x;
      pn.positionY.value = y;
      pn.positionZ.value = z;
    }
  } else {
    pn.setPosition(x, y, z);
  }
}

export const mtof = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
