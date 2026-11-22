/**
 * Single source of truth for Episode 001 ("The Lab Below").
 * Scenes, dialogue starts, walk spans, SFX cues and key moments live here,
 * so the composition, the audio builder and the tests agree with each other.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 720; // 24 s at 30 fps
export const GROUND_Y = 860;
export const CAMERA_Y = 540;
export const CHAR_SCALE = 1.6;
export const DOOR_X = 1500;
export const PANEL_X = 900;

export type SceneId = 'arrival' | 'glow' | 'door' | 'lab';

export interface SceneSpan {
  id: SceneId;
  from: number;
  to: number;
  title: string;
}

export const SCENES: readonly SceneSpan[] = [
  { id: 'arrival', from: 0, to: 150, title: 'Arrival' },
  { id: 'glow', from: 150, to: 330, title: 'The glow' },
  { id: 'door', from: 330, to: 510, title: 'The door' },
  { id: 'lab', from: 510, to: 720, title: 'The lab' },
];

export function sceneAt(frame: number): SceneSpan {
  return SCENES.find((s) => frame >= s.from && frame < s.to) ?? SCENES[SCENES.length - 1];
}

export type CharacterId = 'ren' | 'bo';

export interface Span {
  from: number;
  to: number;
}

/** Frames in which each character walks. Weight fades in and out at the edges. */
export const WALK_SPANS: Record<CharacterId, readonly Span[]> = {
  ren: [
    { from: 0, to: 118 },
    { from: 330, to: 560 },
  ],
  bo: [
    { from: 0, to: 118 },
    { from: 330, to: 550 },
  ],
};

/** One full stride cycle (two steps) in frames. */
export const WALK_PERIOD_FRAMES = 15;

/** World-x keyframes. Flat segments are pauses. */
export const PATH_KEYS: Record<CharacterId, { frames: readonly number[]; xs: readonly number[] }> = {
  ren: { frames: [0, 118, 330, 560], xs: [-420, 640, 640, 1600] },
  bo: { frames: [0, 118, 330, 550], xs: [-520, 560, 560, 1480] },
};

export interface DialogueSpec {
  id: string;
  speaker: CharacterId;
  text: string;
  startFrame: number;
}

export const DIALOGUE: readonly DialogueSpec[] = [
  { id: 'L01', speaker: 'ren', text: 'Bo, look at the wall. It is glowing.', startFrame: 180 },
  { id: 'L02', speaker: 'bo', text: 'Ren, that door was not there before.', startFrame: 345 },
  { id: 'L03', speaker: 'ren', text: 'We found it. An underground laboratory, hidden for years.', startFrame: 560 },
];

export interface SfxCue {
  id: string;
  file: string;
  frame: number;
  volume: number;
}

export const SFX_CUES: readonly SfxCue[] = [
  { id: 'panel-ping', file: 'sfx/ping.wav', frame: 200, volume: 0.45 },
  { id: 'door-creak', file: 'sfx/door.wav', frame: 440, volume: 0.6 },
  { id: 'lab-ping', file: 'sfx/ping.wav', frame: 540, volume: 0.35 },
];

/** Key moments for animated state. Each span is [from, to] in absolute frames. */
export const PANEL_GLOW_SPAN = { from: 195, to: 235 };
export const DOOR_OPEN_SPAN = { from: 440, to: 480 };
export const LAB_LIGHT_SPAN = { from: 515, to: 555 };
export const BO_SURPRISE_SPAN = { from: 236, to: 330 };
export const REN_POINT_SPAN = { from: 165, to: 330 };
export const TITLE_SPAN = { from: 610, to: 700 };
