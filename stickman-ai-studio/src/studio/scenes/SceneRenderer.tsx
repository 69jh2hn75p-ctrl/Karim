import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Stickman } from '../characters/Stickman';
import { FAMILY } from '../characters/family';
import type { EmotionName, Pose } from '../characters/types';
import { EMOTIONS, applyLipSync } from '../faces/emotions';
import { blinkAt } from '../animations/blink';
import { cameraAt, cameraTransform, type CameraKey, type Shake } from '../camera/camera';
import { Caption } from '../components/Caption';
import { SceneDialogue } from '../audio/SceneDialogue';
import { envelopeAt } from '../audio/lipsync';
import { SCREENPLAY, captionFor } from '../screenplay';
import { clamp } from '../utilities/math';

const W = 1920;
const H = 1080;
const FPS = 24;
const BLINK_OFFSET: Record<string, number> = { ben: 0, frank: 1.1, diane: 2.3, max: 0.6 };

export interface ActorDef {
  id: 'ben' | 'frank' | 'diane' | 'max';
  /** World x of the feet, scene-local seconds. */
  x: (t: number) => number;
  facing?: (t: number) => 1 | -1;
  pose: (t: number) => Pose;
  emotion: (t: number) => EmotionName;
  opacity?: (t: number) => number;
  zoom?: number;
  /** Vertical fall in px (positive is down). */
  drop?: (t: number) => number;
}

export interface SceneDef {
  /** Screenplay scene id, e.g. "S02". Drives dialogue audio and captions. */
  id: string;
  groundY?: number;
  camera: CameraKey[];
  shakes?: Shake[];
  /** World-space background, drawn first. */
  background: (t: number, camX: number) => React.ReactNode;
  /** World-space props drawn after the background and before the actors. */
  world?: (t: number) => React.ReactNode;
  actors: ActorDef[];
  /** World-space items drawn in front of the actors (foreground details). */
  foreground?: (t: number) => React.ReactNode;
  /** Screen-space overlay: tints, light leaks, vignette. */
  overlay?: (t: number) => React.ReactNode;
}

/**
 * Shared scene renderer. A scene file only describes what is where and when; this component
 * handles the camera, the characters' faces (emotion, blink, lip-sync), dialogue audio,
 * captions, and a short fade at both ends of every scene.
 */
export const SceneRenderer: React.FC<{ def: SceneDef }> = ({ def }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / FPS;
  // Inside a Sequence, useVideoConfig reports the whole film, so the scene length comes from the screenplay.
  const span = SCREENPLAY.scenes.find((s) => s.id === def.id);
  const total = span ? span.to - span.from : durationInFrames / FPS;
  const cam = cameraAt(def.camera, t, def.shakes ?? []);
  const groundY = def.groundY ?? 900;
  const sceneFrom = SCREENPLAY.scenes.find((s) => s.id === def.id)?.from ?? 0;
  const cap = captionFor(SCREENPLAY, def.id, t);
  const fadeIn = clamp(t / 0.4, 0, 1);
  const fadeOut = clamp((total - t) / 0.6, 0, 1);
  const black = 1 - Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{ background: '#0c1020' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <g transform={cameraTransform(cam, W, H)}>
          {def.background(t, cam.x)}
          {def.world?.(t)}
          {def.actors.map((a) => {
            const face = applyLipSync(EMOTIONS[a.emotion(t)], envelopeAt(a.id, sceneFrom + t, t));
            return (
              <Stickman
                key={a.id}
                x={a.x(t)}
                groundY={groundY}
                spec={FAMILY[a.id]}
                pose={a.pose(t)}
                face={face}
                blink={blinkAt(t, BLINK_OFFSET[a.id] ?? 0)}
                facing={a.facing?.(t) ?? 1}
                zoom={a.zoom ?? 1}
                opacity={a.opacity?.(t) ?? 1}
                drop={a.drop?.(t) ?? 0}
              />
            );
          })}
          {def.foreground?.(t)}
        </g>
      </svg>

      {def.overlay?.(t)}

      <Caption text={cap?.text ?? ''} speaker={cap?.speaker ?? ''} vo={cap?.vo ?? false} visible={!!cap} />
      <SceneDialogue sceneId={def.id} />

      <AbsoluteFill style={{ background: '#000', opacity: black, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
