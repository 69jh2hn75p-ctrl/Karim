import React from 'react';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { LivingRoom } from '../backgrounds/LivingRoom';
import { ShoppingBag, GiftBox } from '../props/Props';
import { HOLD, idle, cheer, dance, lookAround, walk, mixPose } from '../animations/poses';
import { smoothstep } from '../utilities/math';

/** Scene 2: Christmas preparations. Medium two-shot, then over-the-shoulder on Ben. */
const def: SceneDef = {
  id: 'S02',
  camera: [
    { t: 0, x: 780, y: 540, zoom: 1.05 },
    { t: 20, x: 840, y: 540, zoom: 1.1 },
    { t: 30, x: 640, y: 540, zoom: 1.28 },
    { t: 45, x: 640, y: 540, zoom: 1.3 },
  ],
  background: (t, camX) => <LivingRoom frame={Math.round(t * 24)} t={t} camX={camX} />,
  world: () => (
    <g>
      <ShoppingBag x={1330} y={900} color="#c62828" />
      <ShoppingBag x={1450} y={900} color="#2e7d4f" scale={0.9} />
      <GiftBox x={1560} y={900} w={90} h={70} color="#1565c0" />
    </g>
  ),
  actors: [
    {
      id: 'ben',
      x: () => 560,
      pose: (t) => mixPose(idle(t, 0), lookAround(t, 1), smoothstep((t - 30) / 2)),
      emotion: (t) => (t < 30 ? 'happy' : 'neutral'),
    },
    {
      id: 'diane',
      x: () => 1060,
      facing: () => -1,
      pose: (t) => mixPose(idle(t, 3), HOLD, smoothstep((t - 2) / 1.5)),
      emotion: (t) => (t < 8 ? 'neutral' : t < 14 ? 'suspicious' : 'neutral'),
    },
    {
      id: 'frank',
      x: () => 1230,
      facing: () => -1,
      pose: (t) => mixPose(idle(t, 1), cheer(t), Math.max(0, 1 - Math.abs(t - 9) / 1.4)),
      emotion: (t) => (t < 9 ? 'happy' : 'excited'),
    },
    {
      id: 'max',
      x: (t) => 1420 - 40 * smoothstep((t - 26) / 2),
      facing: () => -1,
      pose: (t) => (t > 38 && t < 44 ? dance(t) : walk(t, 0.8, 0.3)),
      emotion: (t) => (t < 18 ? 'excited' : t < 28 ? 'disappointed' : 'excited'),
      opacity: () => 1,
    },
  ],
  overlay: (t) => <div style={{ position: 'absolute', inset: 0, background: `rgba(255,190,120,${0.04 + 0.02 * Math.sin(t)})`, pointerEvents: 'none' }} />,
};

export const Scene02Preparations: React.FC = () => <SceneRenderer def={def} />;

