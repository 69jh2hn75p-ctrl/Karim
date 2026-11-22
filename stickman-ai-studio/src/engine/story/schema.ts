/**
 * Screenplay data model and validator. A screenplay is the authored source for
 * scenes, shots and dialogue. The renderer still reads src/engine/timeline.ts;
 * scripts/check-story.ts keeps the two in agreement.
 */
import { ROSTER } from '../../characters/roster';
import type { CharacterId } from '../timeline';

export type ShotSize = 'wide' | 'medium' | 'close';
export const SHOT_SIZES: readonly ShotSize[] = ['wide', 'medium', 'close'];

export interface ScreenplayCharacter {
  id: CharacterId;
  name: string;
  role: string;
  personality: string;
}

export interface ScreenplayShot {
  id: string;
  from: number;
  to: number;
  size: ShotSize;
  camera: string;
  action: string;
}

export interface ScreenplayDialogue {
  id: string;
  speaker: CharacterId;
  text: string;
  startFrame: number;
}

export interface ScreenplayScene {
  id: string;
  title: string;
  location: string;
  from: number;
  to: number;
  summary: string;
  beats: string[];
  shots: ScreenplayShot[];
  dialogue: ScreenplayDialogue[];
}

export interface Screenplay {
  title: string;
  logline: string;
  synopsis: string;
  conflict: string;
  language: 'en' | 'ru';
  durationSeconds: number;
  fps: number;
  characters: ScreenplayCharacter[];
  scenes: ScreenplayScene[];
}

/** Returns a list of human-readable problems. An empty list means the screenplay is valid. */
export function validateScreenplay(sp: Screenplay): string[] {
  const errors: string[] = [];
  const need = (ok: boolean, msg: string) => {
    if (!ok) errors.push(msg);
  };

  for (const [key, value] of Object.entries({ title: sp.title, logline: sp.logline, synopsis: sp.synopsis, conflict: sp.conflict })) {
    need(typeof value === 'string' && value.trim().length > 0, `${key} is empty`);
  }
  need(sp.language === 'en' || sp.language === 'ru', `language must be "en" or "ru", got "${sp.language}"`);
  need(sp.fps === 30, `the MVP renders at 30 fps, got ${sp.fps}`);
  const total = Math.round(sp.durationSeconds * sp.fps);
  need(Number.isFinite(total) && total > 0, 'durationSeconds must be positive');

  const rig = Object.keys(ROSTER);
  const characterIds = new Set<string>();
  for (const c of sp.characters) {
    need(rig.includes(c.id), `character "${c.id}" has no rig in the roster (available: ${rig.join(', ')})`);
    need(!characterIds.has(c.id), `character "${c.id}" is listed twice`);
    characterIds.add(c.id);
  }

  need(sp.scenes.length > 0, 'the screenplay has no scenes');
  const sceneIds = new Set<string>();
  let cursor = 0;
  for (const scene of sp.scenes) {
    need(!sceneIds.has(scene.id), `scene id "${scene.id}" is used twice`);
    sceneIds.add(scene.id);
    need(scene.from === cursor, `scene ${scene.id} starts at frame ${scene.from}, expected ${cursor}`);
    need(scene.to > scene.from, `scene ${scene.id} has zero or negative length`);

    let shotCursor = scene.from;
    for (const shot of scene.shots) {
      need(shot.from === shotCursor, `shot ${shot.id} starts at frame ${shot.from}, expected ${shotCursor}`);
      need(shot.to > shot.from, `shot ${shot.id} has zero or negative length`);
      need(SHOT_SIZES.includes(shot.size), `shot ${shot.id} has unknown size "${shot.size}"`);
      shotCursor = shot.to;
    }
    need(
      scene.shots.length > 0 && shotCursor === scene.to,
      `shots of scene ${scene.id} do not cover it (shots end at ${shotCursor}, scene ends at ${scene.to})`,
    );

    for (const d of scene.dialogue) {
      need(characterIds.has(d.speaker), `line ${d.id} is spoken by "${d.speaker}", who is not in characters`);
      need(d.text.trim().length > 0, `line ${d.id} is empty`);
      need(d.startFrame >= scene.from && d.startFrame < scene.to, `line ${d.id} starts at ${d.startFrame}, outside scene ${scene.id}`);
    }
    cursor = scene.to;
  }
  need(cursor === total, `scenes end at frame ${cursor}, expected ${total} (${sp.durationSeconds} s at ${sp.fps} fps)`);
  return errors;
}
