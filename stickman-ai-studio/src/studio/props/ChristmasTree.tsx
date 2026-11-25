import React from 'react';
import { seeded } from '../utilities/math';

export interface ChristmasTreeProps {
  /** World x of the trunk base. */
  x: number;
  /** World y of the trunk base (floor line). */
  baseY: number;
  /** Total height in px. */
  height?: number;
  /** Tip angle in radians around the base. Positive falls to the right. */
  tip?: number;
  /** 0..1: how far the star has come off the top. */
  starOff?: number;
  /** Frame for light blinking. */
  frame: number;
  /** Light colours cycle through these. */
  lights?: string[];
  seed?: number;
}

const ORNAMENT_COLORS = ['#e53935', '#fdd835', '#1e88e5', '#ffffff', '#ab47bc', '#ff8f00'];
const LIGHT_COLORS = ['#ffd54f', '#ff5252', '#69f0ae', '#40c4ff', '#ffffff'];

/**
 * A decorated tree with three tiers, trunk, ornaments, lights and a star topper.
 * It rotates as one piece around its base, so falling and wobbling use the same drawing.
 */
export const ChristmasTree: React.FC<ChristmasTreeProps> = ({
  x,
  baseY,
  height = 560,
  tip = 0,
  starOff = 0,
  frame,
  lights = LIGHT_COLORS,
  seed = 5,
}) => {
  const r = seeded(seed);
  const w = height * 0.62;
  const top = baseY - height;
  const tiers = [
    { y: baseY - height * 0.22, half: w * 0.5 },
    { y: baseY - height * 0.5, half: w * 0.38 },
    { y: baseY - height * 0.8, half: w * 0.24 },
  ];
  const ornaments = Array.from({ length: 26 }, (_, i) => {
    const tier = tiers[i % tiers.length];
    const a = r() * 2 - 1;
    return {
      x: x + a * tier.half * 0.82,
      y: tier.y - 16 + r() * (height * 0.2),
      color: ORNAMENT_COLORS[i % ORNAMENT_COLORS.length],
      size: 9 + r() * 4,
    };
  });
  const bulbs = Array.from({ length: 34 }, (_, i) => {
    const tier = tiers[i % tiers.length];
    const a = (i * 0.37) % 1 * 2 - 1;
    return {
      x: x + a * tier.half * 0.9,
      y: tier.y - 4 + ((i * 53) % 37),
      color: lights[i % lights.length],
      phase: i * 0.9,
    };
  });
  const starY = top - 4 + starOff * 120;
  const starX = x + starOff * -140;

  return (
    <g transform={`rotate(${((tip * 180) / Math.PI).toFixed(3)} ${x} ${baseY})`}>
      {/* Trunk */}
      <rect x={x - 14} y={baseY - height * 0.22} width={28} height={height * 0.22} fill="#5a3b26" />
      {/* Tiers */}
      {tiers.map((t, i) => (
        <path
          key={i}
          d={`M${x} ${t.y - t.half * 0.9} L${x + t.half} ${t.y + 12} Q${x} ${t.y + 22} ${x - t.half} ${t.y + 12} Z`}
          fill={i === 0 ? '#1f6b3a' : i === 1 ? '#23784a' : '#2a8a57'}
          stroke="#123d24"
          strokeWidth={3}
        />
      ))}
      {/* Tinsel highlights */}
      {tiers.map((t, i) => (
        <path key={`t${i}`} d={`M${x - t.half * 0.7} ${t.y + 4} Q${x} ${t.y + 14} ${x + t.half * 0.7} ${t.y + 4}`} fill="none" stroke="#cfd8dc" strokeWidth={2} strokeDasharray="6 5" opacity={0.6} />
      ))}
      {/* Ornaments */}
      {ornaments.map((o, i) => (
        <g key={`o${i}`}>
          <circle cx={o.x} cy={o.y} r={o.size} fill={o.color} stroke="#2b2b2b" strokeWidth={1.5} />
          <circle cx={o.x - o.size * 0.35} cy={o.y - o.size * 0.35} r={o.size * 0.25} fill="#ffffff" opacity={0.7} />
        </g>
      ))}
      {/* Lights: each one blinks at its own rhythm */}
      {bulbs.map((b, i) => {
        const on = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.12 + b.phase));
        return (
          <g key={`l${i}`} opacity={on}>
            <circle cx={b.x} cy={b.y} r={6} fill={b.color} opacity={0.35} />
            <circle cx={b.x} cy={b.y} r={3.2} fill={b.color} />
          </g>
        );
      })}
      {/* Star topper */}
      <path
        transform={`translate(${starX.toFixed(2)} ${starY.toFixed(2)}) rotate(${(starOff * 40).toFixed(2)})`}
        d="M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 11 L-17 23 L-11 4 L-26 -8 L-7 -8 Z"
        fill="#ffd54f"
        stroke="#b38600"
        strokeWidth={2}
      />
    </g>
  );
};
