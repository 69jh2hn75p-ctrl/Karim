/**
 * Procedural sound for Episode 002 ("Ash Road"): a wasteland bed with wind and a
 * heartbeat that turns into a hopeful chord, plus a plank crack, a grab whoosh and a
 * radio beep. Deterministic and original, so there are no licensing questions.
 */
import { SAMPLE_RATE, normalizePeak, renderFootstep } from './synth';

export { renderFootstep };

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mtof = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Bed: low drones, filtered wind that swells and fades, a 72 BPM heartbeat from 4 s to 22 s,
 * then an A major chord fading in from 22 s on. Fades in over 1.5 s and out over 2.5 s.
 */
export function renderWastelandBed(seconds: number, sr = SAMPLE_RATE): Float32Array {
  const n = Math.floor(seconds * sr);
  const out = new Float32Array(n);
  const rnd = prng(7007);
  const beat = 60 / 72;
  let wind = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;

    v += 0.12 * Math.sin(2 * Math.PI * 55 * t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.1 * t));
    v += 0.07 * Math.sin(2 * Math.PI * 82.4 * t + 0.5 * Math.sin(2 * Math.PI * 0.05 * t));

    wind += 0.004 * ((rnd() * 2 - 1) - wind);
    v += wind * 1.6 * (0.45 + 0.55 * Math.sin(2 * Math.PI * 0.07 * t + 1));

    if (t >= 4 && t < 22) {
      const fadeOut = Math.min(1, Math.max(0, (22 - t) / 2));
      const tb = (t - 4) % beat;
      const env = Math.min(1, tb / 0.005) * Math.exp(-tb * 18);
      v += 0.25 * fadeOut * env * Math.sin(2 * Math.PI * 48 * tb);
    }

    if (t >= 22) {
      const pad = Math.min(1, (t - 22) / 4);
      for (const m of [57, 61, 64]) {
        v += 0.045 * pad * Math.sin(2 * Math.PI * mtof(m) * t);
      }
    }

    const fade = Math.min(1, t / 1.5) * Math.min(1, (seconds - t) / 2.5);
    out[i] = v * fade;
  }
  return normalizePeak(out, 0.8);
}

/** Plank crack: a sharp noise burst with a wooden knock underneath. */
export function renderCrack(sr = SAMPLE_RATE): Float32Array {
  const n = Math.floor(0.5 * sr);
  const out = new Float32Array(n);
  const rnd = prng(3003);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    lp += 0.5 * ((rnd() * 2 - 1) - lp);
    const burst = Math.min(1, t / 0.001) * Math.exp(-t * 14) * lp;
    const knock = 0.6 * Math.exp(-t * 25) * Math.sin(2 * Math.PI * 180 * t);
    out[i] = burst * 1.4 + knock;
  }
  return normalizePeak(out, 0.7);
}

/** Grab whoosh: filtered noise with a rising cutoff and a bell-shaped envelope. */
export function renderWhoosh(sr = SAMPLE_RATE): Float32Array {
  const dur = 0.7;
  const n = Math.floor(dur * sr);
  const out = new Float32Array(n);
  const rnd = prng(4004);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const alpha = 0.02 + 0.28 * (t / dur);
    lp += alpha * ((rnd() * 2 - 1) - lp);
    const env = Math.pow(Math.sin((Math.PI * t) / dur), 2);
    out[i] = lp * env;
  }
  return normalizePeak(out, 0.5);
}

/** Radio beep: a short clean tone. */
export function renderBeep(sr = SAMPLE_RATE): Float32Array {
  const dur = 0.14;
  const n = Math.floor(dur * sr);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.004) * Math.min(1, (dur - t) / 0.02);
    out[i] = env * Math.sin(2 * Math.PI * 1100 * t);
  }
  return normalizePeak(out, 0.4);
}
