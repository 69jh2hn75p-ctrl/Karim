/**
 * Permanent character database for the MVP. Visual identity and voice settings
 * stay fixed across scenes and episodes; the rig reads them, never redefines them.
 */
import type { CharacterId } from '../engine/timeline';

export interface VoiceProfile {
  /** Local fallback TTS: espeak-ng voice id. */
  engine: 'espeak-ng';
  voice: string;
  /** Words per minute. */
  speed: number;
  /** 0..99 pitch in espeak-ng. */
  pitch: number;
}

export interface CharacterSpec {
  id: CharacterId;
  name: string;
  accent: string;
  accessory: 'scarf' | 'backpack';
  voice: VoiceProfile;
}

export const ROSTER: Record<CharacterId, CharacterSpec> = {
  ren: {
    id: 'ren',
    name: 'Ren',
    accent: '#5ee6ff',
    accessory: 'scarf',
    voice: { engine: 'espeak-ng', voice: 'en-us+m3', speed: 150, pitch: 38 },
  },
  bo: {
    id: 'bo',
    name: 'Bo',
    accent: '#ffb454',
    accessory: 'backpack',
    voice: { engine: 'espeak-ng', voice: 'en-us+f3', speed: 160, pitch: 62 },
  },
};
