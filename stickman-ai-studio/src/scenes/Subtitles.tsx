import React from 'react';

export interface SubtitlesProps {
  speaker: string;
  text: string;
  accent: string;
  opacity: number;
}

/** Bottom-centre caption with the speaker's identity colour. Opacity is driven by the frame. */
export const Subtitles: React.FC<SubtitlesProps> = ({ speaker, text, accent, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 48,
      display: 'flex',
      justifyContent: 'center',
      opacity,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        background: 'rgba(5, 7, 14, 0.74)',
        borderLeft: `6px solid ${accent}`,
        borderRadius: 10,
        padding: '14px 28px 16px',
        maxWidth: 1300,
        fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
      }}
    >
      <div style={{ color: accent, fontSize: 26, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {speaker}
      </div>
      <div style={{ color: '#f5f2ea', fontSize: 42, lineHeight: 1.25, marginTop: 2 }}>{text}</div>
    </div>
  </div>
);
