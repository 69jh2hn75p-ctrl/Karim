import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DialogueTiming } from '../src/engine/dialogue';
import { activeLine, mouthFor } from '../src/engine/dialogue';
import { DIALOGUE, FPS, sceneAt } from '../src/engine/timeline';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(
  readFileSync(path.join(ROOT, 'src/generated/dialogue-timing.json'), 'utf8'),
) as DialogueTiming;

test('generated timing matches the dialogue spec, line by line', () => {
  assert.equal(timing.fps, FPS);
  assert.equal(timing.lines.length, DIALOGUE.length);
  timing.lines.forEach((line, i) => {
    const spec = DIALOGUE[i];
    assert.equal(line.id, spec.id);
    assert.equal(line.speaker, spec.speaker);
    assert.equal(line.startFrame, spec.startFrame);
    assert.equal(line.envelope.length, line.durationFrames, `${line.id} envelope length`);
  });
});

test('every line finishes inside its own scene', () => {
  for (const line of timing.lines) {
    const scene = sceneAt(line.startFrame);
    assert.ok(
      line.startFrame + line.durationFrames <= scene.to,
      `${line.id} ends at ${line.startFrame + line.durationFrames}, scene ${scene.id} ends at ${scene.to}`,
    );
  }
});

test('lines never overlap each other', () => {
  for (let i = 1; i < timing.lines.length; i++) {
    const prev = timing.lines[i - 1];
    assert.ok(prev.startFrame + prev.durationFrames <= timing.lines[i].startFrame, `${prev.id} overlaps next`);
  }
});

test('mouth envelope is normalised and silent between lines', () => {
  for (const line of timing.lines) {
    for (const v of line.envelope) assert.ok(v >= 0 && v <= 1);
    assert.ok(Math.max(...line.envelope) > 0.5, `${line.id} has audible mouth movement`);
  }
  const gap = timing.lines[0].startFrame + timing.lines[0].durationFrames + 2;
  assert.equal(activeLine(timing.lines, gap), undefined);
  assert.equal(mouthFor(timing.lines, 'ren', gap), 0);
});

test('mouth opens only for the speaker', () => {
  const first = timing.lines[0];
  const mid = first.startFrame + Math.floor(first.durationFrames / 2);
  assert.equal(mouthFor(timing.lines, 'bo', mid), 0);
  assert.ok(mouthFor(timing.lines, 'ren', mid) >= 0);
});
