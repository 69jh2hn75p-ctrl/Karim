import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Stickman } from '../../characters/Stickman';
import { ROSTER } from '../../characters/roster';
import { activeLine, mouthFor, type DialogueTiming } from '../../engine/dialogue';
import { clamp, smooth } from '../../engine/math';
import { Subtitles } from '../../scenes/Subtitles';
import { TitleCard } from '../../scenes/TitleCard';
import { AshFront, Wasteland } from '../../scenes/Wasteland';
import timingJson from '../../generated/ep002/dialogue-timing.json';
import {
  EP2,
  EP2_SFX,
  TITLE_SPAN,
  ashAmount,
  boDrop,
  camera,
  charX,
  footstrikes,
  poseAt,
  radioLed,
} from './plan';

const timing = timingJson as DialogueTiming;
const LINES = timing.lines;
const STRIKES = footstrikes();

/** Music bed: fades in and out, ducks under speech, opens up for the final shot. */
const musicVolume = (f: number): number => {
  const intro = clamp(f / 30, 0, 1);
  const outro = clamp((EP2.totalFrames - f) / 60, 0, 1);
  const speaking = activeLine(LINES, f) ? 1 : 0;
  const swell = 0.06 * smooth(f, 780, 840);
  return (0.42 * (1 - 0.35 * speaking) + swell) * intro * outro;
};

/**
 * Episode 002 — "Ash Road". 30 s, 30 fps, 1920x1080.
 * Every frame is a pure function of the frame number, so any frame can be rendered or scrubbed.
 */
export const Episode002: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camera(frame);

  const renX = charX('ren', frame);
  const boX = charX('bo', frame);
  const boDropY = boDrop(frame);
  const speaker = activeLine(LINES, frame);

  // The plank under Bo breaks at frame 466 and falls away.
  const plankFall = Math.pow(clamp((frame - 466) / 30, 0, 1), 2) * 420;
  // The lamp on the ridge warms up during the last scene.
  const lamp = 0.2 + 0.8 * smooth(frame, 700, 820);

  const subFade = speaker
    ? Math.min(
        smooth(frame, speaker.startFrame, speaker.startFrame + 6),
        1 - smooth(frame, speaker.startFrame + speaker.durationFrames - 6, speaker.startFrame + speaker.durationFrames),
      )
    : 0;

  const dusk = smooth(frame, 800, 900);

  return (
    <AbsoluteFill style={{ background: '#0b0a0d' }}>
      <svg
        width={EP2.width}
        height={EP2.height}
        viewBox={`0 0 ${EP2.width} ${EP2.height}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <g transform={`translate(${EP2.width / 2} ${EP2.height / 2}) scale(${cam.zoom}) translate(${-cam.x} ${-cam.y})`}>
          <Wasteland
            frame={frame}
            camX={cam.x}
            ash={ashAmount(frame)}
            radio={radioLed(frame)}
            lamp={lamp}
            plankFall={plankFall}
          />
          {boDropY < 5 && (
            <ellipse cx={boX} cy={EP2.groundY + 3} rx={72} ry={12} fill="#000" opacity={0.45} />
          )}
          <ellipse cx={renX} cy={EP2.groundY + 3} rx={72} ry={12} fill="#000" opacity={0.45} />
          <Stickman
            x={boX}
            pose={poseAt('bo', frame, speaker?.speaker === 'bo')}
            accent={ROSTER.bo.accent}
            accessory={ROSTER.bo.accessory}
            mouth={mouthFor(LINES, 'bo', frame)}
            eyeOpen={1 + 0.3 * clamp((frame - 466) / 20, 0, 1)}
            drop={boDropY}
          />
          <Stickman
            x={renX}
            pose={poseAt('ren', frame, speaker?.speaker === 'ren')}
            accent={ROSTER.ren.accent}
            accessory={ROSTER.ren.accessory}
            mouth={mouthFor(LINES, 'ren', frame)}
          />
          <AshFront frame={frame} camX={cam.x} amount={ashAmount(frame)} />
        </g>
      </svg>

      {/* Warm, dusty grade with a vignette; it deepens into dusk in the last scene. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(120,60,30,${0.06 + 0.06 * dusk}) 40%, rgba(0,0,0,${0.5 + 0.2 * dusk}) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {speaker && (
        <Subtitles
          speaker={ROSTER[speaker.speaker].name}
          text={speaker.text}
          accent={ROSTER[speaker.speaker].accent}
          opacity={subFade}
        />
      )}

      <TitleCard frame={frame} fps={EP2.fps} span={TITLE_SPAN} kicker="EPISODE 002" word="ASH ROAD" />

      <Audio src={staticFile('ep002/audio/music.wav')} volume={musicVolume} />
      {STRIKES.map((s) => (
        <Sequence key={`step-${s.id}-${s.frame}`} from={s.frame} durationInFrames={12}>
          <Audio src={staticFile('ep002/sfx/footstep.wav')} volume={s.id === 'ren' ? 0.4 : 0.3} />
        </Sequence>
      ))}
      {EP2_SFX.map((c) => (
        <Sequence key={`${c.id}-${c.frame}`} from={c.frame} durationInFrames={90}>
          <Audio src={staticFile(`ep002/${c.file}`)} volume={c.volume} />
        </Sequence>
      ))}
      {LINES.map((l) => (
        <Sequence key={l.id} from={l.startFrame} durationInFrames={l.durationFrames + 4}>
          <Audio src={staticFile(`ep002/audio/${l.audioFile}`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
