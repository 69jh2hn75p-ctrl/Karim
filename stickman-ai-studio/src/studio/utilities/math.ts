/** Small numeric helpers shared by the studio. Pure functions, no Remotion imports. */

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Cubic ease-in-out on [0, 1]. */
export const easeInOut = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Piecewise-linear value over ascending keys. Holds the end values outside the range. */
export function track(x: number, keys: readonly number[], values: readonly number[]): number {
  if (keys.length !== values.length || keys.length === 0) throw new Error('track: keys and values must match');
  if (x <= keys[0]) return values[0];
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i]) {
      const span = keys[i] - keys[i - 1];
      const t = span === 0 ? 1 : (x - keys[i - 1]) / span;
      return lerp(values[i - 1], values[i], smoothstep(t));
    }
  }
  return values[values.length - 1];
}

/** Seeded pseudo-random in [0, 1). Same seed, same sequence, so props never flicker between renders. */
export function seeded(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic hash-noise in [-1, 1] for a given integer input. */
export const hashNoise = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

/** Smooth 1D noise in [-1, 1] over a continuous time value. Good for idle sway. */
export function smoothNoise(t: number, seed = 0): number {
  const i = Math.floor(t);
  const f = t - i;
  const a = hashNoise(i + seed * 17);
  const b = hashNoise(i + 1 + seed * 17);
  return lerp(a, b, smoothstep(f));
}
