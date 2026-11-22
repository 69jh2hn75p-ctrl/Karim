import React from 'react';
import { DOOR_X, GROUND_Y, PANEL_X } from '../engine/timeline';

/**
 * Layered lab environment in world space. Each layer has a parallax factor k:
 * k = 1 moves with the ground, smaller values drift slower (further away).
 */
const layer = (k: number, camX: number): string => `translate(${(camX * (1 - k)).toFixed(2)} 0)`;

/** Deterministic pseudo-random so every render is identical. */
function rng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n: number) => n.toFixed(1);

const ARCHES: string[] = (() => {
  const r = rng(7);
  return Array.from({ length: 10 }, (_, i) => {
    const x0 = -1000 + i * 420 + r() * 60;
    const w = 340 + r() * 120;
    const h = 180 + r() * 170;
    return `M${f1(x0)} ${GROUND_Y} L${f1(x0)} ${f1(GROUND_Y - h)} Q${f1(x0 + w / 2)} ${f1(GROUND_Y - h - 200)} ${f1(x0 + w)} ${f1(GROUND_Y - h)} L${f1(x0 + w)} ${GROUND_Y} Z`;
  });
})();

const RIBS: number[] = Array.from({ length: 18 }, (_, i) => -1000 + i * 300);

const CONSOLES: number[] = [DOOR_X + 380, DOOR_X + 800, DOOR_X + 1180];

const DUST = (() => {
  const r = rng(42);
  return Array.from({ length: 70 }, () => ({
    x: -1200 + r() * 4800,
    y: 120 + r() * 700,
    r: 1 + r() * 2.2,
    v: 0.15 + r() * 0.45,
    a: 0.25 + r() * 0.5,
  }));
})();

/** Wrap x into [-1200, 3600) so dust drifts forever without popping. */
const wrap = (x: number): number => -1200 + ((((x + 1200) % 4800) + 4800) % 4800);

export interface BackgroundProps {
  frame: number;
  camX: number;
  /** 0..1 */
  panelGlow: number;
  /** 0..1 */
  doorOpen: number;
  /** 0..1 */
  labLight: number;
}

export const Background: React.FC<BackgroundProps> = ({ frame, camX, panelGlow, doorOpen, labLight }) => {
  const far = layer(0.35, camX);
  const mid = layer(0.65, camX);
  const dust = layer(0.5, camX);

  return (
    <g>
      <defs>
        <radialGradient id="bgCeil" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#1d2445" />
          <stop offset="60%" stopColor="#0c0f1d" />
          <stop offset="100%" stopColor="#05060b" />
        </radialGradient>
        <linearGradient id="bgFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1f30" />
          <stop offset="1" stopColor="#07080e" />
        </linearGradient>
        <radialGradient id="panelHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5ee6ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#5ee6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="doorSpill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8ff6ff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#8ff6ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f3d4f" stopOpacity="0" />
          <stop offset="0.35" stopColor="#0f3d4f" stopOpacity="1" />
          <stop offset="1" stopColor="#06141c" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b6785" />
          <stop offset="0.5" stopColor="#3a4358" />
          <stop offset="1" stopColor="#262c3d" />
        </linearGradient>
      </defs>

      <rect x={-1200} y={-600} width={4800} height={1500} fill="url(#bgCeil)" />

      <g transform={far}>
        {ARCHES.map((d, i) => (
          <path key={i} d={d} fill="#121731" opacity={0.95} />
        ))}
      </g>

      <g transform={mid}>
        {RIBS.map((x) => (
          <rect key={x} x={x} y={-200} width={28} height={GROUND_Y + 200} fill="#161b31" />
        ))}
        {[260, 520].map((y) => (
          <rect key={y} x={-1200} y={y} width={4800} height={5} fill="#3a5a8a" opacity={0.45} />
        ))}
      </g>

      {/* Circuit panel that lights up when Bo and Ren notice it. */}
      <circle cx={PANEL_X} cy={450} r={260} fill="url(#panelHalo)" opacity={0.15 + 0.7 * panelGlow} />
      <rect x={PANEL_X - 130} y={300} width={260} height={330} rx={14} fill="#0a0d18" stroke="#2c3a5e" strokeWidth={4} />
      <rect x={PANEL_X - 112} y={318} width={224} height={294} rx={8} fill="#5ee6ff" opacity={0.08 + 0.75 * panelGlow} />
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={PANEL_X - 96 + (i % 4) * 52}
          y={340 + Math.floor(i / 4) * 62}
          width={36}
          height={36}
          rx={4}
          fill="#ddffff"
          opacity={(i * 7) % 3 === 0 ? 0.15 : 0.1 + 0.8 * panelGlow * ((i * 5) % 4 === 0 ? 0.4 : 1)}
        />
      ))}

      {/* Lab interior revealed behind the door. */}
      <rect x={DOOR_X + 220} y={250} width={1400} height={GROUND_Y - 250} fill="url(#labGrad)" opacity={0.3 + 0.7 * labLight} />
      {CONSOLES.map((x, i) => (
        <g key={x}>
          <rect x={x} y={GROUND_Y - 120} width={180} height={120} rx={6} fill="#0d2430" />
          <rect x={x + 12} y={GROUND_Y - 176} width={156} height={62} rx={6} fill="#0c3442" />
          {[0, 1, 2].map((k) => (
            <circle
              key={k}
              cx={x + 34 + k * 40}
              cy={GROUND_Y - 80}
              r={7}
              fill={k === 1 ? '#ffb454' : '#5ee6ff'}
              opacity={labLight * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.2 + i * 2 + k)))}
            />
          ))}
        </g>
      ))}

      {/* Door: a steel leaf slides into the wall; light spills out through the gap. */}
      <rect x={DOOR_X - 20} y={290} width={240} height={GROUND_Y - 290} fill="#080a12" stroke="#2c3a5e" strokeWidth={6} />
      <rect x={DOOR_X + 20} y={GROUND_Y - 20} width={200 * doorOpen + 60} height={20} fill="url(#doorSpill)" opacity={doorOpen} />
      <rect x={DOOR_X + 20} y={310} width={200 * doorOpen + 40} height={GROUND_Y - 310} fill="url(#doorSpill)" opacity={0.7 * doorOpen} />
      <rect x={DOOR_X + 200 * doorOpen} y={310} width={200 * (1 - doorOpen)} height={GROUND_Y - 310} fill="url(#steel)" />

      <rect x={-1200} y={GROUND_Y} width={4800} height={800} fill="url(#bgFloor)" />
      <line x1={-1200} y1={GROUND_Y} x2={3600} y2={GROUND_Y} stroke="#5ee6ff" strokeOpacity={0.35} strokeWidth={3} />

      <g transform={dust}>
        {DUST.map((p, i) => (
          <circle key={i} cx={f1(wrap(p.x + frame * p.v))} cy={p.y} r={p.r} fill="#cfe9ff" opacity={p.a} />
        ))}
      </g>
    </g>
  );
};
