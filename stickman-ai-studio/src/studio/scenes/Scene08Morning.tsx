import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { LivingRoom } from '../backgrounds/LivingRoom';
import { ChristmasTree } from '../props/ChristmasTree';
import { GiftBox, DinoToy, Scarf } from '../props/Props';
import { HOLD, idle, cheer, dance, lookAround, mixPose } from '../animations/poses';
import { smoothstep } from '../utilities/math';

/** Scene 8: Christmas morning. Warm light from the window, presents under the tree, a scarf for Ben. */
const def: SceneDef = {
  id: 'S08',
  camera: [
    { t: 0, x: 980, y: 540, zoom: 0.95 },
    { t: 20, x: 1100, y: 540, zoom: 1.1 },
    { t: 34, x: 600, y: 540, zoom: 1.3 },
    { t: 50, x: 600, y: 540, zoom: 1.35 },
  ],
  background: (t, camX) => <LivingRoom frame={Math.round(t * 24)} t={t} camX={camX} warmth={1.1} />,
  world: (t) => (
    <g>
      <ChristmasTree x={1520} baseY={900} height={540} frame={Math.round(t * 24)} />
      <GiftBox x={1380} y={900} w={90} h={70} color="#c62828" />
      <GiftBox x={1640} y={900} w={80} h={60} color="#1565c0" />
      <GiftBox x={1460} y={900} w={60} h={44} color="#ffb300" />
      <DinoToy x={1100} y={900} scale={1} />
      {t > 34 && <Scarf x={700} y={560} length={180} />}
    </g>
  ),
  overlay: (t) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 90% 10%, rgba(255,214,140,0.28), rgba(255,214,140,0) 55%)',
        opacity: 0.6 + 0.2 * Math.sin(t * 0.6),
        pointerEvents: 'none',
      }}
    />
  ),
  actors: [
    {
      id: 'max',
      x: () => 1080,
      pose: (t) => (t < 12 ? cheer(t) : dance(t)),
      emotion: (t) => (t < 2 ? 'surprise' : t < 14 ? 'excited' : 'laughing'),
    },
    {
      id: 'frank',
      x: () => 880,
      pose: (t) => mixPose(idle(t, 1), HOLD, 0.9),
      emotion: (t) => (t > 24 && t < 27 ? 'laughing' : 'happy'),
    },
    {
      id: 'diane',
      x: () => 1260,
      facing: () => -1,
      pose: (t) => mixPose(idle(t, 3), lookAround(t, 5), 0.6),
      emotion: () => 'happy',
    },
    {
      id: 'ben',
      x: () => 640,
      pose: (t) => mixPose(idle(t, 0), HOLD, smoothstep((t - 34) / 1.5)),
      emotion: (t) => (t > 34 ? 'happy' : 'neutral'),
    },
  ],
};

export const Scene08Morning: React.FC = () => <SceneRenderer def={def} />;
