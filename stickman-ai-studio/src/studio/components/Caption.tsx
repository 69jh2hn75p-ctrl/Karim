import React from 'react';

/** Bottom caption for dialogue and narration. Speaker name in gold, voice-over in italics. */
export const Caption: React.FC<{ text: string; speaker: string; vo: boolean; visible: boolean }> = ({ text, speaker, vo, visible }) => {
  if (!visible || !text) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 60,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(8, 10, 18, 0.78)',
          borderRadius: 14,
          padding: '14px 30px 16px',
          maxWidth: 1400,
          fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
          color: '#f7f2e6',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#f4c430', fontSize: 26, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {speaker}
          {vo ? ' (narration)' : ''}
        </div>
        <div style={{ fontSize: 40, lineHeight: 1.25, marginTop: 4, fontStyle: vo ? 'italic' : 'normal' }}>{text}</div>
      </div>
    </div>
  );
};
