/**
 * Renders Episode 001 to exports/episode-001.mp4 through Remotion's renderer,
 * writes an SRT with the dialogue, then validates the delivered MP4.
 *
 * Run with: npm run render:episode
 * Optional env: REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMp4 } from './lib/validate';
import type { DialogueTiming } from '../src/engine/dialogue';
import { FPS } from '../src/engine/timeline';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(ROOT, 'src/index.ts');
const EXPORTS = path.join(ROOT, 'exports');
const MP4 = path.join(EXPORTS, 'episode-001.mp4');
const SRT = path.join(EXPORTS, 'episode-001.srt');
const REPORT = path.join(EXPORTS, 'episode-001.quality.json');
const CONTACT = path.join(EXPORTS, 'episode-001.contact.png');
const TIMING = path.join(ROOT, 'src/generated/dialogue-timing.json');

const DEFAULT_BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

function srtTime(frame: number): string {
  const ms = Math.round((frame / FPS) * 1000);
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
    const name = l.speaker === 'ren' ? 'Ren' : 'Bo';
    return `${i + 1}\n${srtTime(l.startFrame)} --> ${srtTime(l.startFrame + l.durationFrames)}\n${name}: ${l.text}\n`;
  });
  writeFileSync(SRT, blocks.join('\n'));
}

async function main(): Promise<void> {
  mkdirSync(EXPORTS, { recursive: true });
  if (!existsSync(TIMING)) {
    throw new Error('Missing src/generated/dialogue-timing.json. Run "npm run build:audio" first.');
  }
  const browser = process.env.REMOTION_BROWSER_EXECUTABLE ?? (existsSync(DEFAULT_BROWSER) ? DEFAULT_BROWSER : undefined);

  console.log('Bundling Remotion project...');
  const serveUrl = await bundle({
    entryPoint: ENTRY,
    onProgress: (p: number) => {
      if (p === 100) console.log('Bundle ready.');
    },
  });

  const composition = await selectComposition({
    serveUrl,
    id: 'Episode001',
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
    // JPEG intermediate frames make Remotion's stitcher emit yuvj420p (full-range).
    // PNG frames keep the delivered file on limited-range yuv420p, per the delivery spec.
    imageFormat: 'png',
    audioCodec: 'aac',
    audioBitrate: '192k',
    enforceAudioTrack: true,
    overwrite: true,
    concurrency: 3,
    browserExecutable: browser ?? null,
    onProgress: ({ renderedFrames, progress }) => {
      if (renderedFrames - lastLog >= 120 || progress >= 1) {
        lastLog = renderedFrames;
        console.log(`rendered ${renderedFrames}/${composition.durationInFrames} frames (${Math.round(progress * 100)}%)`);
      }
    },
  });
  console.log(`MP4 written in ${((Date.now() - started) / 1000).toFixed(1)} s: ${MP4}`);

  writeSrt();
  console.log(`SRT written: ${SRT}`);

  const report = validateMp4(MP4, CONTACT);
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
