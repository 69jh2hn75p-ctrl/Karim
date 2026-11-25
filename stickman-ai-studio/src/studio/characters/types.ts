/** Shared types for the character rig, faces and poses. */

export type EmotionName =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'sad'
  | 'angry'
  | 'fear'
  | 'surprise'
  | 'confused'
  | 'embarrassed'
  | 'disappointed'
  | 'suspicious'
  | 'laughing'
  | 'crying';

export type MouthShape = 'closed' | 'smile' | 'grin' | 'open' | 'o' | 'frown' | 'wobble' | 'laugh';

/** Everything the face needs on one frame. Numbers are normalised unless noted. */
export interface FaceParams {
  /** Left and right brow: positive lifts the inner end (sad, worried), negative drops it (angry). -1..1. */
  browL: number;
  browR: number;
  /** Shifts both brows up (negative) or down (positive), in face units. */
  browY: number;
  /** Eye opening. 0 closed, 1 normal, up to about 1.4 for wide eyes. */
  eyeOpen: number;
  /** Gaze direction: -1..1 left/right and up/down. */
  gazeX: number;
  gazeY: number;
  mouth: MouthShape;
  /** Mouth openness, 0..1. Lip-sync writes here while talking. */
  mouthOpen: number;
  /** Blush strength, 0..1. */
  cheek: number;
  /** Tear visibility, 0..1. */
  tear: number;
}

export interface Pose {
  /** Angles in radians, measured from straight down. Positive swings forward (+x). */
  thighL: number;
  shinL: number;
  thighR: number;
  shinR: number;
  upperL: number;
  foreL: number;
  upperR: number;
  foreR: number;
  /** Head tilt, radians. Positive tilts toward the facing direction. */
  headTilt: number;
  /** Torso lean, radians. Positive leans forward. */
  torsoLean: number;
  /** Vertical hip offset in px. Negative is up. */
  hipY: number;
}

export interface VoiceProfile {
  engine: 'espeak-ng' | 'elevenlabs';
  /** espeak voice id, e.g. en-us+m3. */
  voice: string;
  speed: number;
  pitch: number;
}

export interface CharacterSpec {
  id: 'ben' | 'frank' | 'diane' | 'max';
  name: string;
  /** Overall size multiplier. Max is smaller. */
  scale: number;
  palette: {
    skin: string;
    hair: string;
    shirt: string;
    shirtAccent: string;
    pants: string;
    shoes: string;
    outline: string;
  };
  /** Which outfit detail to draw on top of the torso. */
  outfit: 'hoodie' | 'sweater' | 'apron' | 'parka';
  hair: 'curly' | 'bald' | 'bun' | 'beanie';
  glasses: boolean;
  voice: VoiceProfile;
}
