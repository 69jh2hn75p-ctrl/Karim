/**
 * Blink curve: 0 open, 1 closed. Each character gets a small time offset so they never blink
 * in unison. Blinks are every ~3.4 s with a 0.14 s close, which reads as natural.
 */
export function blinkAt(t: number, offset = 0): number {
  const period = 3.4;
  const dur = 0.14;
  const local = (((t + offset) % period) + period) % period;
  if (local > dur) return 0;
  return Math.sin((local / dur) * Math.PI);
}
