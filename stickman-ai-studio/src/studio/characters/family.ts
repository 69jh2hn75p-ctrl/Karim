/**
 * The four family members. One spec each: change it here, never per scene.
 * Voices are placeholders (espeak-ng) until ElevenLabs voices are chosen; see docs/studio.
 */
import type { CharacterSpec } from './types';

export const FAMILY: Record<CharacterSpec['id'], CharacterSpec> = {
  ben: {
    id: 'ben',
    name: 'Ben',
    scale: 1.0,
    palette: {
      skin: '#f2c49b',
      hair: '#6b3d22',
      shirt: '#b22a2a',
      shirtAccent: '#f4f1ea',
      pants: '#2e3f63',
      shoes: '#c42727',
      outline: '#3a1f14',
    },
    outfit: 'hoodie',
    hair: 'curly',
    glasses: false,
    voice: { engine: 'elevenlabs', voice: 'en-us+m3', speed: 175, pitch: 52, elevenlabsVoiceId: 'bIHbv24MWmeRgasZH58o' },
  },
  frank: {
    id: 'frank',
    name: 'Frank',
    scale: 1.04,
    palette: {
      skin: '#e8b48a',
      hair: '#b8b2aa',
      shirt: '#8b1e1e',
      shirtAccent: '#2f7d4a',
      pants: '#5a3b26',
      shoes: '#2b1b12',
      outline: '#3a1f14',
    },
    outfit: 'sweater',
    hair: 'bald',
    glasses: true,
    voice: { engine: 'elevenlabs', voice: 'en-us+m1', speed: 150, pitch: 28, elevenlabsVoiceId: 'JBFqnCBsd6RMkjVDRZzb' },
  },
  diane: {
    id: 'diane',
    name: 'Diane',
    scale: 0.97,
    palette: {
      skin: '#f0c29c',
      hair: '#3b2416',
      shirt: '#f3ead8',
      shirtAccent: '#c42727',
      pants: '#2f6b4b',
      shoes: '#5a2e1c',
      outline: '#3a1f14',
    },
    outfit: 'apron',
    hair: 'bun',
    glasses: false,
    voice: { engine: 'elevenlabs', voice: 'en-us+f2', speed: 160, pitch: 60, elevenlabsVoiceId: 'EXAVITQu4vr4xnSDxMaL' },
  },
  max: {
    id: 'max',
    name: 'Max',
    scale: 0.78,
    palette: {
      skin: '#f5cba4',
      hair: '#c86b2a',
      shirt: '#2b8f96',
      shirtAccent: '#f4c430',
      pants: '#3c4b78',
      shoes: '#e25c2c',
      outline: '#3a1f14',
    },
    outfit: 'parka',
    hair: 'beanie',
    glasses: false,
    voice: { engine: 'elevenlabs', voice: 'en-us+f3', speed: 185, pitch: 80, elevenlabsVoiceId: 'FGY2WhTYpPnrIDTdsKH5' },
  },
};
