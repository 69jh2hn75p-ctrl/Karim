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
  const tts = createTtsProvider({ ...env, TTS_PROVIDER: env.TTS_PROVIDER ?? 'elevenlabs' });

  const timingLines: unknown[] = [];
  const problems: string[] = [];
  let spoken = 0;

  for (const scene of sp.scenes) {
    for (const line of scene.lines) {
      const spec = FAMILY[line.speaker];
      const result = await tts.synthesize({ text: line.text, speaker: line.speaker, voice: spec.voice });
      const speech = normalizePeak(resampleLinear(result.samples, result.sampleRate, SAMPLE_RATE), 0.85);
      const audioFile = `${line.id}.wav`;
      writeFileSync(path.join(AUDIO_DIR, audioFile), encodeWav(speech, SAMPLE_RATE));

      const durationFrames = Math.ceil((speech.length / SAMPLE_RATE) * FPS);
      const startFrame = Math.round(line.start * FPS);
      const sceneEnd = scene.to * FPS;
      if (startFrame + durationFrames > sceneEnd) {
        problems.push(`${line.id} runs ${(startFrame + durationFrames - sceneEnd) / FPS} s past ${scene.id}`);
      }
      timingLines.push({
        id: line.id,
        speaker: line.speaker,
        text: line.text,
        startFrame,
        durationFrames,
        audioFile,
        envelope: envelopeFor(speech, SAMPLE_RATE, durationFrames, FPS),
      });
      spoken += line.text.trim().split(/\s+/).length;
      console.log(`${line.id} ${line.speaker.padEnd(6)} ${(durationFrames / FPS).toFixed(2)}s  "${line.text}"`);
    }
  }

  const timing = { fps: FPS, sampleRate: SAMPLE_RATE, tts: tts.describe(), lines: timingLines };
  writeFileSync(TIMING, JSON.stringify(timing, null, 2) + '\n');
  console.log(`\nWrote ${timingLines.length} lines, ${spoken} spoken words. TTS: ${timing.tts}`);
  if (problems.length) {
    console.log('Lines that overrun their scene (shorten the text or move the cue):');
    for (const p of problems) console.log(`  - ${p}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
