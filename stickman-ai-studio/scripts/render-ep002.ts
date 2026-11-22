/**
 * Renders Episode 002 ("Ash Road") to exports/episode-002.mp4, writes its SRT, then
 * validates the delivered MP4 against this episode's own expectations.
 * Run with: npm run render:ep002
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROSTER } from '../src/characters/roster';
import type { DialogueTiming } from '../src/engine/dialogue';
import { EP2 } from '../src/episodes/ep002/plan';
import { validateMp4 } from './lib/validate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(ROOT, 'src/index.ts');
const EXPORTS = path.join(ROOT, 'exports');
const MP4 = path.join(EXPORTS, 'episode-002.mp4');
const SRT = path.join(EXPORTS, 'episode-002.srt');
const REPORT = path.join(EXPORTS, 'episode-002.quality.json');
const CONTACT = path.join(EXPORTS, 'episode-002.contact.png');
const TIMING = path.join(ROOT, 'src/generated/ep002/dialogue-timing.json');

const DEFAULT_BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

function srtTime(frame: number): string {
  const ms = Math.round((frame / EP2.fps) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w: number) => String(n).padStart(w, '0');
  return `${p(h, 2)}:${p(m, 2)}:${p(s, 2)},${p(r, 3)}`;
}

function writeSrt(): void {
  const timing = JSON.parse(readFileSync(TIMING, 'utf8')) as DialogueTiming;
  const blocks = timing.lines.map((l, i) => {
    const name = ROSTER[l.speaker].name;
    return `${i + 1}\n${srtTime(l.startFrame)} --> ${srtTime(l.startFrame + l.durationFrames)}\n${name}: ${l.text}\n`;
  });
  writeFileSync(SRT, blocks.join('\n'));
}

async function main(): Promise<void> {
  mkdirSync(EXPORTS, { recursive: true });
  if (!existsSync(TIMING)) throw new Error('Missing src/generated/ep002/dialogue-timing.json. Run "npm run build:audio:ep002" first.');
  const browser = process.env.REMOTION_BROWSER_EXECUTABLE ?? (existsSync(DEFAULT_BROWSER) ? DEFAULT_BROWSER : undefined);

  console.log('Bundling Remotion project...');
  const serveUrl = await bundle({ entryPoint: ENTRY });

  const composition = await selectComposition({
    serveUrl,
    id: 'Episode002',
    inputProps: {},
    browserExecutable: browser ?? null,
  });
  console.log(`Composition ${composition.id}: ${composition.width}x${composition.height} @ ${composition.fps} fps, ${composition.durationInFrames} frames`);

  const started = Date.now();
  let lastLog = 0;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: MP4,
    inputProps: {},
    crf: 18,
    pixelFormat: 'yuv420p',
    // PNG frames keep the delivered file on limited-range yuv420p (see the Episode 001 notes).
    imageFormat: 'png',
    audioCodec: 'aac',
    audioBitrate: '192k',
    enforceAudioTrack: true,
    overwrite: true,
    concurrency: 3,
    browserExecutable: browser ?? null,
    onProgress: ({ renderedFrames, progress }) => {
      if (renderedFrames - lastLog >= 150 || progress >= 1) {
        lastLog = renderedFrames;
        console.log(`rendered ${renderedFrames}/${composition.durationInFrames} frames (${Math.round(progress * 100)}%)`);
      }
    },
  });
  console.log(`MP4 written in ${((Date.now() - started) / 1000).toFixed(1)} s: ${MP4}`);

  writeSrt();
  console.log(`SRT written: ${SRT}`);

  const report = validateMp4(MP4, CONTACT, { fps: EP2.fps, frames: EP2.totalFrames, width: EP2.width, height: EP2.height });
  writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');
  for (const c of report.checks) console.log(`[${c.status}] ${c.name}: ${c.detail}`);
  console.log(`Quality report: ${REPORT}`);
  if (!report.passed) {
    console.error('Validation FAILED. The export is not marked complete.');
    process.exit(1);
  }
  console.log('Validation passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
