import React from 'react';
import type { FaceParams } from '../characters/types';
import { clamp } from '../utilities/math';

/** Head radius in figure units. Faces are drawn in head space: centre (0, 0). */
export const HEAD_R = 46;

const EYE_L = { x: -17, y: -4, rx: 10 };
const EYE_R = { x: 17, y: -4, rx: 10 };
const SKIN_LINE = '#3a1f14';

const brow = (side: 'L' | 'R', p: FaceParams): string => {
  const sx = side === 'L' ? -1 : 1;
  const tilt = side === 'L' ? p.browL : p.browR;
  const innerX = sx * 6;
  const outerX = sx * 26;
  const innerY = -20 + p.browY - 7 * tilt;
  const outerY = -20 + p.browY + 3 * tilt;
  const midX = sx * 16;
  const midY = (innerY + outerY) / 2 - 2;
  return `M${innerX} ${innerY} Q${midX} ${midY} ${outerX} ${outerY}`;
};

const mouthPath = (p: FaceParams): { d: string; fill: string; stroke: string; teeth?: boolean; tongue?: boolean } => {
  const o = clamp(p.mouthOpen, 0, 1);
  switch (p.mouth) {
    case 'closed':
      return { d: 'M-8 16 Q0 18 8 16', fill: 'none', stroke: SKIN_LINE };
    case 'smile':
      return { d: `M-12 13 Q0 ${20 + o * 6} 12 13`, fill: 'none', stroke: SKIN_LINE };
    case 'grin':
      return { d: `M-14 12 Q0 ${26 + o * 8} 14 12 Z`, fill: '#4a1a1a', stroke: SKIN_LINE, teeth: true };
    case 'open':
      return { d: `M-8 14 Q0 ${14 + 4 + o * 9} 8 14 Q0 ${14 - 2} -8 14 Z`, fill: '#3b1212', stroke: SKIN_LINE };
    case 'o':
      return { d: `M0 ${14} m${-(4 + o * 3)} 0 a${4 + o * 3} ${5 + o * 6} 0 1 0 ${(4 + o * 3) * 2} 0 a${4 + o * 3} ${5 + o * 6} 0 1 0 ${-(4 + o * 3) * 2} 0`, fill: '#3b1212', stroke: SKIN_LINE };
    case 'frown':
      return { d: `M-10 ${22 - o * 3} Q0 ${12 + o * 2} 10 ${22 - o * 3}`, fill: 'none', stroke: SKIN_LINE };
    case 'wobble':
      return { d: `M-10 17 Q-5 ${13 + o * 3} 0 17 T10 17`, fill: 'none', stroke: SKIN_LINE };
    case 'laugh':
      return { d: `M-16 12 Q0 ${24 + o * 12} 16 12 Q0 ${14 - o * 2} -16 12 Z`, fill: '#3b1212', stroke: SKIN_LINE, teeth: true, tongue: true };
    default:
      return { d: 'M-8 16 Q0 18 8 16', fill: 'none', stroke: SKIN_LINE };
  }
};

/** Eye: white sclera, pupil that follows the gaze, a catchlight, and an eyelid that closes it. */
const Eye: React.FC<{ eye: typeof EYE_L; p: FaceParams; blink: number }> = ({ eye, p, blink }) => {
  const open = Math.max(0.08, p.eyeOpen * (1 - blink));
  const ry = eye.rx * open;
  const pupilR = eye.rx * 0.46;
  const travelX = clamp(p.gazeX, -1, 1) * (eye.rx - pupilR) * 0.7;
  const travelY = clamp(p.gazeY, -1, 1) * (ry - pupilR) * 0.7;
  const pupilY = Math.max(-ry + pupilR, Math.min(ry - pupilR, travelY));
  return (
    <g>
      <ellipse cx={eye.x} cy={eye.y} rx={eye.rx} ry={ry} fill="#ffffff" stroke={SKIN_LINE} strokeWidth={2.2} />
      <clipPath id={`clip-${eye.x}`}>
        <ellipse cx={eye.x} cy={eye.y} rx={eye.rx - 1} ry={Math.max(0.5, ry - 1)} />
      </clipPath>
      <g clipPath={`url(#clip-${eye.x})`}>
        <circle cx={eye.x + travelX} cy={eye.y + pupilY} r={pupilR} fill="#140a08" />
        <circle cx={eye.x + travelX - pupilR * 0.35} cy={eye.y + pupilY - pupilR * 0.4} r={pupilR * 0.3} fill="#ffffff" />
      </g>
      {p.eyeOpen < 0.9 && (
        // Eyelid: a skin-coloured cap that cuts the top of the eye when it squints.
        <path
          d={`M${eye.x - eye.rx - 1} ${eye.y - ry * 0.2} Q${eye.x} ${eye.y - ry - (1 - p.eyeOpen) * 8} ${eye.x + eye.rx + 1} ${eye.y - ry * 0.2} L${eye.x + eye.rx + 1} ${eye.y - ry - 4} L${eye.x - eye.rx - 1} ${eye.y - ry - 4} Z`}
          fill="#d9a07a"
        />
      )}
    </g>
  );
};

/** Laughing eyes: happy closed arcs, the classic cartoon squint. */
const HappyArc: React.FC<{ eye: typeof EYE_L }> = ({ eye }) => (
  <path
    d={`M${eye.x - eye.rx} ${eye.y + 2} Q${eye.x} ${eye.y - eye.rx * 0.9} ${eye.x + eye.rx} ${eye.y + 2}`}
    fill="none"
    stroke={SKIN_LINE}
    strokeWidth={3.4}
    strokeLinecap="round"
  />
);

export interface FaceProps {
  p: FaceParams;
  /** 0..1 blink amount for this frame (0 open, 1 closed). */
  blink: number;
  skin: string;
  /** Draw glasses over the eyes. */
  glasses?: boolean;
  /** Optional mouth envelope for lip-sync is already folded into p.mouthOpen by applyLipSync. */
}

/** The face: head disc, brows, eyes, mouth, cheeks, tear. Drawn in head space. */
export const Face: React.FC<FaceProps> = ({ p, blink, skin, glasses }) => {
  const mouth = mouthPath(p);
  const laughing = p.mouth === 'laugh' || p.eyeOpen < 0.45;
  return (
    <g>
      <circle cx={0} cy={0} r={HEAD_R} fill={skin} stroke={SKIN_LINE} strokeWidth={2.5} />
      <ellipse cx={-HEAD_R} cy={2} rx={7} ry={10} fill={skin} stroke={SKIN_LINE} strokeWidth={2} />
      <ellipse cx={HEAD_R} cy={2} rx={7} ry={10} fill={skin} stroke={SKIN_LINE} strokeWidth={2} />
      {p.cheek > 0.02 && (
        <g opacity={clamp(p.cheek, 0, 1) * 0.7}>
          <ellipse cx={-27} cy={12} rx={8} ry={5} fill="#ff6f7a" />
          <ellipse cx={27} cy={12} rx={8} ry={5} fill="#ff6f7a" />
        </g>
      )}
      <path d={brow('L', p)} fill="none" stroke={SKIN_LINE} strokeWidth={5} strokeLinecap="round" />
      <path d={brow('R', p)} fill="none" stroke={SKIN_LINE} strokeWidth={5} strokeLinecap="round" />
      {laughing ? (
        <g>
          <HappyArc eye={EYE_L} />
          <HappyArc eye={EYE_R} />
        </g>
      ) : (
        <g>
          <Eye eye={EYE_L} p={p} blink={blink} />
          <Eye eye={EYE_R} p={p} blink={blink} />
        </g>
      )}
      {glasses && (
        <g fill="none" stroke="#2b2b2b" strokeWidth={2.6}>
          <circle cx={EYE_L.x} cy={EYE_L.y} r={EYE_L.rx + 4} />
          <circle cx={EYE_R.x} cy={EYE_R.y} r={EYE_R.rx + 4} />
          <path d={`M${EYE_L.x + EYE_L.rx + 4} ${EYE_L.y} L${EYE_R.x - EYE_R.rx - 4} ${EYE_R.y}`} />
        </g>
      )}
      <path d={mouth.d} fill={mouth.fill} stroke={mouth.stroke} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      {mouth.teeth && <path d="M-9 14 L9 14" stroke="#ffffff" strokeWidth={3} />}
      {mouth.tongue && <ellipse cx={0} cy={22} rx={6} ry={4} fill="#ff7b8a" />}
      {p.tear > 0.02 && (
        <path
          d={`M${EYE_L.x - 2} ${EYE_L.y + 14 + p.tear * 14} q-4 8 0 12 q4 -4 0 -12 Z`}
          fill="#8fd8ff"
          opacity={clamp(p.tear, 0, 1)}
        />
      )}
    </g>
  );
};
