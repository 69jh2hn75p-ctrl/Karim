import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { SCREENPLAY } from '../screenplay';
import timingJson from '../generated/christmas-timing.json';

interface TimingLine {
  id: string;
  startFrame: number;
  durationFrames: number;
  audioFile: string;
}

const TIMING_LINES = ((timingJson as { lines?: TimingLine[] }).lines ?? []) as TimingLine[];

/**
 * Plays every dialogue line of one scene at its place in the scene. Lines are authored in film
 * seconds; the Sequence offsets them to the scene's own local frames.
 */
export const SceneDialogue: React.FC<{ sceneId: string; fps?: number }> = ({ sceneId, fps = 24 }) => {
  const scene = SCREENPLAY.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;
  return (
    <>
      {scene.lines.map((line) => {
        const timed = TIMING_LINES.find((t) => t.id === line.id);
        if (!timed) return null;
        const localFrom = Math.round((line.start - scene.from) * fps);
        return (
          <Sequence key={line.id} from={localFrom} durationInFrames={timed.durationFrames + 6}>
            <Audio src={staticFile(`christmas/audio/${timed.audioFile}`)} />
          </Sequence>
        );
      })}
    </>
  );
};
