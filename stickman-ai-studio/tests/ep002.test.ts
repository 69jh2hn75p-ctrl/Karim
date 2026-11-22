import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DialogueTiming } from '../src/engine/dialogue';
import { EP2, EP2_DIALOGUE, EP2_SCENES, EP2_WALK, boDrop, camera, charX, footstrikes, walkWeight } from '../src/episodes/ep002/plan';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timing = JSON.parse(
  readFileSync(path.join(ROOT, 'src/generated/ep002/dialogue-timing.json'), 'utf8'),
) as DialogueTiming;

test('episode 2 scenes are contiguous and cover all 30 s', () => {
  assert.equal(EP2_SCENES[0].from, 0);
  assert.equal(EP2_SCENES[EP2_SCENES.length - 1].to, EP2.totalFrames);
  for (let i = 1; i < EP2_SCENES.length; i++) assert.equal(EP2_SCENES[i].from, EP2_SCENES[i - 1].to);
  assert.equal(EP2.totalFrames / EP2.fps, 30);
});

test('every dialogue line starts inside a scene and finishes before that scene ends', () => {
  assert.equal(timing.lines.length, EP2_DIALOGUE.length);
  for (const line of timing.lines) {
    const scene = EP2_SCENES.find((s) => line.startFrame >= s.from && line.startFrame < s.to);
    assert.ok(scene, `${line.id} is outside every scene`);
    assert.ok(line.startFrame + line.durationFrames <= scene.to, `${line.id} runs past ${scene.id}`);
    assert.equal(line.envelope.length, line.durationFrames, `${line.id} envelope length`);
  }
});

test('dialogue lines never overlap each other', () => {
  for (let i = 1; i < timing.lines.length; i++) {
    const prev = timing.lines[i - 1];
    assert.ok(
      prev.startFrame + prev.durationFrames <= timing.lines[i].startFrame,
      `${prev.id} (ends ${prev.startFrame + prev.durationFrames}) overlaps ${timing.lines[i].id} (starts ${timing.lines[i].startFrame})`,
    );
  }
});

test('footsteps fall only inside walk spans', () => {
  for (const s of footstrikes()) {
    assert.ok(
      EP2_WALK[s.id].some((sp) => s.frame > sp.from && s.frame <= sp.to),
      `step ${s.id}@${s.frame} is outside a walk span`,
    );
  }
});

test('Bo leads onto the bridge and Ren is just behind when the plank breaks', () => {
  const bo = charX('bo', 470);
  const ren = charX('ren', 470);
  assert.ok(bo > ren, 'Bo is ahead');
  assert.ok(bo - ren < 150, 'Ren is close enough to reach him');
  assert.ok(bo >= 960 && bo <= 1034, `Bo is on the first plank (x=${bo})`);
  assert.ok(Math.abs(ren - 930) < 1, 'Ren stands at the bridge edge to reach');
});

test('Bo falls through the plank gap and is pulled back up', () => {
  assert.equal(boDrop(440), 0);
  assert.ok(boDrop(490) > 80, 'Bo has dropped');
  assert.equal(boDrop(600), 0, 'Bo is back on the bridge');
});

test('Ren stands still while reaching, then walks on', () => {
  assert.equal(walkWeight('ren', 500), 0);
  assert.ok(walkWeight('ren', 700) > 0.9);
});

test('camera zoom stays in a safe range across the episode', () => {
  for (let f = 0; f < EP2.totalFrames; f++) {
    const c = camera(f);
    assert.ok(c.zoom > 0.7 && c.zoom < 1.6, `zoom ${c.zoom} at ${f}`);
    assert.ok(Number.isFinite(c.x));
  }
});

test('every frame of the episode has a valid camera and character positions', () => {
  for (let f = 0; f < EP2.totalFrames; f++) {
    assert.ok(Number.isFinite(charX('ren', f)) && Number.isFinite(charX('bo', f)), `frame ${f}`);
  }
});
