/**
 * Renders a studio composition to an MP4 and validates the delivered file.
 * Usage: npx tsx scripts/render-studio.ts <compositionId> <output.mp4> <frames> [width height fps]
 * Example: npx tsx scripts/render-studio.ts ChristmasScene01 build/preview/scene01.mp4 720
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMp4 } from './lib/validate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

async function main(): Promise<void> {
  const [compositionId, output, framesArg, widthArg, heightArg, fpsArg] = process.argv.slice(2);
  if (!compositionId || !output || !framesArg) throw new Error('usage: render-studio.ts <compositionId> <output.mp4> <frames> [width height fps]');
  const frames = parseInt(framesArg, 10);
  const width = parseInt(widthArg ?? '1920', 10);
  const height = parseInt(heightArg ?? '1080', 10);
  const fps = parseInt(fpsArg ?? '24', 10);
  const outFile = path.resolve(ROOT, output);
  mkdirSync(path.dirname(outFile), { recursive: true });
  const browser = process.env.REMOTION_BROWSER_EXECUTABLE ?? (existsSync(DEFAULT_BROWSER) ? DEFAULT_BROWSER : null);

  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts') });
  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps: {}, browserExecutable: browser });
  const started = Date.now();
  let last = 0;
  await renderMedia({
    composition: { ...composition, durationInFrames: frames, width, height, fps },
    serveUrl,
    codec: 'h264',
    outputLocation: outFile,
    inputProps: {},
    crf: 18,
    pixelFormat: 'yuv420p',
    imageFormat: 'png',
    audioCodec: 'aac',
    audioBitrate: '192k',
    enforceAudioTrack: true,
    overwrite: true,
    concurrency: 3,
    browserExecutable: browser,
    onProgress: ({ renderedFrames, progress }) => {
      if (renderedFrames - last >= 120 || progress >= 1) {
        last = renderedFrames;
        console.log(`rendered ${renderedFrames}/${frames} (${Math.round(progress * 100)}%)`);
      }
    },
  });
  console.log(`Rendered in ${((Date.now() - started) / 1000).toFixed(1)} s: ${outFile}`);
  const report = validateMp4(outFile, outFile.replace(/\.mp4$/, '.contact.png'), { fps, frames, width, height });
  writeFileSync(outFile.replace(/\.mp4$/, '.quality.json'), JSON.stringify(report, null, 2) + '\n');
  for (const c of report.checks) console.log(`[${c.status}] ${c.name}: ${c.detail}`);
  if (!report.passed) {
    console.error('Validation FAILED.');
    process.exit(1);
  }
  console.log('Validation passed.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
