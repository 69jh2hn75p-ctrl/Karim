import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { Kitchen } from '../backgrounds/Kitchen';
import { Bowl } from '../props/Props';
import { Steam } from '../effects/Effects';
import { HOLD, idle, sneak, walk, STARTLE, mixPose } from '../animations/poses';
import { smoothstep } from '../utilities/math';

/** Scene 4: Diane runs the kitchen. Frank 'helps' with the gravy. Max eyes the cookie jar. */
const def: SceneDef = {
  id: 'S04',
  camera: [
    { t: 0, x: 520, y: 540, zoom: 1.0 },
    { t: 16, x: 900, y: 540, zoom: 1.05 },
    { t: 30, x: 1150, y: 540, zoom: 1.1 },
    { t: 45, x: 800, y: 540, zoom: 1.0 },
  ],
  background: (t, camX) => <Kitchen t={t} frame={Math.round(t * 24)} camX={camX} />,
  world: (t) => (
    <g>
      <Steam x={200} y={360} t={t} count={6} height={180} />
      <Bowl x={1000} y={728} w={110} fill="#ffe0b2" />
      <Bowl x={1180} y={728} w={90} fill="#c8e6c9" />
    </g>
  ),
  actors: [
    {
      id: 'ben',
      x: () => 540,
      pose: (t) => mixPose(idle(t, 0), HOLD, (t > 27 && t < 31 ? 1 : 0) * smoothstep(Math.min(1, (t - 27) / 0.5))),
      emotion: (t) => (t > 27 && t < 31 ? 'happy' : 'neutral'),
    },
    {
      id: 'diane',
      x: () => 820,
      pose: (t) => mixPose(idle(t, 3), HOLD, 0.8),
      emotion: (t) => (t > 5 && t < 13 ? 'angry' : 'neutral'),
    },
    {
      id: 'frank',
      x: () => 1060,
      facing: () => -1,
      pose: (t) => (t > 21 && t < 24 ? STARTLE : mixPose(idle(t, 1), HOLD, 0.9)),
      emotion: (t) => (t < 6 ? 'happy' : t < 22 ? 'confused' : t < 25 ? 'fear' : 'surprise'),
    },
    {
      id: 'max',
      x: (t) => (t < 12 ? 620 : t < 22 ? 620 - 20 * smoothstep((t - 12) / 4) : 600 + 40 * smoothstep((t - 24) / 4)),
      pose: (t) => (t > 12 && t < 24 ? sneak(t) : walk(t, 0.6, 0.3)),
      emotion: (t) => (t > 31 ? 'laughing' : t > 12 ? 'suspicious' : 'excited'),
    },
  ],
};

export const Scene04Cooking: React.FC = () => <SceneRenderer def={def} />;
