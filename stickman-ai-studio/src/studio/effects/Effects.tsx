import React from 'react';
import { smoothNoise } from '../utilities/math';

/** Steam rising from a hot pot or a plate. Each wisp rises, drifts and fades. */
export const Steam: React.FC<{ x: number; y: number; t: number; count?: number; height?: number }> = ({ x, y, t, count = 5, height = 160 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const phase = (t * 0.45 + i / count) % 1;
      const rise = phase * height;
      const drift = Math.sin(phase * 6 + i) * 14 + smoothNoise(t + i, 4) * 6;
      const alpha = Math.sin(phase * Math.PI) * 0.55;
      const cx = x + (i - (count - 1) / 2) * 18 + drift;
      return (
        <path
          key={i}
          d={`M${cx} ${y - rise} q10 -14 0 -28 q-10 -14 0 -28`}
          fill="none"
          stroke="#ffffff"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={alpha}
        />
      );
    })}
  </g>
);

/** A puff of flour: a cloud of pale dots that spreads out from (x, y) starting at `start` seconds. */
export const Flour: React.FC<{ x: number; y: number; t: number; start: number; duration?: number }> = ({ x, y, t, start, duration = 2.2 }) => {
  const local = t - start;
  if (local < 0 || local > duration) return null;
  const p = local / duration;
  const alpha = (1 - p) * 0.85;
  return (
    <g opacity={alpha}>
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2 + i * 0.7;
        const d = 30 + p * (120 + (i % 5) * 26);
        const r = 10 + (i % 4) * 6 + p * 16;
        return <circle key={i} cx={x + Math.cos(a) * d} cy={y - p * 40 + Math.sin(a) * d * 0.4} r={r} fill="#fafafa" />;
      })}
    </g>
  );
};
