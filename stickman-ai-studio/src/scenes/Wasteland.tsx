import React from 'react';
import { EP2 } from '../episodes/ep002/plan';

/**
 * Post-apocalyptic world for Episode 002, in world space. Each layer has a parallax
 * factor k (same convention as the lab background): smaller k drifts slower, i.e. further away.
 */
const G = EP2.groundY;

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

const f1 = (n: number): string => n.toFixed(1);

/** Broken skyline: jagged silhouettes with some floors missing. */
const SKYLINE: string[] = (() => {
  const r = rng(11);
  return Array.from({ length: 26 }, (_, i) => {
    const x = -1200 + i * 190 + r() * 60;
    const w = 120 + r() * 130;
    const h = 260 + r() * 420;
    const broken = r() > 0.4;
    const top = G - h;
    const cut = broken ? 40 : 0;
    return `M${f1(x)} ${G} L${f1(x)} ${f1(top + cut)} L${f1(x + w * 0.3)} ${f1(top + cut + 50)} L${f1(x + w * 0.55)} ${f1(top)} L${f1(x + w)} ${f1(top + (broken ? 20 : 0))} L${f1(x + w)} ${G} Z`;
  });
})();

/** Rubble blocks along the road. */
const RUBBLE = (() => {
  const r = rng(23);
  return Array.from({ length: 40 }, (_, i) => ({
    x: -900 + i * 120 + r() * 50,
    w: 40 + r() * 90,
    h: 18 + r() * 60,
  }));
})();

const CRACKS = (() => {
  const r = rng(31);
  return Array.from({ length: 18 }, () => {
    const x = -600 + r() * 2600;
    const y = G + 20 + r() * 380;
    const dx = 60 + r() * 140;
    const dy = (r() - 0.5) * 60;
    return { x, y, dx, dy };
  });
})();

/** Ash flakes. Two depths: behind the characters and in front of them. */
interface AshParticle {
  x0: number;
  y0: number;
  v: number;
  r: number;
  a: number;
}
const makeAsh = (seed: number, n: number): AshParticle[] => {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    x0: -1000 + r() * 4400,
    y0: r() * 1200,
    v: 1.2 + r() * 2.4,
    r: 1 + r() * 2.2,
    a: 0.3 + r() * 0.5,
  }));
};
const ASH_FAR = makeAsh(41, 140);
const ASH_NEAR = makeAsh(53, 36);

const wrapX = (x: number): number => -1000 + ((((x + 1000) % 4400) + 4400) % 4400);

/** Falling ash with a steady wind drift. `amount` scales how many flakes show. */
function AshLayer({
  frame,
  particles,
  amount,
  wind,
}: {
  frame: number;
  particles: AshParticle[];
  amount: number;
  wind: number;
}): React.ReactElement {
  return (
    <>
      {particles.map((p, i) => {
        if (i / particles.length > amount) return null;
        const y = ((p.y0 + frame * p.v) % 1200) - 80;
        const x = wrapX(p.x0 + frame * wind + Math.sin(frame * 0.03 + i) * 14);
        return <circle key={i} cx={f1(x)} cy={f1(y)} r={p.r} fill="#d9cfc0" opacity={p.a * amount} />;
      })}
    </>
  );
}

export interface WastelandProps {
  frame: number;
  camX: number;
  /** 0..1 how much ash is falling. */
  ash: number;
  /** 0..1 radio LED brightness. */
  radio: number;
  /** 0..1 glow of the distant lamp. */
  lamp: number;
  /** Vertical fall of the broken plank in world units. */
  plankFall: number;
}

export const Wasteland: React.FC<WastelandProps> = ({ frame, camX, ash, radio, lamp, plankFall }) => {
  const far = layer(0.25, camX);
  const towerLayer = layer(0.5, camX);
  const mid = layer(0.8, camX);

  return (
    <g>
      <defs>
        <linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16141a" />
          <stop offset="0.55" stopColor="#3a3038" />
          <stop offset="0.9" stopColor="#8b5b3d" />
          <stop offset="1" stopColor="#5a3a2c" />
        </linearGradient>
        <radialGradient id="wSun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f0a060" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f0a060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2420" />
          <stop offset="1" stopColor="#120e0c" />
        </linearGradient>
        <radialGradient id="wLamp" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd08a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd08a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wRadio" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ff6a3d" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff6a3d" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={-1200} y={-600} width={4800} height={G + 740} fill="url(#wSky)" />
      <circle cx={2100} cy={G - 260} r={420} fill="url(#wSun)" />

      <g transform={far}>
        {SKYLINE.map((d, i) => (
          <path key={i} d={d} fill="#241f26" />
        ))}
      </g>

      <g transform={towerLayer}>
        {/* Water tower: the goal of Scene 2. */}
        <path d={`M${660 - 60} ${G - 250} L${660 - 40} ${G - 340} M${660 + 60} ${G - 250} L${660 + 40} ${G - 340}`} stroke="#3a332d" strokeWidth={10} />
        <rect x={600} y={G - 380} width={120} height={70} rx={10} fill="#3a332d" />
        <path d={`M600 ${G - 380} L660 ${G - 430} L720 ${G - 380} Z`} fill="#3a332d" />
        <rect x={642} y={G - 366} width={18} height={10} fill="#16110f" />
        <circle cx={1900} cy={G - 380} r={130} fill="url(#wLamp)" opacity={lamp} />
      </g>

      <g transform={mid}>
        {RUBBLE.map((b, i) => (
          <rect key={i} x={b.x} y={G - b.h} width={b.w} height={b.h} fill="#2e2622" />
        ))}
      </g>

      <rect x={-1200} y={G} width={4800} height={800} fill="url(#wRoad)" />
      {CRACKS.map((c, i) => (
        <line key={i} x1={f1(c.x)} y1={f1(c.y)} x2={f1(c.x + c.dx)} y2={f1(c.y + c.dy)} stroke="#050404" strokeWidth={3} opacity={0.7} />
      ))}

      {/* Bridge over a chasm, from x=960 to 1760. Plank 0 is the one that breaks under Bo. */}
      <rect x={960} y={G} width={800} height={600} fill="#050406" />
      {[1000, 1240, 1480, 1720].map((x) => (
        <rect key={x} x={x - 8} y={G + 18} width={14} height={260} fill="#1a1614" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x={960 + i * 80}
          y={G}
          width={74}
          height={18}
          fill="#5a4636"
          transform={i === 0 ? `translate(0 ${f1(plankFall)})` : undefined}
        />
      ))}

      {/* Dry standpipe: nothing comes out. */}
      <rect x={486} y={G - 80} width={28} height={80} fill="#4a2e24" />
      <rect x={472} y={G - 96} width={56} height={18} fill="#5a3a2e" />
      <rect x={448} y={G - 64} width={26} height={12} fill="#5a3a2e" />

      {/* Bunker door with a blinking radio LED. */}
      <rect x={2440} y={260} width={320} height={G - 260} fill="#1a1716" />
      <rect x={2480} y={500} width={240} height={G - 500} fill="#2b2624" stroke="#4a423c" strokeWidth={6} />
      <circle cx={2680} cy={680} r={9} fill="#4a423c" />
      <circle cx={2600} cy={580} r={60} fill="url(#wRadio)" opacity={radio} />
      <circle cx={2600} cy={580} r={9} fill="#ff6a3d" opacity={0.2 + 0.8 * radio} />

      <g transform={layer(1, camX)}>
        <AshLayer frame={frame} particles={ASH_FAR} amount={ash} wind={0.4} />
      </g>
    </g>
  );
};

/** Near ash, drawn in front of the characters for depth. */
export const AshFront: React.FC<{ frame: number; camX: number; amount: number }> = ({ frame, camX, amount }) => (
  <g transform={layer(1.25, camX)}>
    <AshLayer frame={frame} particles={ASH_NEAR} amount={amount} wind={0.9} />
  </g>
);
