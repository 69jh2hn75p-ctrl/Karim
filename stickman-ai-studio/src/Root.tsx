import React from 'react';
import { Composition } from 'remotion';
import { Episode001 } from './episode/Episode001';
import { Episode002 } from './episodes/ep002/Episode002';
import { EP2 } from './episodes/ep002/plan';
import { Scene01Hook } from './studio/scenes/Scene01Hook';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './engine/timeline';

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Episode001"
    component={Episode001}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
  <Composition
    id="Episode002"
    component={Episode002}
    durationInFrames={EP2.totalFrames}
    fps={EP2.fps}
    width={EP2.width}
    height={EP2.height}
  />
  <Composition
    id="ChristmasScene01"
    component={Scene01Hook}
    durationInFrames={720}
    fps={24}
    width={1920}
    height={1080}
  />
  </>
);
