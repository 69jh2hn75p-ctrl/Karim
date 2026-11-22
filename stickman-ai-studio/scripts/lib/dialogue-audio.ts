/** Shared dialogue rendering for every episode: TTS, loudness, file output, mouth envelope. */
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { ROSTER } from '../../src/characters/roster';
import type { DialogueLine } from '../../src/engine/dialogue';
import type { CharacterId } from '../../src/engine/timeline';
import type { TtsProvider } from './tts';
import { normalizePeak } from './synth';
import { encodeWav, resampleLinear } from './wav';

export const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/** Mouth envelope: RMS per video frame, normalised to the line peak, lightly smoothed. */
export function envelopeFor(samples: Float32Array, sampleRate: number, durationFrames: number, fps: number): number[] {
  const window = sampleRate / fps;
  const raw: number[] = [];
  for (let f = 0; f < durationFrames; f++) {
    const start = Math.floor(f * window);
    const end = Math.min(samples.length, Math.floor((f + 1) * window));
    let sum = 0;
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    raw.push(end > start ? Math.sqrt(sum / (end - start)) : 0);
  }
  const peak = Math.max(...raw, 1e-9);
  const norm = raw.map((v) => Math.min(1, v / peak));
  return norm.map((_, i) => {
    const a = norm[Math.max(0, i - 1)];
    const b = norm[i];
    const c = norm[Math.min(norm.length - 1, i + 1)];
    return round3((a + 2 * b + c) / 4);
  });
}

export interface DialogueJob {
  id: string;
  speaker: CharacterId;
  text: string;
  startFrame: number;
}

export interface SceneWindow {
  id: string;
  from: number;
  to: number;
}

export interface RenderLineOptions {
  job: DialogueJob;
  tts: TtsProvider;
  audioDir: string;
  fps: number;
  sampleRate: number;
  scenes: readonly SceneWindow[];
}

/** Synthesises one line, writes its WAV, and checks it fits its scene. */
export async function renderDialogueLine(opts: RenderLineOptions): Promise<DialogueLine> {
  const { job, tts, audioDir, fps, sampleRate, scenes } = opts;
  const voice = ROSTER[job.speaker].voice;
  const result = await tts.synthesize({ text: job.text, speaker: job.speaker, voice });
  const speech = normalizePeak(resampleLinear(result.samples, result.sampleRate, sampleRate), 0.85);

  const audioFile = `${job.id}.wav`;
  writeFileSync(path.join(audioDir, audioFile), encodeWav(speech, sampleRate));

  const durationFrames = Math.ceil((speech.length / sampleRate) * fps);
  const scene = scenes.find((s) => job.startFrame >= s.from && job.startFrame < s.to);
  if (!scene) throw new Error(`Line ${job.id} starts at ${job.startFrame}, outside every scene.`);
  if (job.startFrame + durationFrames > scene.to) {
    throw new Error(
      `Line ${job.id} needs ${durationFrames} frames from ${job.startFrame}, which overruns scene "${scene.id}" (ends ${scene.to}). Shorten the text or move the cue.`,
    );
  }
  return {
    id: job.id,
    speaker: job.speaker,
    text: job.text,
    startFrame: job.startFrame,
    durationFrames,
    audioFile,
    envelope: envelopeFor(speech, sampleRate, durationFrames, fps),
  };
}
