import React from 'react';
import { Composition } from 'remotion';
import { Episode001 } from './episode/Episode001';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './engine/timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Episode001"
    component={Episode001}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
