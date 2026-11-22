/**
 * Text-to-speech provider interface with two adapters:
 *   espeak     default. Local and offline, low quality. Needs `espeak-ng` installed.
 *   elevenlabs needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_<SPEAKER> (e.g. ELEVENLABS_VOICE_REN).
 *              Written against the public REST API. Not yet verified with a live key here.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VoiceProfile } from '../../src/characters/roster';
import type { CharacterId } from '../../src/engine/timeline';
import { decodeWav } from './wav';

export interface TtsRequest {
  text: string;
  speaker: CharacterId;
  voice: VoiceProfile;
}

export interface TtsResult {
  samples: Float32Array;
  sampleRate: number;
}

export interface TtsProvider {
  readonly id: string;
  /** Engine and version string, stored in the timing file for traceability. */
  describe(): string;
  synthesize(req: TtsRequest): Promise<TtsResult>;
}

export const DEFAULT_BUILD_DIR = fileURLToPath(new URL('../../build/tts', import.meta.url));

function runEspeak(args: string[]): string {
  try {
    return execFileSync('espeak-ng', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('espeak-ng is not installed. Install it with: apt-get install espeak-ng');
    }
    throw err;
  }
}

export class EspeakProvider implements TtsProvider {
  readonly id = 'espeak-ng';

  constructor(private readonly workDir: string = DEFAULT_BUILD_DIR) {}

  describe(): string {
    return runEspeak(['--version']).split('\n')[0].trim();
  }

  async synthesize(req: TtsRequest): Promise<TtsResult> {
    mkdirSync(this.workDir, { recursive: true });
    const tmp = path.join(this.workDir, `${req.speaker}-${process.pid}-${Date.now()}.wav`);
    runEspeak(['-v', req.voice.voice, '-s', String(req.voice.speed), '-p', String(req.voice.pitch), '-w', tmp, req.text]);
    const decoded = decodeWav(readFileSync(tmp));
    unlinkSync(tmp);
    return { samples: decoded.samples, sampleRate: decoded.sampleRate };
  }
}

/** 16-bit little-endian PCM to floats in [-1, 1). */
export function pcm16ToFloat(buf: Buffer): Float32Array {
  const n = Math.floor(buf.length / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(i * 2) / 32768;
  return out;
}

export interface ElevenLabsOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  model?: string;
}

export class ElevenLabsProvider implements TtsProvider {
  readonly id = 'elevenlabs';
  private readonly env: Record<string, string | undefined>;

  constructor(
    private readonly apiKey: string,
    private readonly opts: ElevenLabsOptions = {},
  ) {
    if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set. Add it to .env, or use TTS_PROVIDER=espeak.');
    this.env = opts.env ?? process.env;
  }

  describe(): string {
    return `ElevenLabs (${this.opts.model ?? this.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2'}, pcm_24000)`;
  }

  async synthesize(req: TtsRequest): Promise<TtsResult> {
    const varName = `ELEVENLABS_VOICE_${req.speaker.toUpperCase()}`;
    const voiceId = this.env[varName];
    if (!voiceId) throw new Error(`${varName} is not set. Put the ElevenLabs voice ID for ${req.speaker} there.`);

    const f = this.opts.fetchImpl ?? fetch;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=pcm_24000`;
    const res = await f(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'audio/pcm',
      },
      body: JSON.stringify({
        text: req.text,
        model_id: this.opts.model ?? this.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2',
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return { samples: pcm16ToFloat(Buffer.from(await res.arrayBuffer())), sampleRate: 24000 };
  }
}

/** TTS_PROVIDER=espeak (default) or elevenlabs. */
export function createTtsProvider(
  env: Record<string, string | undefined> = process.env,
  buildDir: string = DEFAULT_BUILD_DIR,
): TtsProvider {
  const name = (env.TTS_PROVIDER ?? 'espeak').trim();
  if (name === 'espeak') return new EspeakProvider(buildDir);
  if (name === 'elevenlabs') return new ElevenLabsProvider(env.ELEVENLABS_API_KEY ?? '', { env });
  throw new Error(`Unknown TTS_PROVIDER "${name}". Use "espeak" or "elevenlabs".`);
}
