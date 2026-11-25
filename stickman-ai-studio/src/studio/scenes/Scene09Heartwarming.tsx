import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { DiningRoom } from '../backgrounds/DiningRoom';
import { Ham, Candle, Bowl } from '../props/Props';
import { SIT, HOLD, idle, cheer, mixPose } from '../animations/poses';
import { smoothstep } from '../utilities/math';

const SEAT_DROP = -20;

/** Scene 9: the family at the dining table. Warm candlelight, a toast, and a quiet moment for Ben. */
const def: SceneDef = {
  id: 'S09',
  camera: [
    { t: 0, x: 950, y: 540, zoom: 0.95 },
    { t: 20, x: 900, y: 540, zoom: 1.05 },
    { t: 35, x: 800, y: 540, zoom: 1.2 },
  ],
  background: (t, camX) => <DiningRoom t={t} frame={Math.round(t * 24)} camX={camX} />,
  world: (t) => (
    <g>
      <rect x={260} y={740} width={1380} height={26} rx={6} fill="#ffffff" stroke="#9e9e9e" strokeWidth={2} />
      <rect x={300} y={766} width={22} height={134} fill="#6d4c35" />
      <rect x={1560} y={766} width={22} height={134} fill="#6d4c35" />
      <Ham x={950} y={732} />
      <Candle x={600} y={740} h={90} t={t} phase={0} />
      <Candle x={1300} y={740} h={90} t={t} phase={2} />
      <Bowl x={760} y={728} w={100} fill="#ffe0b2" />
      <Bowl x={1140} y={728} w={100} fill="#c8e6c9" />
    </g>
  ),
  actors: [
    {
      id: 'ben',
      x: () => 520,
      pose: (t) => mixPose(SIT, idle(t, 0), 0.05),
      drop: () => SEAT_DROP,
      emotion: (t) => (t > 26 ? 'laughing' : 'happy'),
    },
    {
      id: 'frank',
      x: () => 760,
      pose: (t) => mixPose(idle(t, 1), HOLD, smoothstep((t - 4) / 1) * (1 - smoothstep((t - 12) / 1))),
      emotion: (t) => (t > 4 && t < 13 ? 'excited' : 'happy'),
    },
    {
      id: 'diane',
      x: () => 1080,
      pose: (t) => mixPose(SIT, idle(t, 3), 0.05),
      drop: () => SEAT_DROP,
      emotion: () => 'happy',
    },
    {
      id: 'max',
      x: () => 1340,
      pose: (t) => mixPose(SIT, cheer(t), smoothstep((t - 14) / 1.2) * 0.4),
      drop: () => SEAT_DROP,
      emotion: (t) => (t > 14 ? 'laughing' : 'excited'),
    },
  ],
};

export const Scene09Heartwarming: React.FC = () => <SceneRenderer def={def} />;
