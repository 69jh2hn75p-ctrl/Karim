/**
 * Reusable body presets. Each preset is a pure function of local time (seconds), so the
 * same preset works in any scene. Presets return a full Pose; mixPose blends between them.
 */
import type { Pose } from '../characters/types';
import { lerp, smoothNoise } from '../utilities/math';

export const NEUTRAL: Pose = {
  thighL: 0.03,
  shinL: 0.05,
  thighR: -0.03,
  shinR: 0.05,
  upperL: 0.14,
  foreL: 0.2,
  upperR: -0.14,
  foreR: 0.2,
  headTilt: 0,
  torsoLean: 0,
  hipY: 0,
};

export function mixPose(a: Pose, b: Pose, w: number): Pose {
  const t = Math.max(0, Math.min(1, w));
  return {
    thighL: lerp(a.thighL, b.thighL, t),
    shinL: lerp(a.shinL, b.shinL, t),
    thighR: lerp(a.thighR, b.thighR, t),
    shinR: lerp(a.shinR, b.shinR, t),
    upperL: lerp(a.upperL, b.upperL, t),
    foreL: lerp(a.foreL, b.foreL, t),
    upperR: lerp(a.upperR, b.upperR, t),
    foreR: lerp(a.foreR, b.foreR, t),
    headTilt: lerp(a.headTilt, b.headTilt, t),
    torsoLean: lerp(a.torsoLean, b.torsoLean, t),
    hipY: lerp(a.hipY, b.hipY, t),
  };
}

/** Standing with breathing and a little sway. Never fully still. */
export function idle(t: number, seed = 0): Pose {
  const breath = Math.sin(t * 2.1 + seed);
  return {
    ...NEUTRAL,
    upperL: 0.14 + 0.04 * Math.sin(t * 1.3 + seed),
    upperR: -0.14 + 0.04 * Math.sin(t * 1.3 + seed + 1),
    headTilt: 0.03 * smoothNoise(t * 0.6, 3 + seed),
    torsoLean: 0.02 * breath,
    hipY: -2 * (0.5 + 0.5 * breath),
  };
}

/** Walk cycle. speed 1 is a normal stride; phase advances with time. */
export function walk(t: number, speed = 1, amp = 0.46): Pose {
  const ph = t * Math.PI * 2 * 1.15 * speed;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return {
    thighL: amp * s,
    shinL: 0.08 + 0.7 * Math.max(0, c),
    thighR: -amp * s,
    shinR: 0.08 + 0.7 * Math.max(0, -c),
    upperL: -0.4 * s,
    foreL: 0.25,
    upperR: 0.4 * s,
    foreR: 0.25,
    headTilt: -0.025 * s,
    torsoLean: 0.04,
    hipY: -5 * Math.abs(s),
  };
}

/** Run: longer strides, forward lean, arms pumping. */
export function run(t: number, speed = 1): Pose {
  const base = walk(t, speed * 1.7, 0.85);
  return {
    ...base,
    upperL: base.upperL * 1.6,
    upperR: base.upperR * 1.6,
    foreL: 1.1,
    foreR: 1.1,
    torsoLean: 0.22,
    hipY: base.hipY - 6,
  };
}

/** Sitting on a chair: thighs forward, shins down, torso upright. */
export const SIT: Pose = {
  ...NEUTRAL,
  thighL: 1.45,
  shinL: 0.1,
  thighR: 1.45,
  shinR: 0.1,
  upperL: 0.25,
  foreL: 0.7,
  upperR: 0.25,
  foreR: 0.7,
  hipY: 52,
  torsoLean: 0.05,
};

/** Right arm pointing forward, elbow almost straight. */
export function point(t: number): Pose {
  return {
    ...NEUTRAL,
    upperR: 1.42 + 0.02 * Math.sin(t * 3),
    foreR: 0.06,
    headTilt: 0.06,
  };
}

/** Waving with the right hand. */
export function wave(t: number): Pose {
  return {
    ...NEUTRAL,
    upperR: 2.55 + 0.1 * Math.sin(t * 2.5),
    foreR: 0.9 + 0.5 * Math.sin(t * 9),
    headTilt: 0.08,
  };
}

/** Holding something in front with both hands (gift, tray, bowl). */
export const HOLD: Pose = {
  ...NEUTRAL,
  upperL: 1.1,
  foreL: 1.0,
  upperR: 1.0,
  foreR: 1.2,
  torsoLean: 0.06,
};

/** Bracing a falling tree: both arms up, legs apart, knees bent, a strain jitter. */
export function brace(t: number): Pose {
  const jitter = 0.05 * Math.sin(t * 22);
  return {
    ...NEUTRAL,
    upperL: 2.2 + jitter,
    foreL: 0.5,
    upperR: 2.2 - jitter,
    foreR: 0.5,
    thighL: 0.4,
    shinL: 0.3,
    thighR: -0.4,
    shinR: 0.3,
    torsoLean: 0.16,
    hipY: 10,
    headTilt: 0.05 * Math.sin(t * 5),
  };
}

/** Both arms straight up: cheer, excitement. */
export function cheer(t: number): Pose {
  return {
    ...NEUTRAL,
    upperL: 2.8 + 0.06 * Math.sin(t * 6),
    foreL: 0.1,
    upperR: -2.8 - 0.06 * Math.sin(t * 6),
    foreR: -0.1,
    hipY: -6 * Math.abs(Math.sin(t * 6)),
    headTilt: 0.04,
  };
}

/** Arms wide and open toward someone: hug. */
export const HUG: Pose = {
  ...NEUTRAL,
  upperL: 1.9,
  foreL: 1.3,
  upperR: 1.9,
  foreR: 1.3,
  torsoLean: 0.12,
  headTilt: 0.1,
};

/** Startled reaction: body leans back, arms come up. */
export const STARTLE: Pose = {
  ...NEUTRAL,
  upperL: 2.1,
  foreL: 0.6,
  upperR: -2.0,
  foreR: -0.5,
  torsoLean: -0.14,
  hipY: -4,
};

/** Sneaking: crouched, slow, arms low. */
export function sneak(t: number): Pose {
  const s = Math.sin(t * Math.PI * 2 * 0.8);
  return {
    ...NEUTRAL,
    thighL: 0.6 + 0.2 * s,
    shinL: 1.0 - 0.2 * s,
    thighR: 0.6 - 0.2 * s,
    shinR: 1.0 + 0.2 * s,
    torsoLean: 0.28,
    hipY: 36,
    upperL: 0.5,
    upperR: 0.5,
    foreL: 0.9,
    foreR: 0.9,
  };
}

/** Falling backwards with arms flailing. */
export function fall(t: number): Pose {
  const flail = Math.sin(t * 14);
  return {
    ...NEUTRAL,
    upperL: 2.4 + 0.3 * flail,
    foreL: 0.3,
    upperR: -2.2 - 0.3 * flail,
    foreR: -0.3,
    thighL: 0.9 + 0.2 * flail,
    shinL: 0.4,
    thighR: -0.7 - 0.2 * flail,
    shinR: 0.6,
    torsoLean: -0.35,
    hipY: -10,
  };
}

/** Dancing: bounce and swing the arms in alternation. */
export function dance(t: number): Pose {
  const beat = Math.sin(t * Math.PI * 2 * 1.6);
  return {
    ...NEUTRAL,
    upperL: 1.9 * Math.sin(t * Math.PI * 2 * 0.8),
    foreL: 0.8,
    upperR: 1.9 * Math.sin(t * Math.PI * 2 * 0.8 + Math.PI),
    foreR: 0.8,
    hipY: -8 * Math.abs(beat),
    torsoLean: 0.06 * beat,
    headTilt: 0.12 * beat,
    thighL: 0.25 * beat,
    thighR: -0.25 * beat,
  };
}

/** Looking around: the head sweeps side to side. */
export function lookAround(t: number, seed = 0): Pose {
  return {
    ...idle(t, seed),
    headTilt: 0.18 * Math.sin(t * 0.9),
  };
}
