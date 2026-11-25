/**
 * Renders still frames from a studio composition to PNG, for inspection and contact sheets.
 * Usage: npx tsx scripts/studio-still.ts <compositionId> <outDir> <frame,frame,...> [--width=1280 --height=720]
 * Uses the same local Chromium as the episode renders (REMOTION_BROWSER_EXECUTABLE overrides it).
 */
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

async function main(): Promise<void> {
  const [compositionId, outDir, frameList] = process.argv.slice(2);
  if (!compositionId || !outDir || !frameList) {
    throw new Error('usage: studio-still.ts <compositionId> <outDir> <frames,comma,separated>');
  }
  mkdirSync(outDir, { recursive: true });
  const browser = process.env.REMOTION_BROWSER_EXECUTABLE ?? (existsSync(DEFAULT_BROWSER) ? DEFAULT_BROWSER : null);
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts') });
  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps: {}, browserExecutable: browser });
  for (const frame of frameList.split(',').map((f) => parseInt(f, 10))) {
    const output = path.join(outDir, `${compositionId}-${String(frame).padStart(5, '0')}.png`);
    await renderStill({ composition, serveUrl, output, frame, imageFormat: 'png', browserExecutable: browser });
    console.log('wrote', output);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
