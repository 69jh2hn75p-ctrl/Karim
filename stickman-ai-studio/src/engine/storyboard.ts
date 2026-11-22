/** Storyboard rows derived from a screenplay, and a check against the render timeline. */
import { DIALOGUE, SCENES } from './timeline';
import type { Screenplay, ShotSize } from './story/schema';

export interface StoryboardRow {
  shotId: string;
  sceneId: string;
  sceneTitle: string;
  from: number;
  to: number;
  seconds: number;
  size: ShotSize;
  camera: string;
  action: string;
  dialogueIds: string[];
}

export function buildStoryboard(sp: Screenplay): StoryboardRow[] {
  const rows: StoryboardRow[] = [];
  for (const scene of sp.scenes) {
    for (const shot of scene.shots) {
      rows.push({
        shotId: shot.id,
        sceneId: scene.id,
        sceneTitle: scene.title,
        from: shot.from,
        to: shot.to,
        seconds: (shot.to - shot.from) / sp.fps,
        size: shot.size,
        camera: shot.camera,
        action: shot.action,
        dialogueIds: scene.dialogue
          .filter((d) => d.startFrame >= shot.from && d.startFrame < shot.to)
          .map((d) => d.id),
      });
    }
  }
  return rows;
}

/**
 * The renderer reads SCENES and DIALOGUE from timeline.ts. This reports every place
 * where the screenplay would render differently, so it is not silently ignored.
 */
export function diffWithTimeline(sp: Screenplay): string[] {
  const errors: string[] = [];
  if (sp.scenes.length !== SCENES.length) {
    errors.push(`screenplay has ${sp.scenes.length} scenes, the render timeline has ${SCENES.length}`);
  }
  sp.scenes.forEach((scene, i) => {
    const t = SCENES[i];
    if (t && (scene.from !== t.from || scene.to !== t.to)) {
      errors.push(`scene ${scene.id} spans ${scene.from}-${scene.to}, timeline scene ${t.id} spans ${t.from}-${t.to}`);
    }
  });

  const lines = sp.scenes.flatMap((s) => s.dialogue);
  if (lines.length !== DIALOGUE.length) {
    errors.push(`screenplay has ${lines.length} lines, the render timeline has ${DIALOGUE.length}`);
  }
  DIALOGUE.forEach((d, i) => {
    const l = lines[i];
    if (!l) return;
    if (l.id !== d.id || l.speaker !== d.speaker || l.text !== d.text || l.startFrame !== d.startFrame) {
      errors.push(`line ${d.id} differs from the render timeline (speaker, text or start frame)`);
    }
  });
  return errors;
}

export function formatStoryboard(rows: StoryboardRow[]): string {
  const header = ['SHOT', 'SCENE', 'FRAMES', 'SEC', 'SIZE', 'LINES', 'CAMERA / ACTION'];
  const body = rows.map((r) => [
    r.shotId,
    r.sceneId,
    `${r.from}-${r.to}`,
    r.seconds.toFixed(1),
    r.size,
    r.dialogueIds.join(',') || '-',
    `${r.camera} | ${r.action}`,
  ]);
  const widths = header.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length)));
  const line = (cols: string[]) => cols.map((c, i) => c.padEnd(widths[i])).join('  ');
  return [line(header), ...body.map(line)].join('\n');
}
