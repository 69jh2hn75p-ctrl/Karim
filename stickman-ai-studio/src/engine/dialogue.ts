/** Shape of src/generated/dialogue-timing.json, written by scripts/build-audio.ts. */
import type { CharacterId } from './timeline';

export interface DialogueLine {
  id: string;
  speaker: CharacterId;
  text: string;
  startFrame: number;
  durationFrames: number;
  audioFile: string;
  /** One mouth-openness value (0..1) per video frame, starting at the line's first frame. */
  envelope: number[];
}

export interface DialogueTiming {
  fps: number;
  sampleRate: number;
  tts: string;
  lines: DialogueLine[];
}

/** Returns the line that is audible at `frame`, if any. */
export function activeLine(lines: readonly DialogueLine[], frame: number): DialogueLine | undefined {
  return lines.find((l) => frame >= l.startFrame && frame < l.startFrame + l.durationFrames);
}

/** Mouth openness for a character at `frame`, from the line envelope (0 when silent). */
export function mouthFor(lines: readonly DialogueLine[], speaker: CharacterId, frame: number): number {
  for (const line of lines) {
    if (line.speaker !== speaker) continue;
    const idx = frame - line.startFrame;
    if (idx >= 0 && idx < line.envelope.length) {
      return Math.min(1, line.envelope[idx] * 1.7);
    }
  }
  return 0;
}
