import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPose, IDLE, POINT_ARM, ARMS_UP, walkPose, idlePose } from '../src/characters/pose';
import {
  charX,
  footstrikes,
  panelGlow,
  pointWeight,
  surpriseWeight,
  walkPhase,
  walkWeight,
} from '../src/engine/choreography';
import { cameraAt } from '../src/engine/camera';
import { piecewise, smooth, easeInOut } from '../src/engine/math';
import { FPS, SCENES, TOTAL_FRAMES, WALK_SPANS, sceneAt } from '../src/engine/timeline';

test('scenes are contiguous and cover the full episode', () => {
  assert.equal(SCENES[0].from, 0);
  assert.equal(SCENES[SCENES.length - 1].to, TOTAL_FRAMES);
  for (let i = 1; i < SCENES.length; i++) {
    assert.equal(SCENES[i].from, SCENES[i - 1].to, `gap before ${SCENES[i].id}`);
  }
  assert.equal(sceneAt(0).id, 'arrival');
  assert.equal(sceneAt(150).id, 'glow');
  assert.equal(sceneAt(719).id, 'lab');
});

test('characters enter from off-screen and stop where the story needs them', () => {
  assert.ok(charX('ren', 0) < -300, 'Ren starts off-screen left');
  assert.equal(charX('ren', 200), charX('ren', 250), 'Ren pauses while talking');
  assert.ok(charX('ren', 700) > charX('ren', 400), 'Ren moves forward into the lab');
  assert.ok(charX('bo', 0) < charX('ren', 0), 'Bo starts behind Ren');
});

test('walk weight is 0 during pauses and 1 mid-stride', () => {
  assert.equal(walkWeight('ren', 200), 0);
  assert.equal(walkWeight('ren', 60), 1);
  assert.ok(walkWeight('ren', 117) < 1, 'eases out before the stop');
  for (const span of WALK_SPANS.ren) {
    const w = walkWeight('ren', span.from + 1);
    assert.ok(w > 0 && w < 1, 'eases in at the start of a span');
  }
});

test('footstrikes fall only inside walk spans and are sorted', () => {
  const steps = footstrikes();
  assert.ok(steps.length > 20, `got ${steps.length}`);
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i].frame >= steps[i - 1].frame);
  for (const s of steps) {
    const inSpan = WALK_SPANS[s.id].some((sp) => s.frame > sp.from && s.frame <= sp.to);
    assert.ok(inSpan, `step ${s.id}@${s.frame} is outside a walk span`);
  }
});

test('gesture and state curves are bounded 0..1', () => {
  for (let f = 0; f <= TOTAL_FRAMES; f += 5) {
    for (const v of [pointWeight(f), surpriseWeight(f), panelGlow(f)]) {
      assert.ok(v >= 0 && v <= 1, `frame ${f}: ${v}`);
    }
  }
  assert.ok(pointWeight(250) > 0.99, 'Ren is pointing mid-glow');
  assert.ok(surpriseWeight(280) > 0.99, 'Bo is surprised mid-glow');
  assert.equal(surpriseWeight(100), 0);
});

test('camera cuts at scene boundaries and stays inside the frame', () => {
  const before = cameraAt(149);
  const after = cameraAt(150);
  assert.ok(Math.abs(after.zoom - before.zoom) > 0.2, 'hard cut into the glow shot');
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const c = cameraAt(f);
    assert.ok(c.zoom > 0.5 && c.zoom < 2, `zoom at ${f}`);
    assert.ok(Number.isFinite(c.x));
  }
});

test('pose helpers are periodic and the gesture overrides arm only', () => {
  const p0 = walkPose(0);
  const pTwo = walkPose(2 * Math.PI);
  assert.ok(Math.abs(p0.thighL - pTwo.thighL) < 1e-9);
  assert.ok(Math.abs(p0.bob) < 1e-9, 'no bob at the start of the stride');

  const gesture = buildPose({ frame: 200, walkWeight: 0, phase: 0, point: 1 });
  assert.ok(Math.abs(gesture.upperR - POINT_ARM.upperR) < 1e-9);
  assert.equal(gesture.thighR, idlePose(200).thighR, 'legs are untouched by a gesture');

  const up = buildPose({ frame: 200, walkWeight: 0, phase: 0, surprise: 1 });
  assert.ok(Math.abs(up.upperL - ARMS_UP.upperL) < 1e-9);
  assert.ok(Math.abs(up.upperR - ARMS_UP.upperR) < 1e-9);
  assert.ok(IDLE.upperL > 0, 'idle arms hang slightly forward');
});

test('walk phase advances one radian per 1/(period/2pi) frame and easing is monotonic', () => {
  assert.ok(Math.abs(walkPhase(15) - 2 * Math.PI) < 1e-9, 'one stride per 15 frames');
  let last = -1;
  for (let t = 0; t <= 1; t += 0.05) {
    const e = easeInOut(t);
    assert.ok(e >= last - 1e-12);
    last = e;
  }
  assert.equal(piecewise(5, [0, 10], [0, 100]), 50);
  assert.equal(smooth(5, 0, 10), 0.5);
  assert.equal(FPS, 30);
});
