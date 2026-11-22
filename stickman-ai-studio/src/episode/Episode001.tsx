import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Stickman } from '../characters/Stickman';
import { buildPose } from '../characters/pose';
import { ROSTER } from '../characters/roster';
import { cameraAt } from '../engine/camera';
import { activeLine, DialogueTiming, mouthFor } from '../engine/dialogue';
import {
  charX,
  doorOpen,
  footstrikes,
  labLight,
  panelGlow,
  pointWeight,
  surpriseWeight,
  walkPhase,
  walkWeight,
} from '../engine/choreography';
import { clamp, smooth } from '../engine/math';
import { FPS, GROUND_Y, HEIGHT, SFX_CUES, TOTAL_FRAMES, WIDTH } from '../engine/timeline';
import { Background } from '../scenes/Background';
import { Subtitles } from '../scenes/Subtitles';
import { TitleCard } from '../scenes/TitleCard';
import timingJson from '../generated/dialogue-timing.json';

const timing = timingJson as DialogueTiming;
const LINES = timing.lines;
const STRIKES = footstrikes();

/** Music bed: fades in and out, ducks under speech, swells for the title. */
const musicVolume = (f: number): number => {
  const intro = clamp(f / 30, 0, 1);
  const outro = clamp((TOTAL_FRAMES - f) / 60, 0, 1);
  const speaking = activeLine(LINES, f) ? 1 : 0;
  const swell = 0.08 * smooth(f, 600, 650);
  return (0.4 * (1 - 0.4 * speaking) + swell) * intro * outro;
};

/**
 * Episode 001 — "The Lab Below". 24 s, 30 fps, 1920x1080.
 * Everything here is a pure function of the frame, so any frame can be rendered or scrubbed.
 */
export const Episode001: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);

  const renX = charX('ren', frame);
  const boX = charX('bo', frame);
  const speaker = activeLine(LINES, frame);

  const renPose = buildPose({
    frame,
    walkWeight: walkWeight('ren', frame),
    phase: walkPhase(frame),
    point: pointWeight(frame),
    speaking: speaker?.speaker === 'ren' ? 1 : 0,
  });
  const surprise = surpriseWeight(frame);
  const boPose = buildPose({
    frame,
    walkWeight: walkWeight('bo', frame),
    phase: walkPhase(frame),
    surprise,
    speaking: speaker?.speaker === 'bo' ? 1 : 0,
  });

  const subFade = speaker
    ? Math.min(
        smooth(frame, speaker.startFrame, speaker.startFrame + 6),
        1 - smooth(frame, speaker.startFrame + speaker.durationFrames - 6, speaker.startFrame + speaker.durationFrames),
      )
    : 0;

  return (
    <AbsoluteFill style={{ background: '#05060b' }}>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <g transform={`translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${cam.zoom}) translate(${-cam.x} ${-cam.y})`}>
          <Background
            frame={frame}
            camX={cam.x}
            panelGlow={panelGlow(frame)}
            doorOpen={doorOpen(frame)}
            labLight={labLight(frame)}
          />
          {[boX, renX].map((x, i) => (
            <ellipse key={i} cx={x} cy={GROUND_Y + 3} rx={72} ry={12} fill="#000" opacity={0.45} />
          ))}
          <Stickman
            x={boX}
            pose={boPose}
            accent={ROSTER.bo.accent}
            accessory={ROSTER.bo.accessory}
            mouth={mouthFor(LINES, 'bo', frame)}
            eyeOpen={1 + 0.5 * surprise}
          />
          <Stickman
            x={renX}
            pose={renPose}
            accent={ROSTER.ren.accent}
            accessory={ROSTER.ren.accessory}
            mouth={mouthFor(LINES, 'ren', frame)}
          />
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
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

      <TitleCard frame={frame} fps={FPS} />

      {/* Audio: every asset is a file in public/, built by scripts/build-audio.ts. */}
      <Audio src={staticFile('audio/music.wav')} volume={musicVolume} />
      {STRIKES.map((s) => (
        <Sequence key={`step-${s.id}-${s.frame}`} from={s.frame} durationInFrames={12}>
          <Audio src={staticFile('sfx/footstep.wav')} volume={s.id === 'ren' ? 0.4 : 0.3} />
        </Sequence>
      ))}
      {SFX_CUES.map((c) => (
        <Sequence key={`${c.id}-${c.frame}`} from={c.frame} durationInFrames={90}>
          <Audio src={staticFile(c.file)} volume={c.volume} />
        </Sequence>
      ))}
      {LINES.map((l) => (
        <Sequence key={l.id} from={l.startFrame} durationInFrames={l.durationFrames + 4}>
          <Audio src={staticFile(`audio/${l.audioFile}`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
