/** Pure numeric helpers. No Remotion imports, so tests can run without a browser. */

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Cubic ease-in-out on [0, 1]. */
export const easeInOut = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Piecewise-linear interpolation over ascending keys. Holds the end values outside the range. */
export function piecewise(x: number, xs: readonly number[], ys: readonly number[]): number {
  if (xs.length !== ys.length || xs.length === 0) throw new Error('piecewise: keys and values must match');
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) {
      const span = xs[i] - xs[i - 1];
      const t = span === 0 ? 1 : (x - xs[i - 1]) / span;
      return lerp(ys[i - 1], ys[i], t);
    }
  }
  return ys[ys.length - 1];
}

/** Eased 0..1 ramp between two frames. */
export function smooth(x: number, from: number, to: number): number {
  if (to === from) return x >= to ? 1 : 0;
  return easeInOut((x - from) / (to - from));
}

/** Eased tween between two values over [t0, t1]. */
export function tween(x: number, a: number, b: number, t0: number, t1: number): number {
  return lerp(a, b, smooth(x, t0, t1));
}

export const inSpan = (x: number, span: { from: number; to: number }): boolean =>
  x >= span.from && x <= span.to;
