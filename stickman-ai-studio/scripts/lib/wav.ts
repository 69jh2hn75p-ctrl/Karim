/** Minimal 16-bit PCM WAV codec (mono output) and linear resampler. */

export interface DecodedWav {
  sampleRate: number;
  channels: number;
  /** Mono mix-down, values in [-1, 1]. */
  samples: Float32Array;
}

export function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16); // PCM fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s < 0 ? s * 32768 : s * 32767), 44 + 2 * i);
  }
  return buf;
}

export function decodeWav(buf: Buffer): DecodedWav {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('decodeWav: not a RIFF/WAVE file');
  }
  let off = 12;
  let fmt: { audioFormat: number; channels: number; sampleRate: number; bitsPerSample: number } | null = null;
  let data: Buffer | null = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = off + 8;
    if (id === 'fmt ') {
      fmt = {
        audioFormat: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bitsPerSample: buf.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      data = buf.subarray(body, Math.min(buf.length, body + size));
    }
    off = body + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('decodeWav: missing fmt or data chunk');
  if (fmt.audioFormat !== 1 || fmt.bitsPerSample !== 16) {
    throw new Error(`decodeWav: only 16-bit PCM is supported (format=${fmt.audioFormat}, bits=${fmt.bitsPerSample})`);
  }
  const frames = Math.floor(data.length / (2 * fmt.channels));
  const samples = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c++) {
      sum += data.readInt16LE((f * fmt.channels + c) * 2) / 32768;
    }
    samples[f] = sum / fmt.channels;
  }
  return { sampleRate: fmt.sampleRate, channels: fmt.channels, samples };
}

export function resampleLinear(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input.slice();
  const outLength = Math.round((input.length * to) / from);
  const out = new Float32Array(outLength);
  const ratio = from / to;
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const frac = pos - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
}
