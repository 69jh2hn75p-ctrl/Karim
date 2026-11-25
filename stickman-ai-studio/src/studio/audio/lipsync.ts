/**
 * Lip-sync source. The generated timing file (src/studio/generated/christmas-timing.json) holds one
 * mouth-openness value per video frame for every spoken line. Until real audio exists, this falls
 * back to a clearly labelled placeholder rhythm so mouths still move while the voices are pending.
 */
import timing from '../generated/christmas-timing.json';
import type { CharacterId } from '../../engine/timeline';

interface TimingLine {
  id: string;
  speaker: string;
  startFrame: number;
  durationFrames: number;
  envelope: number[];
}

const LINES = ((timing as { lines?: TimingLine[] }).lines ?? []) as TimingLine[];
const FPS = 24;

/**
 * Mouth openness for `speaker` at film time `filmT` (seconds). `localT` is only used by the
 * placeholder rhythm, so every scene keeps its own motion.
 */
export function envelopeAt(speaker: CharacterId | string, filmT: number, localT: number): number {
  const frame = Math.round(filmT * FPS);
  for (const line of LINES) {
    if (line.speaker !== speaker) continue;
    const idx = frame - line.startFrame;
    if (idx >= 0 && idx < line.envelope.length) return line.envelope[idx];
  }
  return placeholderRhythm(speaker, localT);
}

/** Placeholder only: used when no timing file has been generated for the current audio. */
function placeholderRhythm(_speaker: string, _localT: number): number {
  return 0;
}

export const hasGeneratedTiming = LINES.length > 0;
