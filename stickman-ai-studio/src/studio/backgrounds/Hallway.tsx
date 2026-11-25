import React from 'react';
import { FLOOR_Y } from './LivingRoom';

const layer = (k: number, camX: number): string => `translate(${(camX * (1 - k)).toFixed(2)} 0)`;

/**
 * Upstairs-style hallway for the chase: a long wall of framed family photos, doorways at intervals,
 * a runner rug down the middle, and warm wall lamps. The far end opens into the living room.
 */
export const Hallway: React.FC<{ camX: number }> = ({ camX }) => {
  const far = layer(0.5, camX);
  const mid = layer(0.8, camX);
  const floor = layer(1, camX);
  return (
    <g>
      <defs>
        <linearGradient id="hallFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d4c35" />
          <stop offset="1" stopColor="#3e2a1c" />
        </linearGradient>
      </defs>

      <g transform={far}>
        <rect x={-600} y={-300} width={3800} height={FLOOR_Y + 300} fill="#7a4b3a" />
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={i} x={-600 + i * 100} y={-300} width={8} height={FLOOR_Y + 300} fill="#ffffff" opacity={0.04} />
        ))}
        {/* Wall of framed photos */}
        {Array.from({ length: 18 }, (_, i) => {
          const x = -400 + i * 170;
          const tall = i % 3 === 0;
          return (
            <g key={i}>
              <rect x={x} y={tall ? 180 : 230} width={tall ? 110 : 90} height={tall ? 140 : 110} fill="#fff8e1" stroke="#5d4037" strokeWidth={6} />
              <rect x={x + 10} y={(tall ? 190 : 240)} width={(tall ? 90 : 70)} height={(tall ? 120 : 90)} fill={['#90caf9', '#f48fb1', '#a5d6a7', '#ffe082'][i % 4]} />
              <circle cx={x + (tall ? 55 : 45)} cy={(tall ? 230 : 270)} r={14} fill="#e0a070" />
            </g>
          );
        })}
        {/* Doorways */}
        {[200, 1100, 2000].map((x, i) => (
          <g key={i}>
            <rect x={x} y={300} width={220} height={FLOOR_Y - 300} fill="#4a2c20" stroke="#2c1a10" strokeWidth={8} />
            <rect x={x + 16} y={316} width={188} height={FLOOR_Y - 330} fill="#2d1c14" />
          </g>
        ))}
        {/* Wall lamps */}
        {[420, 1320, 2220].map((x, i) => (
          <g key={i}>
            <rect x={x - 14} y={380} width={28} height={70} fill="#ffe082" stroke="#8d6e63" strokeWidth={3} />
            <circle cx={x} cy={372} r={60} fill="#ffcc80" opacity={0.18 + 0.02 * i} />
          </g>
        ))}
      </g>

      <g transform={mid}>
        {/* Skirting board */}
        <rect x={-600} y={FLOOR_Y - 46} width={3800} height={46} fill="#e8dcc8" stroke="#8d6e63" strokeWidth={3} />
      </g>

      <g transform={floor}>
        <rect x={-600} y={FLOOR_Y} width={3800} height={400} fill="url(#hallFloor)" />
        {/* Runner rug down the hallway */}
        <rect x={-600} y={FLOOR_Y + 40} width={3800} height={70} fill="#8b1e2b" stroke="#e0b050" strokeWidth={5} />
        <rect x={-600} y={FLOOR_Y + 58} width={3800} height={34} fill="none" stroke="#f4c430" strokeWidth={2} strokeDasharray="10 12" opacity={0.7} />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={-600} x2={3200} y1={FLOOR_Y + 130 + i * 20} y2={FLOOR_Y + 130 + i * 20} stroke="#2c1a10" strokeWidth={2} opacity={0.5} />
        ))}
      </g>
    </g>
  );
};
