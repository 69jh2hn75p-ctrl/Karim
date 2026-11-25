import React from 'react';
import { FLOOR_Y } from './LivingRoom';
import { Snow } from '../effects/Snow';

const layer = (k: number, camX: number): string => `translate(${(camX * (1 - k)).toFixed(2)} 0)`;

/** Dining room: wallpapered wall, a tall window, a chandelier, sideboard, and a long table set for dinner. */
export const DiningRoom: React.FC<{ t: number; frame: number; camX: number }> = ({ t, frame, camX }) => {
  const far = layer(0.5, camX);
  const mid = layer(0.8, camX);
  const floor = layer(1, camX);
  return (
    <g>
      <defs>
        <radialGradient id="diningWarm" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffcc80" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffcc80" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="diningFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4a2e" />
          <stop offset="1" stopColor="#4a2a1a" />
        </linearGradient>
      </defs>

      <g transform={far}>
        <rect x={-600} y={-300} width={3600} height={FLOOR_Y + 300} fill="#5a2d2a" />
        {Array.from({ length: 30 }, (_, i) => (
          <path key={i} d={`M${-600 + i * 120} -300 q40 300 0 ${FLOOR_Y + 300}`} fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.05} />
        ))}
        {/* Tall window with snow */}
        <rect x={1400} y={120} width={340} height={420} fill="#f6efe0" stroke="#7a5a3a" strokeWidth={10} />
        <rect x={1415} y={135} width={310} height={390} fill="#1f3b63" />
        <path d="M1415 470 Q1520 410 1725 455 L1725 525 L1415 525 Z" fill="#dfe9f5" />
        <Snow frame={frame} x={1415} y={135} width={310} height={390} count={40} speed={1} seed={33} />
        <rect x={1567} y={135} width={8} height={390} fill="#f6efe0" />
        {/* Chandelier */}
        <line x1={900} y1={-300} x2={900} y2={160} stroke="#5d4037" strokeWidth={4} />
        <ellipse cx={900} cy={170} rx={150} ry={22} fill="#d4af37" stroke="#8d6e1a" strokeWidth={3} />
        {[-120, -60, 0, 60, 120].map((dx, i) => (
          <g key={i}>
            <rect x={900 + dx - 5} y={176} width={10} height={24} fill="#fff4dc" stroke="#c9b48a" strokeWidth={1} />
            <circle cx={900 + dx} cy={198 + (i % 2) * 2} r={24} fill="#ffcc80" opacity={0.2 + 0.05 * Math.sin(t * 6 + i)} />
          </g>
        ))}
        {/* Garland on the wall */}
        <path d="M-200 130 Q600 180 1300 110" fill="none" stroke="#1d6a3a" strokeWidth={10} opacity={0.8} />
        {Array.from({ length: 20 }, (_, i) => (
          <circle key={i} cx={-200 + i * 75} cy={130 + Math.sin(i * 0.9) * 10} r={6} fill={['#ffd54f', '#ff5252', '#fff'][i % 3]} opacity={0.6 + 0.4 * Math.sin(t * 4 + i)} />
        ))}
      </g>

      <g transform={mid}>
        {/* Sideboard with plates */}
        <rect x={-150} y={640} width={520} height={FLOOR_Y - 640} fill="#6d4c35" stroke="#3e2a1c" strokeWidth={3} />
        {[-90, -10, 70, 150].map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy={630} rx={34} ry={10} fill="#ffffff" stroke="#9e9e9e" strokeWidth={2} />
            <ellipse cx={x} cy={628} rx={22} ry={5} fill="#c62828" opacity={0.5} />
          </g>
        ))}
      </g>

      <g transform={floor}>
        <rect x={-600} y={FLOOR_Y} width={3600} height={400} fill="url(#diningFloor)" />
        <ellipse cx={900} cy={FLOOR_Y + 60} rx={820} ry={90} fill="#1c4d3b" stroke="#d4af37" strokeWidth={4} />
        <ellipse cx={900} cy={FLOOR_Y + 60} rx={820} ry={90} fill="url(#diningWarm)" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={-600} x2={3000} y1={FLOOR_Y + 150 + i * 22} y2={FLOOR_Y + 150 + i * 22} stroke="#2c1a10" strokeWidth={2} opacity={0.45} />
        ))}
      </g>
    </g>
  );
};
