/**
 * Story providers. The interface is the same for a hand-written screenplay file and
 * for the Claude API. Only the Claude adapter needs a key; without one it fails with
 * a clear message and never calls the network.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateScreenplay, type Screenplay } from './schema';

export interface StoryBrief {
  idea: string;
  genre: string;
  audience: string;
  durationSeconds: number;
  language: 'en' | 'ru';
  characterCount: number;
  tone: string;
  visualStyle: string;
}

export const DEFAULT_BRIEF: StoryBrief = {
  idea: 'Two stickmen discover a mysterious underground laboratory.',
  genre: 'mystery',
  audience: 'family',
  durationSeconds: 24,
  language: 'en',
  characterCount: 2,
  tone: 'curious, light, with a hint of unease',
  visualStyle: 'modern cinematic stickman animation',
};

export interface StoryProvider {
  readonly id: string;
  generate(brief: StoryBrief): Promise<Screenplay>;
}

export const EPISODE_FILE = fileURLToPath(new URL('../../../projects/episode-001/screenplay.json', import.meta.url));

/** Throws with every problem listed if the object is not a valid screenplay. */
export function checkScreenplay(raw: unknown): Screenplay {
  if (!raw || typeof raw !== 'object') throw new Error('Screenplay must be a JSON object');
  const sp = raw as Screenplay;
  const errors = validateScreenplay(sp);
  if (errors.length > 0) throw new Error(`Screenplay failed validation:\n- ${errors.join('\n- ')}`);
  return sp;
}

/** Reads a screenplay from a JSON file. */
export class ManualStoryProvider implements StoryProvider {
  readonly id = 'manual';

  constructor(private readonly file: string = EPISODE_FILE) {}

  async generate(_brief: StoryBrief): Promise<Screenplay> {
    return checkScreenplay(JSON.parse(readFileSync(this.file, 'utf8')));
  }
}

const SCHEMA_HINT = `{
  "title": string, "logline": string, "synopsis": string, "conflict": string,
  "language": "en" | "ru", "durationSeconds": number, "fps": 30,
  "characters": [{ "id": "ren" | "bo", "name": string, "role": string, "personality": string }],
  "scenes": [{
    "id": string, "title": string, "location": string, "from": number, "to": number,
    "summary": string, "beats": string[],
    "shots": [{ "id": string, "from": number, "to": number, "size": "wide" | "medium" | "close", "camera": string, "action": string }],
    "dialogue": [{ "id": string, "speaker": "ren" | "bo", "text": string, "startFrame": number }]
  }]
}`;

function systemPrompt(): string {
  return [
    'You write short screenplays for original stickman cartoons.',
    'Reply with one JSON object and nothing else. It must match this shape:',
    SCHEMA_HINT,
    'Rules: fps is 30. Scenes are contiguous from frame 0 to durationSeconds*30.',
    'The shots of each scene tile the scene exactly. Every line starts inside its scene and is short enough to say in the time left.',
    'Use only the character ids "ren" and "bo". Write dialogue in the requested language.',
  ].join('\n');
}

function userPrompt(brief: StoryBrief): string {
  return JSON.stringify({ brief }, null, 2);
}

/** Pulls the JSON object out of a model reply and validates it. */
export function parseScreenplayJson(text: string): Screenplay {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Story response contains no JSON object');
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    throw new Error(`Story response is not valid JSON: ${(err as Error).message}`);
  }
  return checkScreenplay(raw);
}

export interface ClaudeStoryOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

/** Calls the Anthropic Messages API. Not yet verified against a live key in this repo. */
export class ClaudeStoryProvider implements StoryProvider {
  readonly id = 'claude';

  constructor(private readonly opts: ClaudeStoryOptions = {}) {}

  async generate(brief: StoryBrief): Promise<Screenplay> {
    const key = this.opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env, or use STORY_PROVIDER=manual.');
    }
    const model = this.opts.model ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5';
    const f = this.opts.fetchImpl ?? fetch;
    const res = await f('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        system: systemPrompt(),
        messages: [{ role: 'user', content: userPrompt(brief) }],
      }),
    });
    if (!res.ok) {
      throw new Error(`Claude API returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (body.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('');
    return parseScreenplayJson(text);
  }
}

/** STORY_PROVIDER=manual (default) or claude. */
export function createStoryProvider(env: Record<string, string | undefined> = process.env): StoryProvider {
  const name = (env.STORY_PROVIDER ?? 'manual').trim();
  if (name === 'manual') return new ManualStoryProvider();
  if (name === 'claude') return new ClaudeStoryProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL });
  throw new Error(`Unknown STORY_PROVIDER "${name}". Use "manual" or "claude".`);
}
