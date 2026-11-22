import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER } from '../src/characters/roster';
import { DEFAULT_BUILD_DIR, ElevenLabsProvider, EspeakProvider, createTtsProvider, pcm16ToFloat } from '../scripts/lib/tts';

test('factory defaults to espeak and rejects unknown providers', () => {
  assert.equal(createTtsProvider({}, DEFAULT_BUILD_DIR).id, 'espeak-ng');
  assert.throws(() => createTtsProvider({ TTS_PROVIDER: 'azure' }), /Unknown TTS_PROVIDER/);
});

test('elevenlabs refuses to start without an API key', () => {
  assert.throws(() => createTtsProvider({ TTS_PROVIDER: 'elevenlabs' }), /ELEVENLABS_API_KEY is not set/);
});

test('espeak synthesises audible speech for a dialogue line', async () => {
  const result = await new EspeakProvider(DEFAULT_BUILD_DIR).synthesize({
    text: 'Testing one two three.',
    speaker: 'ren',
    voice: ROSTER.ren.voice,
  });
  assert.ok(result.sampleRate > 8000, `sample rate ${result.sampleRate}`);
  assert.ok(result.samples.length > result.sampleRate / 2, 'at least half a second of audio');
  let peak = 0;
  for (const v of result.samples) peak = Math.max(peak, Math.abs(v));
  assert.ok(peak > 0.05, `peak ${peak}`);
});

test('elevenlabs needs a voice ID for each speaker', async () => {
  const provider = new ElevenLabsProvider('k', { env: {}, fetchImpl: (async () => new Response('')) as unknown as typeof fetch });
  await assert.rejects(
    provider.synthesize({ text: 'hi', speaker: 'ren', voice: ROSTER.ren.voice }),
    /ELEVENLABS_VOICE_REN is not set/,
  );
});

test('elevenlabs sends the key and voice, then decodes PCM from the reply', async () => {
  let url = '';
  let key = '';
  const fakeFetch = (async (u: string | URL | Request, init?: RequestInit) => {
    url = String(u);
    key = (init?.headers as Record<string, string>)['xi-api-key'];
    const pcm = Buffer.alloc(8);
    pcm.writeInt16LE(0, 0);
    pcm.writeInt16LE(16384, 2);
    pcm.writeInt16LE(-16384, 4);
    pcm.writeInt16LE(32767, 6);
    return new Response(pcm, { status: 200 });
  }) as unknown as typeof fetch;

  const provider = new ElevenLabsProvider('secret-key', {
    env: { ELEVENLABS_VOICE_REN: 'voice123' },
    fetchImpl: fakeFetch,
  });
  const result = await provider.synthesize({ text: 'hello', speaker: 'ren', voice: ROSTER.ren.voice });
  assert.equal(url, 'https://api.elevenlabs.io/v1/text-to-speech/voice123?output_format=pcm_24000');
  assert.equal(key, 'secret-key');
  assert.equal(result.sampleRate, 24000);
  assert.deepEqual(Array.from(result.samples).map((v) => Math.round(v * 1000) / 1000), [0, 0.5, -0.5, 1]);
});

test('pcm16ToFloat maps the full range into [-1, 1)', () => {
  const buf = Buffer.alloc(4);
  buf.writeInt16LE(-32768, 0);
  buf.writeInt16LE(32767, 2);
  const out = pcm16ToFloat(buf);
  assert.equal(out[0], -1);
  assert.ok(out[1] < 1 && out[1] > 0.999);
});
