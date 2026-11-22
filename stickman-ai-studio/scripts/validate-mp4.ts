/**
 * CLI wrapper: validates an MP4 and writes a quality report next to it.
 * Usage: npm run validate:mp4 -- [path/to/file.mp4]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { validateMp4 } from './lib/validate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.resolve(process.argv[2] ?? path.join(ROOT, 'exports/episode-001.mp4'));
const base = file.replace(/\.mp4$/, '');
const report = validateMp4(file, `${base}.contact.png`);
writeFileSync(`${base}.quality.json`, JSON.stringify(report, null, 2) + '\n');
for (const c of report.checks) console.log(`[${c.status}] ${c.name}: ${c.detail}`);
console.log(report.passed ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(report.passed ? 0 : 1);
