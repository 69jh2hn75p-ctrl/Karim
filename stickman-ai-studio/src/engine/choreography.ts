/**
 * Who moves where, and when. Pure functions of the frame number.
 * Walk weight and gesture weights are eased so nothing snaps.
 */
import {
  BO_SURPRISE_SPAN,
  CharacterId,
  DOOR_OPEN_SPAN,
  LAB_LIGHT_SPAN,
  PANEL_GLOW_SPAN,
  PATH_KEYS,
  REN_POINT_SPAN,
  WALK_PERIOD_FRAMES,
  WALK_SPANS,
} from './timeline';
import { clamp, piecewise, smooth } from './math';

export const CHARACTER_IDS: readonly CharacterId[] = ['ren', 'bo'];

export function charX(id: CharacterId, frame: number): number {
  const k = PATH_KEYS[id];
  return piecewise(frame, k.frames, k.xs);
}

/** 0..1: how much the legs are in a walk cycle. Fades in over 8 frames, out over 12. */
export function walkWeight(id: CharacterId, frame: number): number {
  let w = 0;
  for (const s of WALK_SPANS[id]) {
    if (frame < s.from || frame > s.to) continue;
    const fadeIn = clamp((frame - s.from + 1) / 8, 0, 1);
    const fadeOut = clamp((s.to - frame) / 12, 0, 1);
    w = Math.max(w, Math.min(fadeIn, fadeOut));
  }
  return w;
}

/** Global walk phase. One stride = WALK_PERIOD_FRAMES. */
export function walkPhase(frame: number): number {
  return (frame * 2 * Math.PI) / WALK_PERIOD_FRAMES;
}

export interface Footstrike {
  frame: number;
  id: CharacterId;
}

/**
 * Foot-plant frames. A plant happens each time the walk phase crosses an extreme
 * (phase = pi/2 + k*pi), so the sound lines up with the leg at full stretch.
 */
export function footstrikes(): Footstrike[] {
  const index = (f: number) => Math.floor((2 * f) / WALK_PERIOD_FRAMES - 0.5);
  const out: Footstrike[] = [];
  for (const id of CHARACTER_IDS) {
    for (const s of WALK_SPANS[id]) {
      for (let f = s.from + 1; f <= s.to - 4; f++) {
        if (index(f) !== index(f - 1) && walkWeight(id, f) >= 0.6) out.push({ frame: f, id });
      }
    }
  }
  return out.sort((a, b) => a.frame - b.frame);
}

/** Ren points at the glowing panel with his right arm. */
export function pointWeight(frame: number): number {
  const { from, to } = REN_POINT_SPAN;
  return smooth(frame, from, from + 15) * (1 - smooth(frame, to - 14, to));
}

/** Bo throws both arms up when the panel lights. */
export function surpriseWeight(frame: number): number {
  const { from, to } = BO_SURPRISE_SPAN;
  return smooth(frame, from, from + 14) * (1 - smooth(frame, to - 12, to));
}

export const panelGlow = (frame: number): number =>
  smooth(frame, PANEL_GLOW_SPAN.from, PANEL_GLOW_SPAN.to);

export const doorOpen = (frame: number): number => smooth(frame, DOOR_OPEN_SPAN.from, DOOR_OPEN_SPAN.to);

export const labLight = (frame: number): number => smooth(frame, LAB_LIGHT_SPAN.from, LAB_LIGHT_SPAN.to);
