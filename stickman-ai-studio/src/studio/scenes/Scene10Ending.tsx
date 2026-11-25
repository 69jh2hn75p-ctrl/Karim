import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneRenderer, type SceneDef } from './SceneRenderer';
import { LivingRoom } from '../backgrounds/LivingRoom';
import { ChristmasTree } from '../props/ChristmasTree';
import { GiftBox } from '../props/Props';
import { brace, cheer, HOLD, idle, STARTLE, wave, mixPose } from '../animations/poses';
import { track, smoothstep } from '../utilities/math';

/** The family freezes for a few seconds while the tree starts to go. Freezing holds the pose at t = 4. */
const freeze = (t: number): number => (t > 4 && t < 9 ? 4 : t);
const treeTip = (t: number): number => track(t, [0, 3, 4.5, 8, 9.5, 15], [0, 0, 0.2, 0.2, 1.5, 1.5]);

/** Scene 10: the ending. The tree starts to go, everyone freezes, Ben looks at the camera, the tree falls. */
const def: SceneDef = {
  id: 'S10',
  camera: [
    { t: 0, x: 900, y: 540, zoom: 1.05 },
    { t: 3, x: 900, y: 540, zoom: 1.05 },
    { t: 9, x: 1100, y: 540, zoom: 1.1 },
    { t: 13, x: 980, y: 540, zoom: 0.92 },
    { t: 15, x: 980, y: 540, zoom: 0.92 },
  ],
  shakes: [{ t: 9.5, duration: 0.8, amount: 14 }],
  background: (t, camX) => <LivingRoom frame={Math.round(t * 24)} t={t} camX={camX} />,
  world: (t) => (
    <g>
      <ChristmasTree x={1100} baseY={900} height={560} tip={treeTip(t)} starOff={t > 9 ? 0.5 : 0} frame={Math.round(t * 24)} />
      <GiftBox x={1500} y={900} w={80} h={60} color="#c62828" />
      {t > 9.5 && <g opacity={Math.max(0, 1 - (t - 9.5) / 1.2)}><circle cx={1180} cy={860} r={120} fill="#ffffff" opacity={0.12} /></g>}
    </g>
  ),
  overlay: (t) =>
    t > 12 ? (
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-end', padding: 60, pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(8,10,18,0.82)',
            color: '#f7f2e6',
            borderRadius: 16,
            padding: '22px 30px',
            fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
            maxWidth: 620,
            opacity: smoothstep((t - 12) / 0.8),
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, color: '#f4c430' }}>Thanks for watching!</div>
          <div style={{ fontSize: 24, marginTop: 6 }}>Subscribe for more family chaos, every Christmas.</div>
        </div>
      </AbsoluteFill>
    ) : null,
  actors: [
    {
      id: 'frank',
      x: () => 1250,
      facing: () => -1,
      pose: (t) => (t > 9 ? STARTLE : brace(freeze(t))),
      emotion: (t) => (t < 4 ? 'confused' : t < 9 ? 'suspicious' : 'surprise'),
    },
    {
      id: 'ben',
      x: () => 520,
      pose: (t) => (t > 12 ? wave(t) : idle(freeze(t), 0)),
      emotion: (t) => (t < 8 ? 'neutral' : t < 12 ? 'suspicious' : 'laughing'),
    },
    {
      id: 'diane',
      x: () => 1700,
      facing: () => -1,
      pose: (t) => mixPose(idle(freeze(t), 3), HOLD, 0.2),
      emotion: (t) => (t < 9 ? 'angry' : 'disappointed'),
    },
    {
      id: 'max',
      x: () => 330,
      pose: (t) => (t > 11 ? cheer(t) : idle(freeze(t), 2)),
      emotion: (t) => (t < 9 ? 'excited' : t < 12 ? 'surprise' : 'laughing'),
    },
  ],
};

export const Scene10Ending: React.FC = () => <SceneRenderer def={def} />;
