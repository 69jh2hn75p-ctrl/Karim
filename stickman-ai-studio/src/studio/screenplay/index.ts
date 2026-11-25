import raw from './christmas-at-our-house.json';
import timingJson from '../generated/christmas-timing.json';

/** The screenplay as typed data. Scenes, lines and timings come from the JSON file. */
export interface ScreenplayLine {
  id: string;
  speaker: 'ben' | 'frank' | 'diane' | 'max';
  start: number;
  text: string;
  vo?: boolean;
  offscreen?: boolean;
}

export interface ScreenplayScene {
  id: string;
  title: string;
  from: number;
  to: number;
  location: string;
  camera: string;
  beats: string[];
  lines: ScreenplayLine[];
}

export interface Screenplay {
  title: string;
  subtitle: string;
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  scenes: ScreenplayScene[];
}

export const SCREENPLAY = raw as unknown as Screenplay;

/** Estimated on-screen time for a line: about 0.36 s per word, clamped to a readable range. */
export function estimatedLineSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.min(4.5, Math.max(1.2, 0.36 * words + 0.5));
}

/**
 * Caption to show at scene-local time t (seconds). The scene's start is taken from its `from`
 * value, so lines are authored in absolute film time and converted here.
 */
export function captionFor(sp: Screenplay, sceneId: string, localT: number): { text: string; speaker: string; vo: boolean } | null {
  const scene = sp.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;
  const abs = scene.from + localT;
  for (const line of scene.lines) {
    const timed = ((timingJson as { lines?: { id: string; durationFrames: number }[] }).lines ?? []).find((t) => t.id === line.id);
    const end = line.start + (timed ? timed.durationFrames / 24 + 0.25 : estimatedLineSeconds(line.text));
    if (abs >= line.start && abs < end) {
      const name = sp.scenes.length && line.speaker ? line.speaker.charAt(0).toUpperCase() + line.speaker.slice(1) : '';
      return { text: line.text, speaker: line.offscreen ? `${name} (off-screen)` : name, vo: !!line.vo };
    }
  }
  return null;
}
