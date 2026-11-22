import React from 'react';
import { spring } from 'remotion';
import { TITLE_SPAN } from '../engine/timeline';
import { smooth } from '../engine/math';

/** Episode title: letters spring into place one by one, then fade out. Defaults are Episode 001. */
export const TitleCard: React.FC<{
  frame: number;
  fps: number;
  span?: { from: number; to: number };
  kicker?: string;
  word?: string;
}> = ({ frame, fps, span = TITLE_SPAN, kicker = 'EPISODE 001', word = 'THE LAB BELOW' }) => {
  const { from, to } = span;
  const opacity = smooth(frame, from, from + 20) * (1 - smooth(frame, to - 20, to));
  if (opacity <= 0.001) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 250,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: '#5ee6ff',
          letterSpacing: 8,
          fontSize: 30,
          fontWeight: 600,
          fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
        }}
      >
        {kicker}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {[...word].map((ch, i) => {
          const s = spring({ frame: frame - from - 4 - i * 2, fps, config: { damping: 14, mass: 0.6 } });
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize: 120,
                fontWeight: 800,
                color: '#f5f2ea',
                fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
                transform: `translateY(${(1 - s) * 40}px)`,
                opacity: Math.max(0, Math.min(1, s)),
                textShadow: '0 0 30px rgba(94, 230, 255, 0.35)',
              }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};
