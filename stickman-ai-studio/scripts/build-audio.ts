/**
 * Builds every audio asset for Episode 001:
 *   public/audio/music.wav        original procedural music bed
 *   public/sfx/*.wav              footstep, door, ping (procedural)
 *   public/audio/<id>.wav         one TTS file per dialogue line (TTS_PROVIDER, default espeak-ng)
 *   src/generated/dialogue-timing.json  frame timing + per-frame mouth envelope
 *
 * Run with: npm run build:audio
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROSTER } from '../src/characters/roster';
import type { DialogueLine, DialogueTiming } from '../src/engine/dialogue';
import { DIALOGUE, DialogueSpec, FPS, sceneAt, TOTAL_FRAMES } from '../src/engine/timeline';
import { createTtsProvider, type TtsProvider } from './lib/tts';
import { SAMPLE_RATE, normalizePeak, renderDoor, renderFootstep, renderMusicBed, renderPing } from './lib/synth';
import { encodeWav, resampleLinear } from './lib/wav';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = path.join(ROOT, 'public/audio');
const SFX_DIR = path.join(ROOT, 'public/sfx');
const BUILD_DIR = path.join(ROOT, 'build/tts');
const TIMING_FILE = path.join(ROOT, 'src/generated/dialogue-timing.json');

const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/** Mouth envelope: RMS per video frame, normalised to the line peak, lightly smoothed. */
export function envelopeFor(samples: Float32Array, sampleRate: number, durationFrames: number): number[] {
  const window = sampleRate / FPS;
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

async function renderLine(spec: DialogueSpec, tts: TtsProvider): Promise<DialogueLine> {
  const voice = ROSTER[spec.speaker].voice;
  const result = await tts.synthesize({ text: spec.text, speaker: spec.speaker, voice });
  const speech = normalizePeak(resampleLinear(result.samples, result.sampleRate, SAMPLE_RATE), 0.85);

  const audioFile = `${spec.id}.wav`;
  writeFileSync(path.join(AUDIO_DIR, audioFile), encodeWav(speech, SAMPLE_RATE));

  const durationFrames = Math.ceil((speech.length / SAMPLE_RATE) * FPS);
  const scene = sceneAt(spec.startFrame);
  if (spec.startFrame + durationFrames > scene.to) {
    throw new Error(
      `Line ${spec.id} needs ${durationFrames} frames from ${spec.startFrame}, which overruns scene "${scene.id}" (ends ${scene.to}). Shorten the text or move the cue.`,
    );
  }
  return {
    id: spec.id,
    speaker: spec.speaker,
    text: spec.text,
    startFrame: spec.startFrame,
    durationFrames,
    audioFile,
    envelope: envelopeFor(speech, SAMPLE_RATE, durationFrames),
  };
}

async function main(): Promise<void> {
  for (const dir of [AUDIO_DIR, SFX_DIR, BUILD_DIR, path.dirname(TIMING_FILE)]) mkdirSync(dir, { recursive: true });

  const musicSeconds = TOTAL_FRAMES / FPS + 1;
  writeFileSync(path.join(AUDIO_DIR, 'music.wav'), encodeWav(renderMusicBed(musicSeconds, SAMPLE_RATE), SAMPLE_RATE));
  writeFileSync(path.join(SFX_DIR, 'footstep.wav'), encodeWav(renderFootstep(SAMPLE_RATE), SAMPLE_RATE));
  writeFileSync(path.join(SFX_DIR, 'door.wav'), encodeWav(renderDoor(SAMPLE_RATE), SAMPLE_RATE));
  writeFileSync(path.join(SFX_DIR, 'ping.wav'), encodeWav(renderPing(SAMPLE_RATE), SAMPLE_RATE));

  const tts = createTtsProvider(process.env, BUILD_DIR);
  const lines: DialogueLine[] = [];
  for (const spec of DIALOGUE) lines.push(await renderLine(spec, tts));

  const timing: DialogueTiming = {
    fps: FPS,
    sampleRate: SAMPLE_RATE,
    tts: tts.describe(),
    lines,
  };
  writeFileSync(TIMING_FILE, JSON.stringify(timing, null, 2) + '\n');

  for (const l of lines) {
    console.log(`${l.id} ${l.speaker.padEnd(4)} start=${l.startFrame} dur=${l.durationFrames}f (${(l.durationFrames / FPS).toFixed(2)}s) "${l.text}"`);
  }
  console.log(`Audio assets written to ${path.relative(ROOT, AUDIO_DIR)} and ${path.relative(ROOT, SFX_DIR)}`);
  console.log(`Timing written to ${path.relative(ROOT, TIMING_FILE)} (TTS: ${timing.tts})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
