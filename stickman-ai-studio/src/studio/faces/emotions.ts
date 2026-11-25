import { clamp, lerp } from '../utilities/math';
import type { EmotionName, FaceParams, MouthShape } from '../characters/types';

const base: FaceParams = {
  browL: 0,
  browR: 0,
  browY: 0,
  eyeOpen: 1,
  gazeX: 0,
  gazeY: 0,
  mouth: 'smile',
  mouthOpen: 0,
  cheek: 0,
  tear: 0,
};

/** One preset per required emotion. Values are tuned for a stylised, readable face. */
export const EMOTIONS: Record<EmotionName, FaceParams> = {
  neutral: { ...base, mouth: 'closed' },
  happy: { ...base, eyeOpen: 0.95, mouth: 'smile', cheek: 0.5, browY: -1 },
  excited: { ...base, browY: -6, eyeOpen: 1.2, mouth: 'grin', mouthOpen: 0.45, cheek: 0.6 },
  sad: { ...base, browL: 0.7, browR: 0.7, browY: 3, eyeOpen: 0.85, mouth: 'frown', mouthOpen: 0.1, gazeY: 0.2 },
  angry: { ...base, browL: -0.9, browR: -0.9, browY: 4, eyeOpen: 0.8, mouth: 'frown', mouthOpen: 0.25 },
  fear: { ...base, browL: 0.6, browR: 0.6, browY: -8, eyeOpen: 1.35, mouth: 'o', mouthOpen: 0.55 },
  surprise: { ...base, browY: -10, eyeOpen: 1.4, mouth: 'o', mouthOpen: 0.85 },
  confused: { ...base, browL: -0.3, browR: 0.6, browY: -2, eyeOpen: 1, mouth: 'wobble', mouthOpen: 0.15, gazeX: 0.3 },
  embarrassed: { ...base, browL: 0.4, browR: 0.4, browY: 2, eyeOpen: 0.7, gazeY: 0.7, mouth: 'wobble', mouthOpen: 0.05, cheek: 1 },
  disappointed: { ...base, browL: 0.3, browR: 0.3, browY: 3, eyeOpen: 0.75, gazeY: 0.3, mouth: 'frown', mouthOpen: 0.05 },
  suspicious: { ...base, browL: -0.6, browR: -0.1, browY: 1, eyeOpen: 0.55, gazeX: 0.8, mouth: 'closed' },
  laughing: { ...base, eyeOpen: 0.3, mouth: 'laugh', mouthOpen: 0.9, cheek: 0.9, browY: -2 },
  crying: { ...base, browL: 0.8, browR: 0.8, browY: 3, eyeOpen: 0.7, mouth: 'wobble', mouthOpen: 0.5, tear: 1, cheek: 0.2 },
};

const NUMERIC: (keyof FaceParams)[] = [
  'browL', 'browR', 'browY', 'eyeOpen', 'gazeX', 'gazeY', 'mouthOpen', 'cheek', 'tear',
];

/**
 * Blend two faces. Numbers interpolate; the mouth shape switches at halfway so the change reads
 * as a real expression change rather than a morph between unrelated shapes.
 */
export function blendFace(a: FaceParams, b: FaceParams, t: number): FaceParams {
  const k = clamp(t, 0, 1);
  const out = { ...a } as FaceParams;
  for (const key of NUMERIC) {
    (out as unknown as Record<string, number>)[key] = lerp(
      a[key] as number,
      b[key] as number,
      k,
    );
  }
  out.mouth = (k < 0.5 ? a.mouth : b.mouth) as MouthShape;
  return out;
}

/**
 * Lip-sync: while a character speaks, the mouth follows the audio envelope (0..1).
 * Happy and laughing mouths keep their shape; the rest open and close with the voice.
 */
export function applyLipSync(face: FaceParams, envelope: number): FaceParams {
  const amp = clamp(envelope, 0, 1);
  if (amp <= 0.02) return face;
  if (face.mouth === 'laugh' || face.mouth === 'o') {
    return { ...face, mouthOpen: Math.max(face.mouthOpen, amp * 0.9) };
  }
  return { ...face, mouth: amp > 0.35 ? 'open' : face.mouth, mouthOpen: Math.max(face.mouthOpen, amp * 0.85) };
}
