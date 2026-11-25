import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { LivingRoom } from '../backgrounds/LivingRoom';
import { ChristmasTree } from '../props/ChristmasTree';
import { GiftBox } from '../props/Props';
import { HOLD, idle, fall, sneak, lookAround, point, mixPose } from '../animations/poses';
import { track, smoothstep } from '../utilities/math';

/** Tree tip over scene-local seconds: it falls, gets stood up, falls again, and is finally up. */
const tip = (t: number): number =>
  track(t, [0, 3, 6, 9, 13, 16, 20, 25, 28, 31, 34, 40, 45], [0, 0.12, 0.2, 0.25, 1.35, 0, 0, 0.18, 0.3, 1.4, 0, 0, 0]);

/** Scene 3: Frank assembles the tree and it keeps falling. Wide shots, quick cuts to each fall. */
const def: SceneDef = {
  id: 'S03',
  camera: [
    { t: 0, x: 1000, y: 540, zoom: 0.95 },
    { t: 12, x: 1100, y: 500, zoom: 1.05 },
    { t: 17, x: 1000, y: 540, zoom: 0.95 },
    { t: 30, x: 1120, y: 500, zoom: 1.1 },
    { t: 45, x: 1000, y: 540, zoom: 0.95 },
  ],
  shakes: [
    { t: 13, duration: 0.5, amount: 10 },
    { t: 31, duration: 0.5, amount: 10 },
  ],
  background: (t, camX) => <LivingRoom frame={Math.round(t * 24)} t={t} camX={camX} />,
  world: (t) => (
    <g>
      <ChristmasTree x={1100} baseY={900} height={560} tip={tip(t)} starOff={t > 13 && t < 16 ? 0.6 : 0} frame={Math.round(t * 24)} />
      <GiftBox x={1500} y={900} w={80} h={60} color="#c62828" />
      <GiftBox x={1600} y={900} w={60} h={44} color="#2e7d4f" />
    </g>
  ),
  actors: [
    {
      id: 'frank',
      x: () => 980,
      pose: (t) => {
        if ((t > 13 && t < 16) || (t > 31 && t < 34)) return fall(t);
        return mixPose(idle(t, 1), HOLD, smoothstep((t - 2) / 1.2));
      },
      emotion: (t) => (t < 3 ? 'excited' : (t > 13 && t < 16) || (t > 31 && t < 34) ? 'fear' : 'confused'),
    },
    {
      id: 'ben',
      x: () => 640,
      pose: (t) => mixPose(lookAround(t, 0), point(t), (t > 4 && t < 11 ? 1 : 0) * smoothstep(Math.min(1, (t - 4) / 0.6))),
      emotion: (t) => (t < 26 ? 'suspicious' : 'disappointed'),
    },
    {
      id: 'max',
      x: (t) => track(t, [14, 26], [1420, 1330]),
      facing: (t) => (t > 26 ? 1 : -1),
      pose: (t) => (t > 14 && t < 26 ? sneak(t) : t >= 26 && t < 30 ? HOLD : idle(t, 2)),
      emotion: (t) => (t < 14 ? 'suspicious' : t < 26 ? 'suspicious' : 'laughing'),
    },
  ],
};

export const Scene03TreeDisaster: React.FC = () => <SceneRenderer def={def} />;
