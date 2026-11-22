import React from 'react';
import { CHAR_SCALE, GROUND_Y } from '../engine/timeline';
import type { Pose } from './pose';

/** Limb lengths in figure units (feet at y = 0). */
const L = { thigh: 42, shin: 40, upper: 31, fore: 29 } as const;
const HIP = { x: 0, y: -84 };
const SHOULDER = { x: 0, y: -124 };
const NECK = { x: 0, y: -132 };
const HEAD = { x: 0, y: -152 };
const HEAD_R = 17;
const STROKE = 6;
const INK = '#f2ead9';
const FAR = '#7d7a72';

interface Pt {
  x: number;
  y: number;
}

/** Point reached from `origin` by `len` along an angle measured from straight down. */
const along = (o: Pt, len: number, ang: number): Pt => ({
  x: o.x + len * Math.sin(ang),
  y: o.y + len * Math.cos(ang),
});

const toPath = (pts: Pt[]): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

export interface StickmanProps {
  /** World x of the feet centre. */
  x: number;
  pose: Pose;
  /** Identity colour from the roster (scarf or backpack). */
  accent: string;
  accessory: 'scarf' | 'backpack';
  facing?: 1 | -1;
  /** 0..1 mouth openness, driven by the dialogue envelope. */
  mouth?: number;
  /** 1 is normal; higher opens the eyes for surprise. */
  eyeOpen?: number;
}

/** Rig: two-bone legs and arms, torso, head with tilt, face, one accessory. */
export const Stickman: React.FC<StickmanProps> = ({
  x,
  pose,
  accent,
  accessory,
  facing = 1,
  mouth = 0,
  eyeOpen = 1,
}) => {
  const b = pose.bob;
  const hip = { x: HIP.x, y: HIP.y + b };
  const sh = { x: SHOULDER.x, y: SHOULDER.y + b };
  const neck = { x: NECK.x, y: NECK.y + b };
  const head = { x: HEAD.x, y: HEAD.y + b };

  const leg = (thigh: number, bend: number): Pt[] => {
    const knee = along(hip, L.thigh, thigh);
    return [hip, knee, along(knee, L.shin, thigh - bend)];
  };
  const arm = (upper: number, fore: number): Pt[] => {
    const elbow = along(sh, L.upper, upper);
    return [sh, elbow, along(elbow, L.fore, upper + fore)];
  };

  const legL = leg(pose.thighL, pose.shinL);
  const legR = leg(pose.thighR, pose.shinR);
  const armL = arm(pose.upperL, pose.foreL);
  const armR = arm(pose.upperR, pose.foreR);

  const open = Math.max(0, Math.min(1, mouth));
  const eyeR = 2.3 * eyeOpen;

  return (
    <g transform={`translate(${x} ${GROUND_Y}) scale(${CHAR_SCALE * facing} ${CHAR_SCALE})`}>
      {/* Far side first, dimmed, so the near side reads in front. */}
      <path d={toPath(legR)} fill="none" stroke={FAR} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(armR)} fill="none" stroke={FAR} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />

      {accessory === 'backpack' && (
        <rect x={-21} y={neck.y + 6} width={16} height={36} rx={5} fill={accent} />
      )}

      <path d={toPath([hip, neck])} fill="none" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <path d={toPath(legL)} fill="none" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(armL)} fill="none" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />

      {accessory === 'scarf' && (
        <g>
          <path
            d={`M${neck.x - 8} ${neck.y + 9} Q${neck.x} ${neck.y + 13} ${neck.x + 8} ${neck.y + 9}`}
            fill="none"
            stroke={accent}
            strokeWidth={7}
            strokeLinecap="round"
          />
          <path
            d={`M${neck.x - 7} ${neck.y + 10} L${neck.x - 16} ${neck.y + 26}`}
            fill="none"
            stroke={accent}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </g>
      )}

      <g transform={`rotate(${(pose.headTilt * 180) / Math.PI} ${neck.x} ${neck.y})`}>
        <circle cx={head.x} cy={head.y} r={HEAD_R} fill="#0b0e16" stroke={INK} strokeWidth={STROKE} />
        <circle cx={head.x + 4} cy={head.y - 2} r={eyeR} fill={INK} />
        <circle cx={head.x + 11} cy={head.y - 2} r={eyeR} fill={INK} />
        {open > 0.05 ? (
          <ellipse cx={head.x + 7} cy={head.y + 7} rx={3} ry={0.6 + open * 4} fill="#2a1a24" />
        ) : (
          <path
            d={`M${head.x + 4} ${head.y + 7} Q${head.x + 7} ${head.y + 9.5} ${head.x + 10} ${head.y + 7}`}
            fill="none"
            stroke={INK}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        )}
      </g>
    </g>
  );
};
