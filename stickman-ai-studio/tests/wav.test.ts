import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeWav, encodeWav, resampleLinear } from '../scripts/lib/wav';
import { renderFootstep, renderMusicBed, SAMPLE_RATE } from '../scripts/lib/synth';

test('WAV round-trip keeps samples within 16-bit quantisation', () => {
  const src = new Float32Array([0, 0.5, -0.5, 0.25, -1, 1]);
  const buf = encodeWav(src, 48000);
  const back = decodeWav(buf);
  assert.equal(back.sampleRate, 48000);
  assert.equal(back.channels, 1);
  assert.equal(back.samples.length, src.length);
  for (let i = 0; i < src.length; i++) {
    assert.ok(Math.abs(back.samples[i] - src[i]) < 1 / 16000, `sample ${i}`);
  }
});

test('WAV header is valid PCM 16-bit mono', () => {
  const buf = encodeWav(new Float32Array(100), 22050);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WAVE');
  assert.equal(buf.readUInt16LE(20), 1); // PCM
  assert.equal(buf.readUInt16LE(22), 1); // mono
  assert.equal(buf.readUInt32LE(24), 22050);
  assert.equal(buf.readUInt16LE(34), 16);
  assert.equal(buf.readUInt32LE(40), 200);
});

test('decodeWav rejects non-WAV input', () => {
  assert.throws(() => decodeWav(Buffer.from('not a wav file at all')), /RIFF/);
});

test('resampleLinear changes length by the rate ratio', () => {
  const out = resampleLinear(new Float32Array(22050), 22050, 48000);
  assert.equal(out.length, 48000);
});

test('synth output is bounded and of the expected length', () => {
  const music = renderMusicBed(2, SAMPLE_RATE);
  assert.equal(music.length, 2 * SAMPLE_RATE);
  let peak = 0;
  for (const v of music) peak = Math.max(peak, Math.abs(v));
  assert.ok(peak <= 0.8 + 1e-6 && peak > 0.5, `music peak ${peak}`);

  const step = renderFootstep(SAMPLE_RATE);
  assert.ok(step.length > 0);
  assert.ok(step.every((v) => Number.isFinite(v)));
});
