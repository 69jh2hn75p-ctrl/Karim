/**
 * Keyframed camera. Keys are scene-local seconds. Values ease between keys (smoothstep),
 * so camera moves start and stop softly. Use `shake` for impacts; it is deterministic.
 */
import { clamp, smoothNoise, smoothstep } from '../utilities/math';

export interface CameraKey {
  /** Scene-local seconds. */
  t: number;
  /** World x at screen centre. */
  x: number;
  /** World y at screen centre. */
  y: number;
  /** 1 = normal, below 1 = wider, above 1 = closer. */
  zoom: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface Shake {
  /** Scene-local start time in seconds. */
  t: number;
  /** Duration in seconds. */
  duration: number;
  /** Peak amplitude in world px. */
  amount: number;
}

function sample(keys: readonly CameraKey[], t: number, pick: (k: CameraKey) => number): number {
  if (keys.length === 0) throw new Error('camera: at least one key is required');
  if (t <= keys[0].t) return pick(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1];
      const b = keys[i];
      const span = b.t - a.t;
      const u = span <= 0 ? 1 : smoothstep((t - a.t) / span);
      return pick(a) + (pick(b) - pick(a)) * u;
    }
  }
  return pick(keys[keys.length - 1]);
}

export function cameraAt(keys: readonly CameraKey[], t: number, shakes: readonly Shake[] = []): CameraState {
  let x = sample(keys, t, (k) => k.x);
  let y = sample(keys, t, (k) => k.y);
  const zoom = clamp(sample(keys, t, (k) => k.zoom), 0.3, 3);
  for (const s of shakes) {
    const local = t - s.t;
    if (local < 0 || local > s.duration) continue;
    const decay = 1 - local / s.duration;
    x += s.amount * decay * smoothNoise(local * 30, 11);
    y += s.amount * decay * smoothNoise(local * 30, 23);
  }
  return { x, y, zoom };
}

/** SVG transform that places world (x, y) at the centre of a width x height frame. */
export function cameraTransform(cam: CameraState, width: number, height: number): string {
  return `translate(${width / 2} ${height / 2}) scale(${cam.zoom.toFixed(4)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`;
}
