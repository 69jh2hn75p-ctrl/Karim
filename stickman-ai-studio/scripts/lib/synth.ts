/**
 * Original, procedurally generated audio: a short music bed and three SFX.
 * Fully deterministic (seeded noise), no third-party samples, so the output is
 * reproducible and license-free.
 */

export const SAMPLE_RATE = 48000;

/** Small seeded PRNG (mulberry32) so noise is reproducible between builds. */
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
const triangle = (phase: number): number => {
  const x = phase - Math.floor(phase);
  return 4 * Math.abs(x - 0.5) - 1;
};

/** Peak-normalise a buffer to the given level. */
export function normalizePeak(buf: Float32Array, peak: number): Float32Array {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max === 0) return buf;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}

/** Ambient mystery bed at 96 BPM: Am-F-C-G pad, bass, plucks, soft kick after the intro. */
export function renderMusicBed(seconds: number, sr = SAMPLE_RATE): Float32Array {
  const n = Math.floor(seconds * sr);
  const out = new Float32Array(n);
  const beat = 60 / 96;
  const eighth = beat / 2;
  const chordLen = beat * 8; // one chord per two bars
  const chords = [
    { root: 57, tones: [57, 60, 64] }, // Am: A3 C4 E4
    { root: 53, tones: [53, 57, 60] }, // F:  F3 A3 C4
    { root: 48, tones: [48, 52, 55] }, // C:  C3 E3 G3
    { root: 55, tones: [55, 59, 62] }, // G:  G3 B3 D4
  ];

  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const cycle = Math.floor(t / chordLen);
    const chord = chords[cycle % chords.length];
    const tc = t - cycle * chordLen;
    let v = 0;

    // Pad: three detuned sines per chord tone, slow fade at chord edges.
    const padEnv = Math.min(1, tc / 1.2) * Math.min(1, (chordLen - tc) / 1.2);
    for (const m of chord.tones) {
      const f = mtof(m);
      v += 0.085 * padEnv * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 1.004 * t));
    }

    // Bass: triangle on the root an octave down, on every eighth note.
    const ts = t % eighth;
    const bassEnv = Math.min(1, ts / 0.01) * Math.exp(-ts * 9);
    v += 0.14 * bassEnv * triangle(mtof(chord.root - 12) * t);

    // Plucks: arpeggio over chord tones one octave up, after the 5 s intro.
    if (t > 5) {
      const step = Math.floor(t / eighth);
      const tone = chord.tones[step % chord.tones.length] + 12;
      const pluckEnv = Math.min(1, ts / 0.004) * Math.exp(-ts * 6);
      v += 0.04 * pluckEnv * Math.sin(2 * Math.PI * mtof(tone) * t);
    }

    // Soft kick on each beat after 6 s (the drop).
    if (t > 6) {
      const tb = t % beat;
      const phase = 2 * Math.PI * (40 * tb + (70 / 25) * (1 - Math.exp(-25 * tb)));
      v += 0.16 * Math.exp(-tb * 14) * Math.sin(phase);
    }

    // Global fades: 2 s in, 3 s out.
    const fade = Math.min(1, t / 2) * Math.min(1, (seconds - t) / 3);
    out[i] = v * fade;
  }
  return normalizePeak(out, 0.8);
}

/** Short footstep: lowpassed noise burst with a low thump. */
export function renderFootstep(sr = SAMPLE_RATE): Float32Array {
  const n = Math.floor(0.14 * sr);
  const out = new Float32Array(n);
  const rnd = prng(1001);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    lp += 0.18 * (rnd() * 2 - 1 - lp);
    const env = Math.min(1, t / 0.002) * Math.exp(-t * 38);
    const thump = 0.6 * Math.exp(-t * 30) * Math.sin(2 * Math.PI * 85 * t);
    out[i] = env * lp * 1.6 + thump;
  }
  return normalizePeak(out, 0.5);
}

/** Door creak with a rising sweep, noise texture and a closing clunk. */
export function renderDoor(sr = SAMPLE_RATE): Float32Array {
  const n = Math.floor(1.8 * sr);
  const out = new Float32Array(n);
  const rnd = prng(2002);
  let phase = 0;
  let bp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const freq = 140 + 120 * Math.min(1, t / 1.2);
    phase += freq / sr;
    // Creak swells in over 50 ms and fades out between 0.95 s and 1.25 s.
    const creakEnv = Math.min(1, t / 0.05) * Math.min(1, Math.max(0, (1.25 - t) / 0.3));
    const creak = 0.22 * creakEnv * Math.sin(2 * Math.PI * phase) * (1 + 0.3 * Math.sin(2 * Math.PI * 7 * t));
    bp += 0.05 * ((rnd() * 2 - 1) - bp);
    const texture = 0.35 * creakEnv * bp * 4;
    const clunkT = t - 1.35;
    const clunk = clunkT >= 0 ? 0.7 * Math.exp(-clunkT * 12) * Math.sin(2 * Math.PI * 70 * clunkT) : 0;
    out[i] = creak + texture + clunk;
  }
  return normalizePeak(out, 0.6);
}

/** Bright two-tone chime for the console. */
export function renderPing(sr = SAMPLE_RATE): Float32Array {
  const n = Math.floor(1.2 * sr);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.003) * Math.exp(-t * 5);
    out[i] = env * (Math.sin(2 * Math.PI * 1320 * t) + 0.4 * Math.sin(2 * Math.PI * 1980 * t));
  }
  return normalizePeak(out, 0.45);
}
