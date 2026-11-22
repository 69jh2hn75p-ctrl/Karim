/**
 * Validates a rendered MP4 by decoding it with FFprobe/FFmpeg. A file is only
 * reported as complete when these checks pass on the delivered file itself.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { FPS, TOTAL_FRAMES, WIDTH, HEIGHT } from '../../src/engine/timeline';

export interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
}

export interface QualityReport {
  file: string;
  generatedAt: string;
  passed: boolean;
  checks: CheckResult[];
  facts: Record<string, string | number | boolean | null>;
}

function run(cmd: string, args: string[]): { stdout: string; stderr: string; status: number } {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status ?? -1 };
}

interface ProbeStream {
  codec_type: string;
  codec_name?: string;
  profile?: string;
  width?: number;
  height?: number;
  pix_fmt?: string;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  sample_rate?: string;
  channels?: number;
  duration?: string;
  nb_frames?: string;
}

export function probeFile(file: string): { streams: ProbeStream[]; format: { format_name: string; duration: string } } {
  const r = run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

/** Count frames by actually decoding the video stream. */
function decodedFrameCount(file: string): number {
  const r = run('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file]);
  return parseInt(r.stdout.trim(), 10);
}

function volumeStats(file: string): { mean: number; max: number } {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
  const mean = /mean_volume:\s*(-?[\d.]+) dB/.exec(r.stderr);
  const max = /max_volume:\s*(-?[\d.]+) dB/.exec(r.stderr);
  return { mean: mean ? parseFloat(mean[1]) : NaN, max: max ? parseFloat(max[1]) : NaN };
}

function blackSegments(file: string): { start: number; duration: number }[] {
  // pix_th is kept low so only near-black frames count; dark-navy scenes are not black.
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-an', '-vf', 'blackdetect=d=0.5:pix_th=0.04', '-f', 'null', '-']);
  const out: { start: number; duration: number }[] = [];
  const re = /black_start:([\d.]+) black_end:[\d.]+ black_duration:([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(r.stderr)) !== null) out.push({ start: parseFloat(m[1]), duration: parseFloat(m[2]) });
  return out;
}

export function validateMp4(file: string, contactSheetPath?: string): QualityReport {
  const checks: CheckResult[] = [];
  const facts: QualityReport['facts'] = {};
  const add = (name: string, ok: boolean, detail: string, warnOnly = false) =>
    checks.push({ name, status: ok ? 'PASS' : warnOnly ? 'WARN' : 'FAIL', detail });

  const exists = existsSync(file);
  add('file exists', exists, file);
  if (!exists) return finish(file, checks, facts);
  const size = statSync(file).size;
  facts.bytes = size;
  add('file size is plausible', size > 100 * 1024, `${(size / 1024).toFixed(0)} KiB`);

  const probe = probeFile(file);
  const v = probe.streams.find((s) => s.codec_type === 'video');
  const a = probe.streams.find((s) => s.codec_type === 'audio');
  facts.container = probe.format.format_name;
  facts.duration_s = parseFloat(probe.format.duration);

  add('container is MP4', probe.format.format_name.includes('mp4'), probe.format.format_name);
  add('video stream present', !!v, v ? 'found' : 'missing');
  if (v) {
    facts.video_codec = v.codec_name ?? null;
    facts.pix_fmt = v.pix_fmt ?? null;
    facts.resolution = `${v.width}x${v.height}`;
    facts.r_frame_rate = v.r_frame_rate ?? null;
    add('video codec is H.264', v.codec_name === 'h264', String(v.codec_name));
    add('pixel format is yuv420p', v.pix_fmt === 'yuv420p', String(v.pix_fmt));
    add('resolution is 1920x1080', v.width === WIDTH && v.height === HEIGHT, `${v.width}x${v.height}`);
    add('frame rate is 30 fps', v.r_frame_rate === `${FPS}/1`, String(v.r_frame_rate));
  }

  const decoded = decodedFrameCount(file);
  facts.decoded_frames = decoded;
  add(`decoded frame count is ${TOTAL_FRAMES}`, decoded === TOTAL_FRAMES, `${decoded} decoded`);

  const expectedDuration = TOTAL_FRAMES / FPS;
  const dur = facts.duration_s as number;
  add('duration matches timeline (24 s)', Math.abs(dur - expectedDuration) < 0.1, `${dur.toFixed(3)} s`);

  if (a) {
    facts.audio_codec = a.codec_name ?? null;
    facts.audio_sample_rate = a.sample_rate ?? null;
    facts.audio_channels = a.channels ?? null;
    add('audio stream is AAC', a.codec_name === 'aac', String(a.codec_name));
  } else {
    add('audio stream present', false, 'no audio track in the MP4');
  }

  if (a) {
    const vol = volumeStats(file);
    facts.audio_mean_db = vol.mean;
    facts.audio_max_db = vol.max;
    add('audio is not silent', vol.max > -30 && vol.mean > -50, `mean ${vol.mean} dB, max ${vol.max} dB`);
  }

  const blacks = blackSegments(file);
  const longBlacks = blacks.filter((b) => b.duration >= 1);
  facts.black_segments_over_1s = longBlacks.length;
  add(
    'no long black frames',
    longBlacks.length === 0,
    longBlacks.length === 0 ? 'none over 1 s' : longBlacks.map((b) => `${b.start.toFixed(2)}s+${b.duration.toFixed(2)}s`).join(', '),
    true,
  );

  if (contactSheetPath) {
    const r = run('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      file,
      '-vf',
      "select='not(mod(n\\,60))',scale=480:-1,tile=4x3",
      '-frames:v',
      '1',
      contactSheetPath,
    ]);
    add('contact sheet written', r.status === 0 && existsSync(contactSheetPath), contactSheetPath);
    facts.contact_sheet = contactSheetPath;
  }

  return finish(file, checks, facts);
}

function finish(file: string, checks: CheckResult[], facts: QualityReport['facts']): QualityReport {
  return {
    file,
    generatedAt: new Date().toISOString(),
    passed: checks.every((c) => c.status !== 'FAIL'),
    checks,
    facts,
  };
}
