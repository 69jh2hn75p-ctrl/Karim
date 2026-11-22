/**
 * Builds every audio asset for Episode 002 ("Ash Road") under public/ep002 and writes
 * src/generated/ep002/dialogue-timing.json. Run with: npm run build:audio:ep002
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DialogueLine, DialogueTiming } from '../src/engine/dialogue';
import { EP2, EP2_DIALOGUE, EP2_SCENES } from '../src/episodes/ep002/plan';
import { renderDialogueLine } from './lib/dialogue-audio';
import { createTtsProvider } from './lib/tts';
import { SAMPLE_RATE } from './lib/synth';
import { renderBeep, renderCrack, renderFootstep, renderWastelandBed, renderWhoosh } from './lib/synth-ep002';
import { encodeWav } from './lib/wav';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/ep002');
const AUDIO_DIR = path.join(OUT, 'audio');
const SFX_DIR = path.join(OUT, 'sfx');
const BUILD_DIR = path.join(ROOT, 'build/tts');
const TIMING_FILE = path.join(ROOT, 'src/generated/ep002/dialogue-timing.json');

async function main(): Promise<void> {
  for (const dir of [AUDIO_DIR, SFX_DIR, BUILD_DIR, path.dirname(TIMING_FILE)]) mkdirSync(dir, { recursive: true });

  const musicSeconds = EP2.totalFrames / EP2.fps + 1;
  writeFileSync(path.join(AUDIO_DIR, 'music.wav'), encodeWav(renderWastelandBed(musicSeconds, SAMPLE_RATE), SAMPLE_RATE));
  writeFileSync(path.join(SFX_DIR, 'footstep.wav'), encodeWav(renderFootstep(SAMPLE_RATE), SAMPLE_RATE));
  writeFileSync(path.join(SFX_DIR, 'crack.wav'), encodeWav(renderCrack(SAMPLE_RATE), SAMPLE_RATE));
  writeFileSync(path.join(SFX_DIR, 'whoosh.wav'), encodeWav(renderWhoosh(SAMPLE_RATE), SAMPLE_RATE));
  writeFileSync(path.join(SFX_DIR, 'beep.wav'), encodeWav(renderBeep(SAMPLE_RATE), SAMPLE_RATE));

  const tts = createTtsProvider(process.env, BUILD_DIR);
  const scenes = EP2_SCENES.map((s) => ({ id: s.id, from: s.from, to: s.to }));
  const lines: DialogueLine[] = [];
  for (const job of EP2_DIALOGUE) {
    lines.push(
      await renderDialogueLine({
        job,
        tts,
        audioDir: AUDIO_DIR,
        fps: EP2.fps,
        sampleRate: SAMPLE_RATE,
        scenes,
      }),
    );
  }

  const timing: DialogueTiming = { fps: EP2.fps, sampleRate: SAMPLE_RATE, tts: tts.describe(), lines };
  writeFileSync(TIMING_FILE, JSON.stringify(timing, null, 2) + '\n');

  for (const l of lines) {
    console.log(`${l.id} ${l.speaker.padEnd(4)} start=${l.startFrame} dur=${l.durationFrames}f "${l.text}"`);
  }
  console.log(`Audio written to ${path.relative(ROOT, OUT)} (TTS: ${timing.tts})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
