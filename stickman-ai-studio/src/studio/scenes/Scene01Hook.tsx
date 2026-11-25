import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { LivingRoom, FLOOR_Y } from '../backgrounds/LivingRoom';
import { ChristmasTree } from '../props/ChristmasTree';
import { Stickman } from '../characters/Stickman';
import { FAMILY } from '../characters/family';
import { EMOTIONS, applyLipSync } from '../faces/emotions';
import { blinkAt } from '../animations/blink';
import { idle, walk, brace, cheer, fall, STARTLE, mixPose } from '../animations/poses';
import { cameraAt, cameraTransform, type CameraKey } from '../camera/camera';
import { track, smoothstep, clamp } from '../utilities/math';
import { Caption } from '../components/Caption';
import { SceneDialogue } from '../audio/SceneDialogue';
import { SCREENPLAY, captionFor } from '../screenplay';
import { envelopeAt } from '../audio/lipsync';
import type { EmotionName, FaceParams, Pose } from '../characters/types';

const W = 1920;
const H = 1080;
const FPS = 24;
const TREE = { x: 1080, height: 560 };

/** Tree tip over scene-local seconds: a strain, two wobbles, then the crash. */
const treeTip = (t: number): number =>
  track(t, [0, 0.4, 1.4, 3.0, 8.0, 12, 14, 16, 20.5, 21.6, 23.5, 30], [0, 0, 0.18, 0.24, 0.2, 0.24, 0.35, 0.42, 0.48, 1.2, 1.5, 1.52]);

/** Frank holds the tree from 0.4 s until it crashes. */
const bracing = (t: number): number => smoothstep((t - 0.4) / 0.9) * (1 - smoothstep((t - 21.4) / 0.6));

/** Frank's expression across the scene. */
const frankEmotion = (t: number): EmotionName => {
  if (t < 0.9) return 'excited';
  if (t < 3) return 'fear';
  if (t < 8) return 'confused';
  if (t < 15) return 'suspicious';
  if (t < 21.4) return 'happy';
  if (t < 22.6) return 'surprise';
  return 'disappointed';
};

const benEmotion = (t: number): EmotionName => {
  if (t < 11) return 'neutral';
  if (t < 15) return 'suspicious';
  if (t < 22) return 'neutral';
  if (t < 26) return 'laughing';
  return 'happy';
};

const maxEmotion = (t: number): EmotionName => {
  if (t < 1.2) return 'excited';
  if (t < 2.6) return 'surprise';
  if (t < 21.5) return 'excited';
  return 'laughing';
};

const dianeEmotion = (t: number): EmotionName => (t < 14.5 ? 'neutral' : t < 22 ? 'angry' : 'disappointed');

/** Camera keys for scene 1, in scene-local seconds. */
const CAMERA: CameraKey[] = [
  { t: 0, x: 980, y: 540, zoom: 0.95 },
  { t: 3, x: 1020, y: 520, zoom: 1.05 },
  { t: 6, x: 600, y: 520, zoom: 1.3 },
  { t: 12, x: 700, y: 520, zoom: 1.15 },
  { t: 14, x: 1000, y: 500, zoom: 0.95 },
  { t: 18, x: 1180, y: 520, zoom: 1.2 },
  { t: 22, x: 1200, y: 520, zoom: 1.1 },
  { t: 26, x: 560, y: 520, zoom: 1.35 },
  { t: 30, x: 520, y: 500, zoom: 1.4 },
];

export const Scene01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / FPS;

  // Camera and tree
  const cam = cameraAt(CAMERA, t, [{ t: 21.6, duration: 0.9, amount: 14 }]);
  const tip = treeTip(t);
  const starOff = clamp((t - 21.2) / 1.2, 0, 1);

  // Frank: bracing, then crushed under the crash
  const b = bracing(t);
  const frankX = 1250 + 90 * smoothstep((t - 21.6) / 1.2);
  const frankPose: Pose = mixPose(mixPose(idle(t, 1), brace(t), b), fall(t), smoothstep((t - 21.5) / 0.5));

  // Ben: stands to camera, shrugs, laughs at the crash, waves at the end
  const benPose: Pose = mixPose(idle(t, 0), cheer(t * 0.8), smoothstep((t - 26) / 1.2));

  // Max: walks in from the left, startles, then bounces when the tree falls
  const maxWalk = t < 0.9;
  const maxX = maxWalk ? track(t, [0, 0.9], [40, 330]) : 330;
  const maxPose: Pose = maxWalk
    ? walk(t, 1.25)
    : mixPose(mixPose(idle(t, 2), STARTLE, smoothstep((t - 1.1) / 0.5) * (1 - smoothstep((t - 2.6) / 0.6))), cheer(t), smoothstep((t - 21.6) / 0.8));

  // Diane: walks into the doorway, then stands with her arms folded (idle pose)
  const dianeIn = t >= 13 && t < 14.5;
  const dianeX = dianeIn ? track(t, [13, 14.5], [1950, 1700]) : 1700;
  const dianePose: Pose = dianeIn ? walk(t, 1.1) : idle(t, 3);

  // Faces: emotion + blink + lip-sync (envelope from the generated timing when it exists)
  const faceFor = (emotion: EmotionName, speakerId: 'ben' | 'frank' | 'diane' | 'max', tt: number): FaceParams => {
    const env = envelopeAt(speakerId, tt, t);
    return applyLipSync(EMOTIONS[emotion], env);
  };

  const benFace = faceFor(benEmotion(t), 'ben', t);
  const frankFace = faceFor(frankEmotion(t), 'frank', t);
  const maxFace = faceFor(maxEmotion(t), 'max', t);
  const dianeFace = faceFor(dianeEmotion(t), 'diane', t);

  const cap = captionFor(SCREENPLAY, 'S01', t);

  const fade = Math.min(1, t / 0.4, (durationInFrames / FPS - t) / 0.6);
  const fadeOpacity = clamp(1 - fade, 0, 1);

  return (
    <AbsoluteFill style={{ background: '#0c1020' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <g transform={cameraTransform(cam, W, H)}>
          <LivingRoom frame={frame} t={t} camX={cam.x} />

          {/* Presents at the tree base */}
          <g>
            <rect x={960} y={FLOOR_Y - 60} width={90} height={60} fill="#c62828" stroke="#5a0f0f" strokeWidth={3} />
            <rect x={998} y={FLOOR_Y - 60} width={14} height={60} fill="#ffd54f" />
            <rect x={1220} y={FLOOR_Y - 46} width={70} height={46} fill="#2e7d4f" stroke="#123d24" strokeWidth={3} />
            <rect x={1250} y={FLOOR_Y - 46} width={12} height={46} fill="#f8f5ee" />
          </g>

          <ChristmasTree x={TREE.x} baseY={FLOOR_Y} height={TREE.height} tip={tip} starOff={starOff} frame={frame} />

          {/* Max and Ben stand left, Diane in the doorway, Frank holds the tree */}
          <Stickman x={maxX} groundY={FLOOR_Y} spec={FAMILY.max} pose={maxPose} face={maxFace} blink={blinkAt(t, 0.6)} facing={1} />
          <Stickman x={520} groundY={FLOOR_Y} spec={FAMILY.ben} pose={benPose} face={benFace} blink={blinkAt(t, 0)} facing={1} />
          <Stickman x={dianeX} groundY={FLOOR_Y} spec={FAMILY.diane} pose={dianePose} face={dianeFace} blink={blinkAt(t, 2.3)} facing={-1} opacity={t < 13 ? 0 : 1} />
          <Stickman x={frankX} groundY={FLOOR_Y} spec={FAMILY.frank} pose={frankPose} face={frankFace} blink={blinkAt(t, 1.1)} facing={-1} />
        </g>
      </svg>

      <Caption text={cap?.text ?? ''} speaker={cap?.speaker ?? ''} vo={cap?.vo ?? false} visible={!!cap} />

      <SceneDialogue sceneId="S01" />

      <AbsoluteFill style={{ background: '#000', opacity: fadeOpacity, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
