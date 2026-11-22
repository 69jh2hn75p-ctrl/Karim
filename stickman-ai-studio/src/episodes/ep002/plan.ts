/**
 * Episode 002 — "Ash Road". Post-apocalyptic survival, 30 s, 30 fps, 1920x1080.
 * Same characters as Episode 001 (Ren, Bo) and the same rig; a different world.
 * The plan is pure data and pure functions of the frame, so it can be tested without a browser.
 */
import { clamp, piecewise, smooth, tween } from '../../engine/math';
import type { CharacterId } from '../../engine/timeline';
import { walkPose, idlePose, buildPose, type Pose } from '../../characters/pose';

export const EP2 = {
  id: 'ep002',
  title: 'Ash Road',
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 900, // 30 s
  groundY: 860,
  cameraY: 540,
  charScale: 1.6,
} as const;

export interface Span {
  from: number;
  to: number;
}

export interface Ep2Scene {
  id: string;
  title: string;
  from: number;
  to: number;
  location: string;
}

export const EP2_SCENES: readonly Ep2Scene[] = [
  { id: 'S01', title: 'Ash', from: 0, to: 180, location: 'Ruined avenue under falling ash' },
  { id: 'S02', title: 'Empty tap', from: 180, to: 360, location: 'Dry hydrant, water tower in the distance' },
  { id: 'S03', title: 'The bridge', from: 360, to: 570, location: 'Rusted bridge over a chasm' },
  { id: 'S04', title: 'Signal', from: 570, to: 750, location: 'Bunker door with a blinking radio' },
  { id: 'S05', title: 'Light', from: 750, to: 900, location: 'Ridge at dusk, a distant lamp' },
];

export interface Ep2Dialogue {
  id: string;
  speaker: CharacterId;
  text: string;
  startFrame: number;
}

export const EP2_DIALOGUE: readonly Ep2Dialogue[] = [
  { id: 'E2L01', speaker: 'bo', text: 'The bottles are empty. All of them.', startFrame: 180 },
  { id: 'E2L02', speaker: 'ren', text: 'The tower still stands. We go there.', startFrame: 262 },
  { id: 'E2L03', speaker: 'ren', text: "Hold my hand, Bo. Don't look down.", startFrame: 380 },
  { id: 'E2L04', speaker: 'bo', text: "I'm holding on. Keep going.", startFrame: 490 },
  { id: 'E2L05', speaker: 'ren', text: 'Someone is still sending. Listen.', startFrame: 600 },
  { id: 'E2L06', speaker: 'bo', text: "Then we're not alone.", startFrame: 690 },
];

export interface Ep2Sfx {
  id: string;
  file: string;
  frame: number;
  volume: number;
}

export const EP2_SFX: readonly Ep2Sfx[] = [
  { id: 'plank-crack', file: 'sfx/crack.wav', frame: 468, volume: 0.7 },
  { id: 'radio-beep-1', file: 'sfx/beep.wav', frame: 600, volume: 0.35 },
  { id: 'radio-beep-2', file: 'sfx/beep.wav', frame: 636, volume: 0.35 },
  { id: 'radio-beep-3', file: 'sfx/beep.wav', frame: 672, volume: 0.35 },
  { id: 'grab-whoosh', file: 'sfx/whoosh.wav', frame: 478, volume: 0.5 },
];

/** Walk spans and world-x keys. Pauses are flat segments. */
/** Bo leads onto the bridge; Ren follows a little behind and reaches forward to him. */
export const EP2_WALK: Record<CharacterId, readonly Span[]> = {
  ren: [
    { from: 0, to: 150 },
    { from: 360, to: 470 },
    { from: 530, to: 740 },
  ],
  bo: [
    { from: 0, to: 150 },
    { from: 360, to: 470 },
    { from: 530, to: 740 },
  ],
};
export const EP2_WALK_PERIOD = 15;

export const EP2_PATH: Record<CharacterId, { frames: readonly number[]; xs: readonly number[] }> = {
  ren: {
    frames: [0, 150, 220, 360, 380, 470, 530, 560, 740],
    xs: [-300, 500, 500, 500, 500, 930, 930, 1100, 2300],
  },
  bo: {
    frames: [0, 150, 220, 360, 380, 470, 530, 560, 740],
    xs: [-400, 560, 560, 560, 560, 1000, 1000, 1200, 2350],
  },
};

export function charX(id: CharacterId, frame: number): number {
  const k = EP2_PATH[id];
  return piecewise(frame, k.frames, k.xs);
}

export function walkWeight(id: CharacterId, frame: number): number {
  let w = 0;
  for (const s of EP2_WALK[id]) {
    if (frame < s.from || frame > s.to) continue;
    w = Math.max(w, Math.min(clamp((frame - s.from + 1) / 8, 0, 1), clamp((s.to - frame) / 12, 0, 1)));
  }
  return w;
}

export const walkPhase = (frame: number): number => (frame * 2 * Math.PI) / EP2_WALK_PERIOD;

export interface Footstrike {
  frame: number;
  id: CharacterId;
}

export function footstrikes(): Footstrike[] {
  const index = (f: number) => Math.floor((2 * f) / EP2_WALK_PERIOD - 0.5);
  const out: Footstrike[] = [];
  for (const id of ['ren', 'bo'] as CharacterId[]) {
    for (const s of EP2_WALK[id]) {
      for (let f = s.from + 1; f <= s.to - 4; f++) {
        if (index(f) !== index(f - 1) && walkWeight(id, f) >= 0.6) out.push({ frame: f, id });
      }
    }
  }
  return out.sort((a, b) => a.frame - b.frame);
}

/** Ren points down the road toward the water tower. */
export const renPointWeight = (f: number): number => smooth(f, 200, 215) * (1 - smooth(f, 330, 352));

/** Bo slumps while the bottles are empty. */
export const boSlumpWeight = (f: number): number => smooth(f, 186, 205) * (1 - smooth(f, 345, 362));

/** Ren reaches down to Bo when the plank breaks. */
export const renReachWeight = (f: number): number => smooth(f, 462, 486) * (1 - smooth(f, 540, 566));

/** Bo's arms go up to grab Ren's hand. */
export const boReachWeight = (f: number): number => smooth(f, 466, 486) * (1 - smooth(f, 530, 556));

/**
 * Vertical drop of Bo over the broken plank: he falls, hangs, and is pulled back up.
 * Positive is down in world space. Zero means standing on the bridge.
 */
export function boDrop(f: number): number {
  return piecewise(f, [462, 480, 500, 530, 548], [0, 90, 96, 40, 0]);
}

/** Radio LED on the bunker door: blinks on each beat once the signal starts. */
export function radioLed(f: number): number {
  if (f < 600) return 0;
  const phase = (f - 600) % 36;
  return phase < 10 ? 1 : 0.15;
}

/** Ash density rises during the bridge and dims at dusk. */
export const ashAmount = (f: number): number => 0.55 + 0.35 * smooth(f, 360, 480) - 0.25 * smooth(f, 800, 900);

export function camera(frame: number): { x: number; y: number; zoom: number } {
  const y = EP2.cameraY;
  if (frame < 180) return { x: tween(frame, 200, 700, 0, 180), y, zoom: tween(frame, 1.0, 1.06, 0, 180) };
  if (frame < 360) return { x: tween(frame, 500, 540, 0, 180), y, zoom: tween(frame, 1.35, 1.42, 0, 180) };
  if (frame < 570) {
    const x = piecewise(frame, [360, 470, 570], [520, 980, 1200]);
    return { x, y, zoom: tween(frame, 1.25, 1.05, 0, 210) };
  }
  if (frame < 750) return { x: tween(frame, 1400, 2450, 0, 180), y, zoom: tween(frame, 1.08, 0.98, 0, 180) };
  return { x: tween(frame, 2450, 2650, 0, 150), y, zoom: tween(frame, 0.98, 0.86, 0, 150) };
}

export const TITLE_SPAN = { from: 800, to: 890 };

/** Pose for one character at one frame, with the Episode 002 gestures layered on top. */
export function poseAt(id: CharacterId, frame: number, speaking: boolean): Pose {
  const base = buildPose({
    frame,
    walkWeight: walkWeight(id, frame),
    phase: walkPhase(frame),
    speaking: speaking ? 1 : 0,
  });
  let p: Pose = { ...base };
  if (id === 'ren') {
    const point = renPointWeight(frame);
    if (point > 0) p = { ...p, upperR: lerp(p.upperR, 1.42, point), foreR: lerp(p.foreR, 0.05, point) };
    const reach = renReachWeight(frame);
    if (reach > 0) p = { ...p, upperR: lerp(p.upperR, 0.95, reach), foreR: lerp(p.foreR, 0.08, reach) };
  } else {
    const slump = boSlumpWeight(frame);
    if (slump > 0) p = { ...p, headTilt: lerp(p.headTilt, 0.32, slump), upperL: lerp(p.upperL, 0.3, slump), upperR: lerp(p.upperR, -0.3, slump) };
    const reach = boReachWeight(frame);
    if (reach > 0) p = { ...p, upperL: lerp(p.upperL, 2.45, reach), foreL: lerp(p.foreL, 0.1, reach), upperR: lerp(p.upperR, 2.3, reach), foreR: lerp(p.foreR, 0.1, reach) };
  }
  return p;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export { idlePose, walkPose };
