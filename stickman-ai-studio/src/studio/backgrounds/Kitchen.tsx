import React from 'react';
import { FLOOR_Y } from './LivingRoom';
import { Snow } from '../effects/Snow';

const layer = (k: number, camX: number): string => `translate(${(camX * (1 - k)).toFixed(2)} 0)`;

/** Kitchen: white tile wall, wood cabinets, a gas stove, an oven, a window with snow, a kitchen table. */
export const Kitchen: React.FC<{ t: number; frame: number; camX: number; table?: boolean }> = ({ t, frame, camX, table = true }) => {
  const far = layer(0.5, camX);
  const mid = layer(0.8, camX);
  const floor = layer(1, camX);
  return (
    <g>
      <defs>
        <linearGradient id="kitFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7ccc8" />
          <stop offset="1" stopColor="#8d6e63" />
        </linearGradient>
      </defs>

      <g transform={far}>
        <rect x={-600} y={-300} width={3600} height={FLOOR_Y + 300} fill="#f5f2ea" />
        {Array.from({ length: 22 }, (_, r) =>
          Array.from({ length: 36 }, (_, c) => (
            <rect key={`${r}-${c}`} x={-600 + c * 80} y={-200 + r * 40} width={76} height={36} fill="#fbfbf8" stroke="#d6d1c6" strokeWidth={1} />
          )),
        )}
        {/* Window with snow */}
        <rect x={1380} y={150} width={300} height={300} fill="#f6efe0" stroke="#8d6e63" strokeWidth={10} />
        <rect x={1395} y={165} width={270} height={270} fill="#1f3b63" />
        <path d="M1395 400 Q1500 350 1665 395 L1665 435 L1395 435 Z" fill="#dfe9f5" />
        <Snow frame={frame} x={1395} y={165} width={270} height={270} count={34} speed={1} seed={91} />
        <rect x={1528} y={165} width={8} height={270} fill="#f6efe0" />
        {/* Hanging utensils on a rail */}
        <rect x={250} y={230} width={520} height={8} fill="#8e8e8e" />
        {[300, 360, 420, 480, 540, 600, 660, 720].map((x, i) => (
          <g key={i}>
            <line x1={x} y1={238} x2={x} y2={270 + (i % 3) * 14} stroke="#616161" strokeWidth={4} />
            {i % 3 === 0 && <ellipse cx={x} cy={300 + (i % 3) * 14} rx={14} ry={26} fill="#9e9e9e" />}
            {i % 3 === 1 && <path d={`M${x - 12} ${300} Q${x} ${340} ${x + 12} ${300}`} fill="none" stroke="#9e9e9e" strokeWidth={4} />}
            {i % 3 === 2 && <rect x={x - 6} y={290} width={12} height={60} rx={4} fill="#8d6e63" />}
          </g>
        ))}
      </g>

      <g transform={mid}>
        {/* Cabinets and the counter */}
        <rect x={-300} y={520} width={2800} height={FLOOR_Y - 520} fill="#a1785a" stroke="#5d4037" strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={-280 + i * 230} y={540} width={210} height={300} rx={6} fill="#b98a68" stroke="#5d4037" strokeWidth={3} />
        ))}
        <rect x={-300} y={490} width={2800} height={40} fill="#e8e0d4" stroke="#8d8374" strokeWidth={3} />
        {/* Stove with a pot, steam is drawn by the scene */}
        <rect x={80} y={450} width={280} height={40} fill="#37474f" />
        {[120, 190, 260, 320].map((x, i) => (
          <circle key={i} cx={x} cy={470} r={8} fill={i % 2 ? '#ff7043' : '#263238'} />
        ))}
        <rect x={80} y={490} width={280} height={30} fill="#eceff1" stroke="#90a4ae" strokeWidth={2} />
        <rect x={100} y={500} width={240} height={18} fill="#263238" opacity={0.35} />
        <ellipse cx={200} cy={440} rx={70} ry={20} fill="#607d8b" stroke="#37474f" strokeWidth={3} />
        <rect x={130} y={380} width={140} height={60} rx={8} fill="#b0bec5" stroke="#37474f" strokeWidth={3} />
        <rect x={140} y={392} width={120} height={30} rx={6} fill="#263238" />
        <circle cx={200} cy={407} r={6} fill="#ffb020" opacity={0.6 + 0.4 * Math.sin(t * 7)} />
        {/* Oven door */}
        <rect x={1000} y={540} width={260} height={230} rx={8} fill="#cfd8dc" stroke="#607d8b" strokeWidth={3} />
        <rect x={1020} y={560} width={220} height={150} rx={6} fill="#263238" />
        <rect x={1020} y={560} width={220} height={150} rx={6} fill="#ff8a50" opacity={0.2 + 0.1 * Math.sin(t * 5)} />
        {/* Cookie jar and a bread bin */}
        <ellipse cx={600} cy={440} rx={38} ry={44} fill="#c62828" stroke="#6d1b12" strokeWidth={3} />
        <rect x={580} y={392} width={40} height={18} fill="#8d6e63" />
        <rect x={860} y={420} width={110} height={70} rx={10} fill="#8d6e63" stroke="#4e342e" strokeWidth={3} />
      </g>

      {table && (
        <g transform={layer(1, camX)}>
          <rect x={860} y={740} width={520} height={18} rx={6} fill="#c6a06c" stroke="#5d4037" strokeWidth={3} />
          <rect x={890} y={758} width={20} height={142} fill="#8d6e63" />
          <rect x={1330} y={758} width={20} height={142} fill="#8d6e63" />
          <rect x={860} y={738} width={520} height={6} fill="#ffffff" opacity={0.7} />
        </g>
      )}

      <g transform={floor}>
        <rect x={-600} y={FLOOR_Y} width={3600} height={400} fill="url(#kitFloor)" />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={-600} x2={3000} y1={FLOOR_Y + 22 + i * 18} y2={FLOOR_Y + 22 + i * 18} stroke="#8d6e63" strokeWidth={1.5} opacity={0.5} />
        ))}
      </g>
    </g>
  );
};
