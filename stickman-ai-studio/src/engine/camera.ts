/** Camera per scene. Cuts happen at scene boundaries; moves happen inside scenes. */
import { CAMERA_Y, sceneAt } from './timeline';
import { lerp, tween } from './math';

export interface CameraState {
  /** World x at the centre of the screen. */
  x: number;
  /** World y at the centre of the screen. */
  y: number;
  zoom: number;
}

export function cameraAt(frame: number): CameraState {
  const scene = sceneAt(frame);
  const f = frame - scene.from;
  switch (scene.id) {
    case 'arrival':
      // Wide, following the pair in from the left.
      return { x: lerp(200, 600, f / 150), y: CAMERA_Y, zoom: lerp(1.0, 1.08, f / 150) };
    case 'glow':
      // Medium close-up on Ren; slow push.
      return { x: lerp(640, 650, f / 180), y: CAMERA_Y, zoom: lerp(1.42, 1.5, f / 180) };
    case 'door':
      // Eased pan across to the door while pulling back.
      return { x: tween(f, 640, 1450, 0, 120), y: CAMERA_Y, zoom: tween(f, 1.5, 1.12, 0, 120) };
    case 'lab':
      // Slow dolly into the lab and pull back to a wide.
      return { x: lerp(1450, 1800, f / 210), y: CAMERA_Y, zoom: lerp(1.12, 0.92, f / 210) };
  }
}
