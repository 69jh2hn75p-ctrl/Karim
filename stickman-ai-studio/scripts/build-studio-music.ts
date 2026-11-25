/**
 * Original background music for "Christmas at Our House": a warm C-Am-F-G pad, a soft bass pulse,
 * and quiet bell ticks. Generated, so there is no licensing question. Writes
 * public/christmas/music/bed.wav at 24 kHz, mono, for the whole film.
 * Run: npm run build:studio-music
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeWav } from './lib/wav';
import { normalizePeak } from './lib/synth';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/christmas/music/bed.wav');
const SR = 24000;
const SECONDS = 395;

const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [
  { root: 48, tones: [60, 64, 67] }, // C
  { root: 45, tones: [57, 60, 64] }, // Am
  { root: 41, tones: [57, 60, 65] }, // F
  { root: 43, tones: [59, 62, 67] }, // G
];

function render(): Float32Array {
  const n = SECONDS * SR;
  const out = new Float32Array(n);
  const chordLen = 4;
  const beat = 0.5;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ci = Math.floor(t / chordLen) % CHORDS.length;
    const chord = CHORDS[ci];
    const tc = t % chordLen;
    let v = 0;
    // Pad: soft sines, slow swell in and out of each chord.
    const env = Math.min(1, tc / 1.0) * Math.min(1, (chordLen - tc) / 1.0);
    for (const m of chord.tones) {
      const f = mtof(m);
      v += 0.05 * env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.003 * t));
    }
    // Bass: a soft pulse on the root every beat.
    const tb = t % beat;
    v += 0.09 * Math.exp(-tb * 5) * Math.sin(2 * Math.PI * mtof(chord.root) * t);
    // Bell ticks on the offbeats: short high tones.
    const tk = (t + beat / 2) % beat;
    const bellPitch = mtof(chord.tones[Math.floor(t / beat) % 3] + 24);
    v += 0.025 * Math.exp(-tk * 18) * Math.sin(2 * Math.PI * bellPitch * t);
    // Fades for the whole film.
    const fade = Math.min(1, t / 2) * Math.min(1, (SECONDS - t) / 3);
    out[i] = v * fade;
  }
  return normalizePeak(out, 0.6);
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, encodeWav(render(), SR));
console.log(`Wrote ${path.relative(ROOT, OUT)} (${SECONDS} s, ${SR} Hz)`);
