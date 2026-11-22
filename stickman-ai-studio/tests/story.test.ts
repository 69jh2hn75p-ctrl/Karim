import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateScreenplay, type Screenplay } from '../src/engine/story/schema';
import {
  ClaudeStoryProvider,
  DEFAULT_BRIEF,
  EPISODE_FILE,
  ManualStoryProvider,
  createStoryProvider,
  parseScreenplayJson,
} from '../src/engine/story/providers';
import { buildStoryboard, diffWithTimeline, formatStoryboard } from '../src/engine/storyboard';

const load = (): Screenplay => JSON.parse(readFileSync(EPISODE_FILE, 'utf8')) as Screenplay;

test('episode screenplay is valid', () => {
  assert.deepEqual(validateScreenplay(load()), []);
});

test('episode screenplay matches the render timeline scene for scene and line for line', () => {
  assert.deepEqual(diffWithTimeline(load()), []);
});

test('storyboard has one row per shot and covers the full 24 s', () => {
  const sp = load();
  const rows = buildStoryboard(sp);
  assert.equal(rows.length, sp.scenes.reduce((n, s) => n + s.shots.length, 0));
  const total = rows.reduce((n, r) => n + r.seconds, 0);
  assert.ok(Math.abs(total - 24) < 1e-9, `storyboard covers ${total} s`);
  assert.deepEqual(rows[0].dialogueIds, []);
  assert.ok(rows.some((r) => r.dialogueIds.includes('L01')), 'line L01 lands on a shot');
  assert.ok(formatStoryboard(rows).split('\n').length === rows.length + 1);
});

test('validator catches a gap between scenes', () => {
  const sp = load();
  sp.scenes[1].from = 151;
  assert.ok(validateScreenplay(sp).some((e) => /scene S02 starts at frame 151/.test(e)));
});

test('validator catches shots that do not cover their scene', () => {
  const sp = load();
  sp.scenes[0].shots[0].to = 80;
  const errors = validateScreenplay(sp);
  assert.ok(errors.some((e) => /shot S01-02 starts at frame 90/.test(e)));
});

test('validator catches an unknown speaker, a wrong fps and a line outside its scene', () => {
  const sp = load();
  sp.scenes[1].dialogue[0].speaker = 'zed' as Screenplay['scenes'][number]['dialogue'][number]['speaker'];
  sp.fps = 24;
  sp.scenes[2].dialogue[0].startFrame = 100;
  const errors = validateScreenplay(sp).join('\n');
  assert.match(errors, /"zed"/);
  assert.match(errors, /fps/);
  assert.match(errors, /outside scene S03/);
});

test('diffWithTimeline reports a changed line', () => {
  const sp = load();
  sp.scenes[3].dialogue[0].text = 'A different line.';
  assert.ok(diffWithTimeline(sp).some((e) => /line L03 differs/.test(e)));
});

test('manual provider reads the episode file', async () => {
  const sp = await new ManualStoryProvider().generate(DEFAULT_BRIEF);
  assert.equal(sp.title, 'The Lab Below');
});

test('createStoryProvider defaults to manual and rejects unknown names', () => {
  assert.equal(createStoryProvider({}).id, 'manual');
  assert.throws(() => createStoryProvider({ STORY_PROVIDER: 'gpt' }), /Unknown STORY_PROVIDER/);
});

test('claude provider refuses to run without a key and makes no request', async () => {
  let called = false;
  const fakeFetch = (async () => {
    called = true;
    return new Response('{}');
  }) as unknown as typeof fetch;
  const provider = new ClaudeStoryProvider({ apiKey: '', fetchImpl: fakeFetch });
  await assert.rejects(provider.generate(DEFAULT_BRIEF), /ANTHROPIC_API_KEY is not set/);
  assert.equal(called, false);
});

test('claude provider sends the key and model, then validates the reply', async () => {
  let seen: { url: string; headers: Record<string, string>; body: { model: string } } | null = null;
  const reply = JSON.stringify(load());
  const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    seen = {
      url: String(url),
      headers: init?.headers as Record<string, string>,
      body: JSON.parse(String(init?.body)),
    };
    return new Response(JSON.stringify({ content: [{ type: 'text', text: `Here you go:\n${reply}` }] }), { status: 200 });
  }) as unknown as typeof fetch;

  const provider = new ClaudeStoryProvider({ apiKey: 'test-key', model: 'claude-sonnet-5-5', fetchImpl: fakeFetch });
  const sp = await provider.generate(DEFAULT_BRIEF);
  assert.equal(sp.title, 'The Lab Below');
  assert.ok(seen);
  const req = seen as { url: string; headers: Record<string, string>; body: { model: string } };
  assert.equal(req.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(req.headers['x-api-key'], 'test-key');
  assert.equal(req.body.model, 'claude-sonnet-5-5');
});

test('claude provider rejects a reply that is not a valid screenplay', async () => {
  assert.throws(() => parseScreenplayJson('no json here'), /no JSON object/);
  assert.throws(() => parseScreenplayJson('{"title": "x"'), /no JSON object|not valid JSON/);
  const bad = { ...load(), scenes: [] };
  assert.throws(() => parseScreenplayJson(JSON.stringify(bad)), /no scenes/);
});
