import React from 'react';
import { seeded } from '../utilities/math';

export interface SnowProps {
  frame: number;
  /** Rectangle the flakes fall through, in SVG units. */
  x: number;
  y: number;
  width: number;
  height: number;
  count?: number;
  /** Fall speed in px per frame. */
  speed?: number;
  seed?: number;
  opacity?: number;
}

/** Deterministic falling snow. Flakes wrap inside the rectangle, so no flake ever pops out. */
export const Snow: React.FC<SnowProps> = ({ frame, x, y, width, height, count = 80, speed = 1.4, seed = 7, opacity = 0.9 }) => {
  const r = seeded(seed);
  const flakes = Array.from({ length: count }, () => ({
    x0: r(),
    y0: r(),
    size: 1.2 + r() * 3.2,
    drift: 0.6 + r() * 1.2,
    phase: r() * Math.PI * 2,
    alpha: 0.45 + r() * 0.5,
  }));
  return (
    <g>
      {flakes.map((f, i) => {
        const fy = ((f.y0 * height + frame * speed * (0.6 + f.size / 4)) % height + height) % height;
        const fx = ((f.x0 * width + Math.sin(frame * 0.02 + f.phase) * 14 * f.drift + frame * 0.25 * f.drift) % width + width) % width;
        return <circle key={i} cx={(x + fx).toFixed(2)} cy={(y + fy).toFixed(2)} r={f.size.toFixed(2)} fill="#ffffff" opacity={(f.alpha * opacity).toFixed(3)} />;
      })}
    </g>
  );
};
