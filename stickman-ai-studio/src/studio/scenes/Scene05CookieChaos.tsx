import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { Kitchen } from '../backgrounds/Kitchen';
import { Cookie } from '../props/Props';
import { Flour } from '../effects/Effects';
import { HOLD, idle, cheer, STARTLE, mixPose } from '../animations/poses';
import { smoothstep } from '../utilities/math';

/** Scene 5: cookie decorating. Close-ups on hands and faces, a flour burst, quick reaction cuts. */
const def: SceneDef = {
  id: 'S05',
  camera: [
    { t: 0, x: 1000, y: 620, zoom: 1.4 },
    { t: 7, x: 1060, y: 620, zoom: 1.6 },
    { t: 12, x: 600, y: 600, zoom: 1.35 },
    { t: 20, x: 900, y: 600, zoom: 1.25 },
    { t: 40, x: 900, y: 560, zoom: 1.1 },
  ],
  shakes: [{ t: 7, duration: 0.4, amount: 8 }],
  background: (t, camX) => <Kitchen t={t} frame={Math.round(t * 24)} camX={camX} />,
  world: (t) => (
    <g>
      <Cookie x={1000} y={712} icing="#ff80ab" />
      <Cookie x={1060} y={712} icing="#81d4fa" />
      <Cookie x={1120} y={712} icing="#fff176" />
      <Cookie x={1180} y={712} icing="#a5d6a7" broken />
      <Cookie x={1240} y={712} icing="#ffab91" />
      <Flour x={1120} y={600} t={t} start={7} />
    </g>
  ),
  actors: [
    {
      id: 'max',
      x: () => 600,
      pose: (t) => mixPose(idle(t, 2), HOLD, 0.9),
      emotion: (t) => (t > 33 ? 'laughing' : 'excited'),
    },
    {
      id: 'ben',
      x: () => 470,
      pose: (t) => idle(t, 0),
      emotion: (t) => (t > 18 && t < 24 ? 'embarrassed' : 'neutral'),
    },
    {
      id: 'frank',
      x: () => 1130,
      facing: () => -1,
      pose: (t) => (t > 7 && t < 10 ? STARTLE : mixPose(idle(t, 1), HOLD, 0.9)),
      emotion: (t) => (t < 6 ? 'confused' : t < 11 ? 'fear' : 'disappointed'),
    },
    {
      id: 'diane',
      x: () => 1500,
      facing: () => -1,
      pose: (t) => mixPose(idle(t, 3), cheer(t), 0),
      emotion: (t) => (t > 9 && t < 13 ? 'angry' : 'neutral'),
      opacity: (t) => smoothstep((t - 8.5) / 0.4),
    },
  ],
};

export const Scene05CookieChaos: React.FC = () => <SceneRenderer def={def} />;
