import React from 'react';
import { clamp } from '../utilities/math';

/** Small props shared by several scenes. Positions are world-space; y is the object's base. */

export const ShoppingBag: React.FC<{ x: number; y: number; color?: string; scale?: number }> = ({ x, y, color = '#c62828', scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-40 -90 Q0 -130 40 -90" fill="none" stroke="#5a3b26" strokeWidth={6} />
    <path d="M-52 -90 L52 -90 L60 0 L-60 0 Z" fill={color} stroke="#2b1b12" strokeWidth={3} />
    <rect x={-40} y={-60} width={80} height={12} fill="#ffffff" opacity={0.85} />
  </g>
);

export const GiftBox: React.FC<{ x: number; y: number; w?: number; h?: number; color?: string; ribbon?: string; tag?: string }> = ({
  x,
  y,
  w = 80,
  h = 60,
  color = '#c62828',
  ribbon = '#ffd54f',
  tag,
}) => (
  <g>
    <rect x={x} y={y - h} width={w} height={h} fill={color} stroke="#2b1b12" strokeWidth={3} />
    <rect x={x + w / 2 - 7} y={y - h} width={14} height={h} fill={ribbon} />
    <path d={`M${x + w / 2} ${y - h} q-22 -20 -10 -28 q10 -6 10 10 q0 -16 10 -10 q12 8 -10 28`} fill="none" stroke={ribbon} strokeWidth={6} />
    {tag && <rect x={x + 8} y={y - 16} width={26} height={12} fill="#fff8e1" stroke="#2b1b12" strokeWidth={1.5} />}
  </g>
);

export const Scarf: React.FC<{ x: number; y: number; length?: number }> = ({ x, y, length = 180 }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={i} x={0} y={i * 22} width={length * 0.16} height={22} fill={i % 2 ? '#1e88e5' : '#90caf9'} stroke="#0d47a1" strokeWidth={1.5} />
    ))}
    <rect x={0} y={0} width={length * 0.16} height={length} fill="none" stroke="#0d47a1" strokeWidth={2} opacity={0} />
  </g>
);

export const DinoToy: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx={0} cy={-18} rx={34} ry={20} fill="#43a047" stroke="#1b5e20" strokeWidth={3} />
    <circle cx={30} cy={-38} r={16} fill="#43a047" stroke="#1b5e20" strokeWidth={3} />
    {[-20, -6, 8].map((dx, i) => (
      <path key={i} d={`M${dx} -36 l6 -12 l6 12`} fill="#ffffff" stroke="#1b5e20" strokeWidth={1.5} />
    ))}
    <rect x={-22} y={0} width={10} height={14} fill="#43a047" />
    <rect x={10} y={0} width={10} height={14} fill="#43a047" />
  </g>
);

export const Cookie: React.FC<{ x: number; y: number; r?: number; icing?: string; sprinkles?: boolean; broken?: boolean }> = ({
  x,
  y,
  r = 26,
  icing = '#ff80ab',
  sprinkles = true,
  broken = false,
}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#d7a35b" stroke="#7a4e22" strokeWidth={3} />
    <circle r={r * 0.78} fill={icing} opacity={0.9} />
    {sprinkles &&
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return <rect key={i} x={Math.cos(a) * r * 0.5 - 2} y={Math.sin(a) * r * 0.5 - 1} width={4} height={2} fill={['#ffeb3b', '#4fc3f7', '#ffffff', '#66bb6a'][i % 4]} transform={`rotate(${i * 40} ${Math.cos(a) * r * 0.5} ${Math.sin(a) * r * 0.5})`} />;
      })}
    {broken && <path d={`M${r * 0.2} ${-r} L${r * 0.5} ${-r * 0.2} L${r * 0.1} ${r * 0.2}`} fill="none" stroke="#7a4e22" strokeWidth={3} />}
  </g>
);

export const Bowl: React.FC<{ x: number; y: number; w?: number; color?: string; fill?: string }> = ({ x, y, w = 90, color = '#f5f5f5', fill = '#ffe0b2' }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M${-w / 2} 0 Q0 ${w * 0.5} ${w / 2} 0 Z`} fill={color} stroke="#9e9e9e" strokeWidth={3} />
    <ellipse cx={0} cy={0} rx={w / 2} ry={8} fill={fill} stroke="#9e9e9e" strokeWidth={2} />
  </g>
);

export const Ham: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={-30} rx={96} ry={44} fill="#c0392b" stroke="#6d1b12" strokeWidth={3} />
    <ellipse cx={0} cy={-34} rx={80} ry={34} fill="#e57373" opacity={0.5} />
    {[-40, -10, 22, 48].map((dx, i) => (
      <circle key={i} cx={dx} cy={-36} r={6} fill="#ffffff" stroke="#6d1b12" strokeWidth={1.5} />
    ))}
    <path d="M-30 -62 Q0 -88 30 -62" fill="none" stroke="#8d1f1f" strokeWidth={4} />
  </g>
);

export const Candle: React.FC<{ x: number; y: number; h?: number; t: number; phase?: number }> = ({ x, y, h = 90, t, phase = 0 }) => {
  const flick = 0.85 + 0.15 * Math.sin(t * 11 + phase) * Math.sin(t * 3.7 + phase * 2);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-9} y={-h} width={18} height={h} fill="#fff4dc" stroke="#c9b48a" strokeWidth={1.5} />
      <path d={`M0 ${-h - 4} Q${-8 * flick} ${-h - 22 * flick} 0 ${-h - 36 * flick} Q${8 * flick} ${-h - 22 * flick} 0 ${-h - 4}`} fill="#ffb020" opacity={0.95} />
      <circle cx={0} cy={-h - 12} r={34 * flick} fill="#ffb020" opacity={0.18} />
    </g>
  );
};

/** A TV set. When on, the screen glows and shows a simple looping scene with a moving train. */
export const TV: React.FC<{ x: number; y: number; t: number; on?: boolean }> = ({ x, y, t, on = true }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-140} y={-200} width={280} height={190} rx={12} fill="#1a1a1a" stroke="#000" strokeWidth={4} />
    <rect x={-124} y={-184} width={248} height={158} fill={on ? '#1d3b5c' : '#0b0b0b'} />
    {on && (
      <g>
        <rect x={-124} y={-70} width={248} height={44} fill="#2c5a3a" />
        <rect x={((t * 60) % 330) - 170} y={-104} width={96} height={36} rx={6} fill="#c62828" />
        <rect x={((t * 60) % 330) - 160} y={-104} width={12} height={36} fill="#ffd54f" />
        <circle cx={((t * 60) % 330) - 150} cy={-62} r={6} fill="#263238" />
        <circle cx={((t * 60) % 330) - 110} cy={-62} r={6} fill="#263238" />
        <circle cx={-80} cy={-120} r={10} fill="#fff8e1" opacity={0.8} />
      </g>
    )}
    <rect x={-40} y={-10} width={80} height={10} fill="#1a1a1a" />
    <rect x={-70} y={0} width={140} height={6} fill="#1a1a1a" />
  </g>
);

export const ScreenGlow: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <ellipse cx={x} cy={y} rx={300} ry={190} fill="#7fb3ff" opacity={0.08 + 0.02 * Math.sin(t * 4)} />
);

/** A soft pulse used for glowing items (lights, the star map, the candles). */
export const pulse = (t: number, speed = 3, lo = 0.6, hi = 1): number => lo + (hi - lo) * (0.5 + 0.5 * Math.sin(t * speed));

export const clampedFade = (t: number, from: number, to: number): number => clamp((t - from) / (to - from), 0, 1);
