import React from 'react';
import type { CharacterSpec, FaceParams, Pose } from './types';
import { Face, HEAD_R } from '../faces/Face';

/** Bone lengths in figure units (feet at y = 0, origin at the feet centre). */
const L = { thigh: 82, shin: 74, upper: 66, fore: 60, torso: 84, neck: 12 };
const HIP_Y = -150;
const HAND_R = 12;
const STROKE = 15;
const DEG = 180 / Math.PI;

interface Pt {
  x: number;
  y: number;
}

/** Point reached from `o` by `len` along an angle measured from straight down. */
const along = (o: Pt, len: number, ang: number): Pt => ({ x: o.x + len * Math.sin(ang), y: o.y + len * Math.cos(ang) });
const seg = (pts: Pt[]): string => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

export interface StickmanProps {
  /** World x of the feet centre. */
  x: number;
  /** World y of the ground line. */
  groundY: number;
  spec: CharacterSpec;
  pose: Pose;
  face: FaceParams;
  /** 0..1, from blinkAt(). */
  blink: number;
  /** 1 faces right, -1 faces left. */
  facing?: 1 | -1;
  /** Extra overall scale for close-ups or wide shots. */
  zoom?: number;
  /** Opacity for fades in and out. */
  opacity?: number;
  /** Vertical offset from the ground in px. Positive is down (falling). */
  drop?: number;
}

export const Stickman: React.FC<StickmanProps> = ({ x, groundY, spec, pose, face, blink, facing = 1, zoom = 1, opacity = 1, drop = 0 }) => {
  const k = spec.scale * zoom;
  const { palette } = spec;
  const hip: Pt = { x: 0, y: HIP_Y + pose.hipY };
  const lean = pose.torsoLean;
  const shoulder = along(hip, L.torso, Math.PI - lean);
  const neck = along(shoulder, L.neck, Math.PI - lean);
  const headC = along(neck, 40, Math.PI - lean);

  const legs = (thigh: number, shin: number) => {
    const knee = along(hip, L.thigh, thigh);
    const ankle = along(knee, L.shin, thigh - shin);
    return { knee, ankle };
  };
  const arms = (upper: number, fore: number, sh: Pt) => {
    const elbow = along(sh, L.upper, upper);
    const hand = along(elbow, L.fore, upper + fore);
    return { elbow, hand };
  };

  const legL = legs(pose.thighL, pose.shinL);
  const legR = legs(pose.thighR, pose.shinR);
  const shL = { x: shoulder.x - 4, y: shoulder.y };
  const shR = { x: shoulder.x + 4, y: shoulder.y };
  const armL = arms(pose.upperL, pose.foreL, shL);
  const armR = arms(pose.upperR, pose.foreR, shR);

  const limb = (pts: Pt[], color: string, width = STROKE) => (
    <path d={seg(pts)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  );

  const shoe = (ankle: Pt, dim: boolean) => (
    <ellipse cx={ankle.x + 8} cy={ankle.y + 4} rx={15} ry={8} fill={palette.shoes} stroke={palette.outline} strokeWidth={2} opacity={dim ? 0.8 : 1} />
  );

  const torsoPath = (() => {
    const top = shoulder;
    const bottom = hip;
    const w = spec.outfit === 'parka' ? 34 : 28;
    return `M${top.x - w} ${top.y - 2} Q${top.x} ${top.y - 10} ${top.x + w} ${top.y - 2} L${bottom.x + w - 2} ${bottom.y + 8} Q${bottom.x} ${bottom.y + 16} ${bottom.x - w + 2} ${bottom.y + 8} Z`;
  })();

  const outfitDetail = (() => {
    const top = shoulder;
    const bottom = hip;
    switch (spec.outfit) {
      case 'hoodie':
        return (
          <g>
            <path d={`M${top.x - 16} ${top.y + 2} Q${top.x} ${top.y + 16} ${top.x + 16} ${top.y + 2}`} fill="none" stroke={palette.shirtAccent} strokeWidth={5} strokeLinecap="round" />
            <rect x={bottom.x - 26} y={bottom.y - 6} width={52} height={6} rx={3} fill={palette.shirtAccent} />
          </g>
        );
      case 'sweater': {
        const dots: React.ReactElement[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            dots.push(<circle key={`${r}-${c}`} cx={top.x - 14 + c * 14} cy={top.y + 18 + r * 16} r={3.6} fill={palette.shirtAccent} />);
          }
        }
        return (
          <g>
            {dots}
            <rect x={bottom.x - 28} y={bottom.y - 6} width={56} height={9} rx={3} fill={palette.shirtAccent} />
          </g>
        );
      }
      case 'apron':
        return (
          <g>
            <path d={`M${top.x - 20} ${top.y + 12} L${top.x + 20} ${top.y + 12} L${top.x + 24} ${bottom.y + 40} L${top.x - 24} ${bottom.y + 40} Z`} fill="#fbfaf5" stroke={palette.outline} strokeWidth={2} />
            <rect x={top.x - 24} y={top.y + 2} width={48} height={6} fill={palette.shirtAccent} />
            <path d={`M${top.x - 14} ${top.y - 4} Q${top.x} ${top.y - 14} ${top.x + 14} ${top.y - 4}`} fill="none" stroke={palette.outline} strokeWidth={2.4} />
          </g>
        );
      case 'parka':
        return (
          <g>
            <path d={`M${top.x - 2} ${top.y + 4} L${top.x - 2} ${bottom.y + 10}`} stroke={palette.shirtAccent} strokeWidth={4} strokeLinecap="round" />
            <path d={`M${top.x - 30} ${bottom.y - 4} L${bottom.x + 30} ${bottom.y - 4}`} stroke={palette.shirtAccent} strokeWidth={4} />
          </g>
        );
      default:
        return null;
    }
  })();

  const hair = (() => {
    switch (spec.hair) {
      case 'curly':
        return (
          <g fill={palette.hair} stroke={palette.outline} strokeWidth={2}>
            {[-38, -24, -10, 4, 18, 32].map((dx, i) => (
              <circle key={i} cx={dx * 0.9} cy={-HEAD_R * 0.7 - (i % 2) * 4} r={13} />
            ))}
            <circle cx={-HEAD_R + 6} cy={-6} r={10} />
            <circle cx={HEAD_R - 6} cy={-6} r={10} />
          </g>
        );
      case 'bald':
        return (
          <g fill={palette.hair} stroke={palette.outline} strokeWidth={2}>
            <circle cx={-HEAD_R + 6} cy={-14} r={11} />
            <circle cx={HEAD_R - 6} cy={-14} r={11} />
            <circle cx={-HEAD_R + 6} cy={6} r={9} />
            <circle cx={HEAD_R - 6} cy={6} r={9} />
          </g>
        );
      case 'bun':
        return (
          <g>
            <circle cx={-6} cy={-HEAD_R - 6} r={17} fill={palette.hair} stroke={palette.outline} strokeWidth={2} />
            <path d={`M-${HEAD_R - 2} -4 Q0 -${HEAD_R + 10} ${HEAD_R - 2} -4 L${HEAD_R - 6} -18 Q0 -${HEAD_R + 4} -${HEAD_R - 6} -18 Z`} fill={palette.hair} stroke={palette.outline} strokeWidth={2} />
          </g>
        );
      case 'beanie':
        return (
          <g>
            <path d={`M-${HEAD_R} -6 Q-${HEAD_R} -${HEAD_R + 14} 0 -${HEAD_R + 14} Q${HEAD_R} -${HEAD_R + 14} ${HEAD_R} -6 Z`} fill={palette.hair} stroke={palette.outline} strokeWidth={2} />
            <path d={`M-${HEAD_R} -14 Q0 -${HEAD_R - 2} ${HEAD_R} -14`} fill="none" stroke={palette.shirtAccent} strokeWidth={6} />
            <circle cx={0} cy={-HEAD_R - 14} r={8} fill={palette.shirtAccent} stroke={palette.outline} strokeWidth={2} />
          </g>
        );
      default:
        return null;
    }
  })();

  return (
    <g transform={`translate(${x.toFixed(2)} ${(groundY + drop).toFixed(2)}) scale(${(k * facing).toFixed(4)} ${k.toFixed(4)})`} opacity={opacity}>
      {/* Far side first, dimmed so the near side reads in front. */}
      {limb([hip, legR.knee, legR.ankle], '#00000055', STROKE - 2)}
      {shoe(legR.ankle, true)}
      {limb([shR, armR.elbow, armR.hand], '#00000055', STROKE - 3)}
      <circle cx={armR.hand.x} cy={armR.hand.y} r={HAND_R - 2} fill="#00000055" />

      {/* Body */}
      <path d={torsoPath} fill={palette.shirt} stroke={palette.outline} strokeWidth={2.4} strokeLinejoin="round" />
      {outfitDetail}
      <rect x={hip.x - 24} y={hip.y - 6} width={48} height={18} rx={6} fill={palette.pants} stroke={palette.outline} strokeWidth={2} />
      {spec.outfit === 'parka' && <path d={`M${shoulder.x - 30} ${shoulder.y + 8} Q${shoulder.x} ${shoulder.y - 16} ${shoulder.x + 30} ${shoulder.y + 8}`} fill="none" stroke={palette.shirt} strokeWidth={10} strokeLinecap="round" />}

      {/* Near side */}
      {limb([hip, legL.knee, legL.ankle], palette.pants)}
      {shoe(legL.ankle, false)}
      {limb([shL, armL.elbow, armL.hand], palette.shirt, STROKE)}
      {limb([shL, { x: (shL.x + armL.elbow.x) / 2, y: (shL.y + armL.elbow.y) / 2 }], palette.shirt, STROKE + 4)}
      <circle cx={armL.hand.x} cy={armL.hand.y} r={HAND_R} fill={spec.outfit === 'parka' ? palette.shirtAccent : palette.skin} stroke={palette.outline} strokeWidth={2} />

      {/* Head: neck, hair behind, face, hair front. */}
      <path d={seg([shoulder, neck])} stroke={palette.skin} strokeWidth={12} strokeLinecap="round" fill="none" />
      <g transform={`translate(${headC.x.toFixed(2)} ${headC.y.toFixed(2)}) rotate(${(pose.headTilt * DEG).toFixed(2)})`}>
        {spec.hair === 'bun' && hair}
        <Face p={face} blink={blink} skin={palette.skin} glasses={spec.glasses} />
        {spec.hair !== 'bun' && hair}
      </g>
    </g>
  );
};
