import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { Hallway } from '../backgrounds/Hallway';
import { GiftBox } from '../props/Props';
import { HOLD, idle, sneak, run, HUG, STARTLE, walk, mixPose } from '../animations/poses';
import { track, smoothstep } from '../utilities/math';

/** Scene 7: Max finds his present and runs. A tracking camera follows the chase down the hall. */
const def: SceneDef = {
  id: 'S07',
  camera: [
    { t: 0, x: 600, y: 540, zoom: 1.1 },
    { t: 6, x: 780, y: 540, zoom: 1.15 },
    { t: 12, x: 1200, y: 540, zoom: 1.0 },
    { t: 20, x: 1600, y: 540, zoom: 0.98 },
    { t: 30, x: 2050, y: 540, zoom: 1.0 },
    { t: 40, x: 2200, y: 540, zoom: 1.08 },
    { t: 45, x: 2200, y: 540, zoom: 1.12 },
  ],
  shakes: [{ t: 12, duration: 0.3, amount: 6 }],
  background: (_t, camX) => <Hallway camX={camX} />,
  world: () => (
    <g>
      <GiftBox x={560} y={900} w={90} h={66} color="#2b8f96" tag="MAX" />
    </g>
  ),
  actors: [
    {
      id: 'max',
      x: (t) => (t < 5 ? track(t, [0, 5], [480, 640]) : t < 8 ? 640 : track(t, [8, 38], [640, 2150])),
      pose: (t) => {
        if (t < 5) return sneak(t);
        if (t < 8) return mixPose(idle(t, 2), STARTLE, 0.6);
        if (t < 38) return run(t, 1.1);
        return HOLD;
      },
      emotion: (t) => (t < 8 ? 'suspicious' : t < 38 ? 'excited' : 'laughing'),
    },
    {
      id: 'ben',
      x: (t) => track(t, [0, 6, 20, 40], [700, 800, 1150, 1600]),
      pose: (t) => (t > 6 && t < 9 ? STARTLE : walk(t, 0.8, 0.4)),
      emotion: (t) => (t > 6 && t < 10 ? 'fear' : t < 38 ? 'confused' : 'laughing'),
    },
    {
      id: 'frank',
      x: (t) => track(t, [9, 40], [980, 2050]),
      pose: (t) => (t > 9 && t < 38 ? run(t, 0.85) : idle(t, 1)),
      emotion: (t) => (t < 15 ? 'angry' : 'excited'),
    },
    {
      id: 'diane',
      x: () => 2270,
      facing: () => -1,
      pose: (t) => mixPose(idle(t, 3), HUG, smoothstep((t - 36) / 1.5)),
      emotion: (t) => (t < 33 ? 'angry' : t < 38 ? 'angry' : 'happy'),
    },
  ],
};

export const Scene07SecretPresent: React.FC = () => <SceneRenderer def={def} />;
