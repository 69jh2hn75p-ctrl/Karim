import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Scene01Hook } from '../scenes/Scene01Hook';
import { Scene02Preparations } from '../scenes/Scene02Preparations';
import { Scene03TreeDisaster } from '../scenes/Scene03TreeDisaster';
import { Scene04Cooking } from '../scenes/Scene04Cooking';
import { Scene05CookieChaos } from '../scenes/Scene05CookieChaos';
import { Scene06MovieNight } from '../scenes/Scene06MovieNight';
import { Scene07SecretPresent } from '../scenes/Scene07SecretPresent';
import { Scene08Morning } from '../scenes/Scene08Morning';
import { Scene09Heartwarming } from '../scenes/Scene09Heartwarming';
import { Scene10Ending } from '../scenes/Scene10Ending';
import { clamp } from '../utilities/math';
import { SCREENPLAY as SP } from '../screenplay';

const SCENES: Record<string, React.FC> = {
  S01: Scene01Hook,
  S02: Scene02Preparations,
  S03: Scene03TreeDisaster,
  S04: Scene04Cooking,
  S05: Scene05CookieChaos,
  S06: Scene06MovieNight,
  S07: Scene07SecretPresent,
  S08: Scene08Morning,
  S09: Scene09Heartwarming,
  S10: Scene10Ending,
};

const FPS = 24;
const TOTAL = Math.round(SP.durationSeconds * FPS);



/** Background music: fades in and out and dips under the dialogue. */
const musicVolume = (f: number): number => {
  const intro = clamp(f / (2 * FPS), 0, 1);
  const outro = clamp((TOTAL - f) / (3 * FPS), 0, 1);
  const talking = SP.scenes.some((s) => s.lines.some((l) => f >= Math.round(l.start * FPS) && f < Math.round((l.start + 2.2) * FPS)));
  return 0.22 * intro * outro * (talking ? 0.55 : 1);
};

/** The whole film: each scene placed at its screenplay time, with the music bed underneath. */
export const ChristmasFilm: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    {SP.scenes.map((s) => {
      const Scene = SCENES[s.id];
      if (!Scene) return null;
      return (
        <Sequence key={s.id} from={Math.round(s.from * FPS)} durationInFrames={Math.round((s.to - s.from) * FPS)}>
          <Scene />
        </Sequence>
      );
    })}
    <Audio src={staticFile('christmas/music/bed.wav')} volume={musicVolume} />
  </AbsoluteFill>
);
