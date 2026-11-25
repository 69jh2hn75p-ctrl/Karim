import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { LivingRoom } from '../backgrounds/LivingRoom';
import { TV, ScreenGlow } from '../props/Props';
import { SIT, idle, lookAround, mixPose } from '../animations/poses';
import { smoothstep } from '../utilities/math';

/** Scene 6: movie night on the couch. Cozy push toward the fire; Ben drifts off, Frank gets emotional. */
const SOFA_DROP = -30;

const def: SceneDef = {
  id: 'S06',
  camera: [
    { t: 0, x: 1000, y: 540, zoom: 1.0 },
    { t: 20, x: 960, y: 540, zoom: 1.12 },
    { t: 40, x: 880, y: 540, zoom: 1.22 },
  ],
  background: (t, camX) => <LivingRoom frame={Math.round(t * 24)} t={t} camX={camX} warmth={0.9} />,
  world: (t) => (
    <g>
      <TV x={1520} y={700} t={t} on />
      <ScreenGlow x={1520} y={560} t={t} />
    </g>
  ),
  actors: [
    {
      id: 'ben',
      x: () => 1010,
      pose: () => SIT,
      drop: () => SOFA_DROP,
      emotion: (t) => (t > 15 ? 'suspicious' : 'disappointed'),
    },
    {
      id: 'frank',
      x: () => 1150,
      pose: (t) => mixPose(SIT, idle(t, 1), 0.1),
      drop: () => SOFA_DROP,
      emotion: (t) => (t > 21 && t < 27 ? 'crying' : t > 27 ? 'embarrassed' : 'happy'),
    },
    {
      id: 'diane',
      x: () => 1280,
      pose: (t) => mixPose(SIT, lookAround(t, 3), 0.2),
      drop: () => SOFA_DROP,
      emotion: () => 'happy',
    },
    {
      id: 'max',
      x: () => 860,
      pose: (t) => mixPose(idle(t, 2), lookAround(t, 4), smoothstep((t - 8) / 2)),
      emotion: (t) => (t > 13 && t < 20 ? 'confused' : 'excited'),
    },
  ],
};

export const Scene06MovieNight: React.FC = () => <SceneRenderer def={def} />;
