/**
 * Builds the voice track for "Christmas at Our House" from the screenplay.
 *   public/christmas/audio/<lineId>.wav        one file per spoken line
 *   src/studio/generated/christmas-timing.json  frame timing and mouth envelope per line
 *
 * Voices: ElevenLabs when the account allows it (see the voice ids in characters/family.ts),
 * otherwise the espeak-ng fallback named by TTS_PROVIDER. The key is never read here; the
 * network proxy supplies it (see the environment note), so ELEVENLABS_API_KEY is a placeholder.
 *
 * Run: npm run build:studio-audio
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILY } from '../src/studio/characters/family';
import { envelopeFor } from './lib/dialogue-audio';
import { createTtsProvider } from './lib/tts';
import { SAMPLE_RATE, normalizePeak } from './lib/synth';
import { encodeWav, resampleLinear } from './lib/wav';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCREENPLAY = path.join(ROOT, 'src/studio/screenplay/christmas-at-our-house.json');
const AUDIO_DIR = path.join(ROOT, 'public/christmas/audio');
const TIMING = path.join(ROOT, 'src/studio/generated/christmas-timing.json');
const FPS = 24;

interface Line {
  id: string;
  speaker: keyof typeof FAMILY;
  start: number;
  text: string;
  vo?: boolean;
}
interface Scene {
  id: string;
  from: number;
  to: number;
  lines: Line[];
}

async function main(): Promise<void> {
  mkdirSync(AUDIO_DIR, { recursive: true });
  mkdirSync(path.dirname(TIMING), { recursive: true });

  const sp = JSON.parse(readFileSync(SCREENPLAY, 'utf8')) as { scenes: Scene[] };
  const env: Record<string, string | undefined> = { ...process.env };
  if (!env.ELEVENLABS_API_KEY) env.ELEVENLABS_API_KEY = 'proxy-injected';
  // espeak-ng is the default so a full rebuild never spends the ElevenLabs quota.
  // Set TTS_PROVIDER=elevenlabs to use the account voices (needs quota).
  const tts = createTtsProvider({ ...env, TTS_PROVIDER: env.TTS_PROVIDER ?? 'espeak' });

  // Pass 1: synthesise every line and measure it.
  interface Synth {
    scene: Scene;
    line: Line;
    speech: Float32Array;
    durationFrames: number;
    audioFile: string;
  }
  const synths: Synth[] = [];
  for (const scene of sp.scenes) {
    for (const line of scene.lines) {
      const spec = FAMILY[line.speaker];
      const result = await tts.synthesize({ text: line.text, speaker: line.speaker, voice: spec.voice });
      const speech = normalizePeak(resampleLinear(result.samples, result.sampleRate, SAMPLE_RATE), 0.85);
      const audioFile = `${line.id}.wav`;
      writeFileSync(path.join(AUDIO_DIR, audioFile), encodeWav(speech, SAMPLE_RATE));
      synths.push({ scene, line, speech, durationFrames: Math.ceil((speech.length / SAMPLE_RATE) * FPS), audioFile });
      console.log(`${line.id} ${line.speaker.padEnd(6)} ${(speech.length / SAMPLE_RATE).toFixed(2)}s`);
    }
  }

  // Pass 2: lay the lines out. Each line starts at its authored time, or after the previous
  // line in the same scene plus a short breath, whichever is later. Nothing overlaps.
  const GAP = 0.2;
  const problems: string[] = [];
  const timingLines: unknown[] = [];
  let spoken = 0;
  for (const scene of sp.scenes) {
    const inScene = synths.filter((x) => x.scene.id === scene.id).sort((a, b) => a.line.start - b.line.start);
    let cursor = scene.from;
    for (const x of inScene) {
      const start = Math.max(x.line.start, cursor);
      const startFrame = Math.round(start * FPS);
      const endSec = startFrame / FPS + x.durationFrames / FPS;
      if (endSec > scene.to) problems.push(`${x.line.id} ends ${(endSec - scene.to).toFixed(2)} s past ${scene.id}`);
      if (start > x.line.start + 0.01) console.log(`  moved ${x.line.id} from ${x.line.start} to ${start.toFixed(2)} to avoid overlap`);
      cursor = endSec + GAP;
      spoken += x.line.text.trim().split(/\s+/).length;
      timingLines.push({
        id: x.line.id,
        speaker: x.line.speaker,
        text: x.line.text,
        startFrame,
        durationFrames: x.durationFrames,
        audioFile: x.audioFile,
        envelope: envelopeFor(x.speech, SAMPLE_RATE, x.durationFrames, FPS),
      });
    }
  }

  const timing = { fps: FPS, sampleRate: SAMPLE_RATE, tts: tts.describe(), lines: timingLines };
  writeFileSync(TIMING, JSON.stringify(timing, null, 2) + '\n');
  console.log(`\nWrote ${timingLines.length} lines, ${spoken} spoken words. TTS: ${timing.tts}`);
  if (problems.length) {
    console.log('Lines that run past their scene (shorten the text or give the scene more time):');
    for (const p of problems) console.log(`  - ${p}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
