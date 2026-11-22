/**
 * Stickman pose model. Angles are radians measured from straight down (0),
 * positive swings forward (+x in figure space). Knee and elbow values are bends
 * relative to the parent limb. Pure math, no rendering.
 */
import { clamp, lerp } from '../engine/math';

export interface Pose {
  thighL: number;
  shinL: number;
  thighR: number;
  shinR: number;
  upperL: number;
  foreL: number;
  upperR: number;
  foreR: number;
  /** Radians, positive tilts forward. */
  headTilt: number;
  /** Vertical body offset in figure units. Negative is up. */
  bob: number;
}

export const IDLE: Pose = {
  thighL: 0.03,
  shinL: 0.04,
  thighR: -0.03,
  shinR: 0.04,
  upperL: 0.12,
  foreL: 0.18,
  upperR: -0.12,
  foreR: 0.18,
  headTilt: 0,
  bob: 0,
};

/** Standing still, with a slow breathing bob and arm sway. */
export function idlePose(frame: number): Pose {
  return {
    ...IDLE,
    upperL: 0.12 + 0.03 * Math.sin(frame * 0.11),
    upperR: -0.12 + 0.03 * Math.sin(frame * 0.11 + 1),
    bob: -1.2 * (0.5 + 0.5 * Math.sin(frame * 0.14)),
  };
}

/** One stride. Arms swing opposite to the legs; knees bend in the swing phase. */
export function walkPose(phase: number): Pose {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  return {
    thighL: 0.45 * s,
    shinL: 0.08 + 0.7 * Math.max(0, c),
    thighR: -0.45 * s,
    shinR: 0.08 + 0.7 * Math.max(0, -c),
    upperL: -0.42 * s,
    foreL: 0.25,
    upperR: 0.42 * s,
    foreR: 0.25,
    headTilt: -0.03 * s,
    bob: -4 * Math.abs(s),
  };
}

/** Right arm forward, elbow almost straight: a pointing gesture. */
export const POINT_ARM = { upperR: 1.42, foreR: 0.05 } as const;

/** Both arms up: surprise. */
export const ARMS_UP = { upperL: 2.65, foreL: 0.15, upperR: -2.55, foreR: -0.15 } as const;

export function mixPose(a: Pose, b: Pose, w: number): Pose {
  const t = clamp(w, 0, 1);
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
    bob: lerp(a.bob, b.bob, t),
  };
}

export interface PoseInput {
  frame: number;
  /** 0..1 from walkWeight. */
  walkWeight: number;
  phase: number;
  /** 0..1 weight of the pointing gesture. */
  point?: number;
  /** 0..1 weight of the arms-up gesture. */
  surprise?: number;
  /** 0..1 head nod while speaking. */
  speaking?: number;
}

export function buildPose(input: PoseInput): Pose {
  const base = mixPose(idlePose(input.frame), walkPose(input.phase), input.walkWeight);
  let p: Pose = { ...base };

  const point = clamp(input.point ?? 0, 0, 1);
  if (point > 0) {
    p = {
      ...p,
      upperR: lerp(p.upperR, POINT_ARM.upperR, point),
      foreR: lerp(p.foreR, POINT_ARM.foreR, point),
    };
  }

  const surprise = clamp(input.surprise ?? 0, 0, 1);
  if (surprise > 0) {
    p = {
      ...p,
      upperL: lerp(p.upperL, ARMS_UP.upperL, surprise),
      foreL: lerp(p.foreL, ARMS_UP.foreL, surprise),
      upperR: lerp(p.upperR, ARMS_UP.upperR, surprise),
      foreR: lerp(p.foreR, ARMS_UP.foreR, surprise),
    };
  }

  const speaking = clamp(input.speaking ?? 0, 0, 1);
  if (speaking > 0) {
    p = { ...p, headTilt: p.headTilt + speaking * 0.05 * Math.sin(input.frame * 0.45) };
  }
  return p;
}
