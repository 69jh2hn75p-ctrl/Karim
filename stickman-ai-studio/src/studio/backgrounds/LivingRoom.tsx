import React from 'react';
import { Snow } from '../effects/Snow';

/**
 * The family living room. World space: floor at y = 900, the room spans roughly x 0..2400.
 * Three depth layers with parallax: far wall (0.5), midground furniture (0.8), floor (1.0),
 * plus a foreground plant (1.3) that sweeps past the camera.
 */
export const FLOOR_Y = 900;

const layer = (k: number, camX: number): string => `translate(${(camX * (1 - k)).toFixed(2)} 0)`;

/** One flame: a teardrop that breathes and leans with a slow sway. */
const flame = (cx: number, base: number, h: number, t: number, phase: number, color: string) => {
  const hh = h * (0.85 + 0.15 * Math.sin(t * 9 + phase));
  const sway = 4 * Math.sin(t * 5 + phase * 1.7);
  const w = 16 + 3 * Math.sin(t * 7 + phase);
  return (
    <path
      key={`${cx}-${phase}`}
      d={`M${cx - w} ${base} Q${cx + sway * 0.4 - w * 0.2} ${base - hh * 0.55} ${cx + sway} ${base - hh} Q${cx + sway * 0.4 + w * 0.5} ${base - hh * 0.5} ${cx + w} ${base} Z`}
      fill={color}
      opacity={0.92}
    />
  );
};

export interface LivingRoomProps {
  frame: number;
  /** Seconds since the start of the composition, for animation timing. */
  t: number;
  camX: number;
  /** 0..1 brightness of the room lights. */
  warmth?: number;
}

export const LivingRoom: React.FC<LivingRoomProps> = ({ frame, t, camX, warmth = 1 }) => {
  const far = layer(0.5, camX);
  const mid = layer(0.8, camX);
  const floorL = layer(1, camX);
  const fireGlow = 0.75 + 0.25 * Math.sin(t * 6.1) * Math.sin(t * 2.3 + 1);

  return (
    <g>
      <defs>
        <radialGradient id="roomGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb55a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffb55a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1b3a" />
          <stop offset="1" stopColor="#24406b" />
        </linearGradient>
        <linearGradient id="floorWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4a2e" />
          <stop offset="1" stopColor="#4a2a1a" />
        </linearGradient>
        <linearGradient id="sofaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f7d6f" />
          <stop offset="1" stopColor="#24524a" />
        </linearGradient>
      </defs>

      {/* FAR WALL */}
      <g transform={far}>
        <rect x={-600} y={-300} width={3600} height={FLOOR_Y + 300} fill="#24473a" />
        {Array.from({ length: 60 }, (_, i) => (
          <rect key={i} x={-600 + i * 60} y={-300} width={6} height={FLOOR_Y + 300} fill="#ffffff" opacity={0.035} />
        ))}
        {/* Garland of warm lights across the top, each bulb blinking */}
        <path d="M-200 120 Q600 170 1400 120 Q2000 80 2600 130" fill="none" stroke="#0f2a20" strokeWidth={4} />
        {Array.from({ length: 36 }, (_, i) => {
          const gx = -200 + i * 85;
          const gy = 120 + Math.sin((gx + 200) / 260) * 14 + (i % 2 ? 4 : 0);
          const on = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.3));
          const colors = ['#ffd54f', '#ff5252', '#69f0ae', '#40c4ff'];
          return (
            <g key={i} opacity={on * warmth}>
              <circle cx={gx} cy={gy + 6} r={11} fill={colors[i % colors.length]} opacity={0.25} />
              <circle cx={gx} cy={gy + 6} r={5} fill={colors[i % colors.length]} />
            </g>
          );
        })}
        {/* Window with snowy night outside */}
        <rect x={1500} y={170} width={330} height={360} fill="#f6efe0" stroke="#7a5a3a" strokeWidth={10} />
        <rect x={1515} y={185} width={300} height={330} fill="url(#nightSky)" />
        <circle cx={1700} cy={260} r={34} fill="#fff8e1" opacity={0.92} />
        <path d="M1515 455 Q1600 380 1690 430 Q1760 390 1815 440 L1815 515 L1515 515 Z" fill="#dfe9f5" />
        <path d="M1515 490 Q1620 440 1815 480 L1815 515 L1515 515 Z" fill="#c7d8ec" />
        <g>
          <Snow frame={frame} x={1515} y={185} width={300} height={330} count={46} speed={1.1} seed={21} />
        </g>
        <rect x={1652} y={185} width={8} height={330} fill="#f6efe0" />
        <rect x={1515} y={352} width={300} height={8} fill="#f6efe0" />
        {/* Curtains and tiebacks */}
        <path d="M1440 150 Q1470 330 1450 560 L1520 560 Q1505 330 1530 150 Z" fill="#b3261e" />
        <path d="M1880 150 Q1850 330 1870 560 L1800 560 Q1815 330 1790 150 Z" fill="#b3261e" />
        <circle cx={1452} cy={330} r={9} fill="#e0b050" />
        <circle cx={1868} cy={330} r={9} fill="#e0b050" />
        {/* Window wreath */}
        <circle cx={1665} cy={560} r={62} fill="none" stroke="#1d6a3a" strokeWidth={22} />
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <circle key={i} cx={1665 + Math.cos(a) * 62} cy={560 + Math.sin(a) * 62} r={5} fill={i % 3 ? '#c62828' : '#ffd54f'} />;
        })}
        <path d="M1655 614 L1640 652 M1675 614 L1690 652" stroke="#c62828" strokeWidth={5} strokeLinecap="round" />
        {/* Family photos */}
        {[1080, 1180].map((px, i) => (
          <g key={i}>
            <rect x={px} y={250 + i * 20} width={74} height={90} fill="#f8f5ee" stroke="#6b4a2a" strokeWidth={5} />
            <rect x={px + 8} y={258 + i * 20} width={58} height={70} fill={i ? '#8fb8d0' : '#f2c58e'} />
            <circle cx={px + 37} cy={282 + i * 20} r={11} fill="#c8794a" />
          </g>
        ))}
      </g>

      {/* MIDGROUND: fireplace, mantel, sofa */}
      <g transform={mid}>
        {/* Brick surround */}
        <rect x={250} y={470} width={470} height={FLOOR_Y - 470} fill="#7a3b2e" />
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={250} x2={720} y1={490 + i * 26} y2={490 + i * 26} stroke="#5a2a20" strokeWidth={2} />
        ))}
        {/* Mantel shelf */}
        <rect x={230} y={520} width={510} height={24} fill="#5a3b26" stroke="#2c1a10" strokeWidth={3} />
        {/* Firebox */}
        <path d={`M360 ${FLOOR_Y} L360 720 Q360 640 485 640 Q610 640 610 720 L610 ${FLOOR_Y} Z`} fill="#140b08" />
        <ellipse cx={485} cy={FLOOR_Y - 20} rx={190} ry={120} fill="url(#roomGlow)" opacity={fireGlow} />
        {/* Logs and flames */}
        <rect x={390} y={FLOOR_Y - 26} width={190} height={16} rx={6} fill="#4a2a16" />
        <g opacity={fireGlow}>
          {flame(440, FLOOR_Y - 26, 120, t, 0, '#ff7a1a')}
          {flame(505, FLOOR_Y - 26, 160, t, 1.7, '#ffb020')}
          {flame(470, FLOOR_Y - 26, 90, t, 3.1, '#ffe27a')}
          {flame(540, FLOOR_Y - 26, 100, t, 4.4, '#ff5a1f')}
        </g>
        {/* Stockings hanging from the mantel */}
        {[
          { x: 300, c: '#b3261e' },
          { x: 380, c: '#2e7d4f' },
          { x: 640, c: '#b3261e' },
        ].map((s, i) => (
          <g key={i} transform={`translate(${s.x} 544) rotate(${Math.sin(t * 1.4 + i) * 1.2})`}>
            <path d="M-18 0 L18 0 L18 44 Q34 52 34 74 Q34 92 16 92 L-6 92 Q-18 92 -18 74 Z" fill={s.c} stroke="#2b1b12" strokeWidth={2.5} />
            <rect x={-20} y={-4} width={40} height={14} rx={4} fill="#f8f5ee" stroke="#2b1b12" strokeWidth={2} />
            <path d="M-6 60 L4 60 M-6 68 L4 68" stroke="#f8f5ee" strokeWidth={3} />
          </g>
        ))}
        {/* Candles on the mantel */}
        {[280, 720].map((cx, i) => (
          <g key={i}>
            <rect x={cx - 9} y={470} width={18} height={50} fill="#fff4dc" stroke="#c9b48a" strokeWidth={1.5} />
            <path d={`M${cx} 466 Q${cx - 6} 452 ${cx} 440 Q${cx + 6} 452 ${cx} 466`} fill="#ffb020" opacity={0.9 + 0.1 * Math.sin(t * 13 + i)} />
          </g>
        ))}
        {/* Sofa */}
        <rect x={930} y={770} width={380} height={FLOOR_Y - 770} rx={22} fill="url(#sofaGrad)" stroke="#1d3f39" strokeWidth={3} />
        <rect x={944} y={740} width={352} height={70} rx={22} fill="#2e6257" stroke="#1d3f39" strokeWidth={3} />
        <rect x={960} y={820} width={150} height={50} rx={14} fill="#c42727" opacity={0.85} />
        <rect x={1120} y={822} width={150} height={48} rx={14} fill="#f4c430" opacity={0.85} />
      </g>

      {/* FLOOR AND RUG */}
      <g transform={floorL}>
        <rect x={-600} y={FLOOR_Y} width={3600} height={400} fill="url(#floorWood)" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={-600} x2={3000} y1={FLOOR_Y + 30 + i * i * 6 + i * 14} y2={FLOOR_Y + 30 + i * i * 6 + i * 14} stroke="#3a2214" strokeWidth={2} opacity={0.6} />
        ))}
        <ellipse cx={1000} cy={FLOOR_Y + 40} rx={700} ry={70} fill="#8b1e2b" stroke="#e0b050" strokeWidth={6} />
        <ellipse cx={1000} cy={FLOOR_Y + 40} rx={640} ry={50} fill="none" stroke="#f4c430" strokeWidth={2} strokeDasharray="8 10" opacity={0.7} />
      </g>

      {/* FOREGROUND: a potted plant that sits closest to the lens */}
      <g transform={layer(1.3, camX)}>
        <rect x={-60} y={FLOOR_Y + 120} width={140} height={120} rx={12} fill="#8a4a2a" stroke="#4a2a16" strokeWidth={3} />
        {Array.from({ length: 9 }, (_, i) => {
          const a = -1.1 + i * 0.27;
          return (
            <path
              key={i}
              d={`M10 ${FLOOR_Y + 120} Q${10 + Math.sin(a) * 120} ${FLOOR_Y - 60} ${10 + Math.sin(a) * 200} ${FLOOR_Y - 120 + Math.cos(a) * 40}`}
              fill="none"
              stroke="#1f6b3a"
              strokeWidth={26}
              strokeLinecap="round"
              opacity={0.95}
            />
          );
        })}
      </g>
    </g>
  );
};
