# CLAUDE.md — Stickman Animation Studio standards

These rules apply to every episode in this repository. Read them before writing animation code.

## Mission

Produce entertaining 2D stickman cartoons for English-speaking YouTube audiences
(US, UK, Canada, Australia). Default: natural conversational American English, 16:9, 1920x1080,
24 fps, H.264 MP4, 5–10 minutes. Characters are the foundation; never ship primitive
circles-and-lines figures with no personality.

## Stack

- Remotion 4 + React + TypeScript for all animation. Use `useCurrentFrame`, `useVideoConfig`,
  `interpolate`, `spring`, `Sequence`, `Audio`, `staticFile`, `AbsoluteFill`, `Composition`.
- Studio code lives in `src/studio/`. Episode 001 and 002 code (`src/episode*`, `src/characters`,
  `src/scenes`) is working and must not be broken by studio changes.
- Audio: `scripts/lib/tts.ts` provides `espeak` (local, robotic) and `elevenlabs` (needs
  `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_<NAME>` per character). Never hardcode keys.
- Output: `out/christmas-at-our-house.mp4`, `out/christmas-thumbnail.png`. Create `out/` if missing.

## Folder layout (src/studio/)

```
components/   reusable UI-free layout helpers
characters/   stick rig, character specs, pose presets
faces/        eye, brow, mouth and emotion system
backgrounds/  layered environments (far / mid / near)
props/        tree, presents, stockings, cookies, furniture
camera/       keyframed camera utilities
effects/      snow, flames, steam, sparkles, dust
transitions/  fades, wipes, cuts
scenes/       one file per scene (Scene01Hook.tsx ...)
animations/   reusable motion presets (walk, fall, hug ...)
audio/        audio manifest, lip-sync envelope helpers
utilities/    math, seeded random, timing helpers
compositions/ Remotion compositions (full film, thumbnail, previews)
screenplay/   the screenplay as data (scene timings, lines)
```

Assets: `public/christmas/audio/`, `public/christmas/images/`, `public/christmas/backgrounds/`,
`public/christmas/characters/`, `public/christmas/music/`, `public/christmas/sound-effects/`.

## Character rules

- Every character has: head proportions, expressive eyes with visible pupils and gaze direction,
  eyebrows, a mouth with several shapes, articulated arms and legs, distinctive clothing, and
  consistent proportions across scenes (one spec in `characters/family.ts`).
- Required faces: happiness, excitement, sadness, anger, fear, surprise, confusion,
  embarrassment, disappointment, suspicion, laughter, crying. Blink, eye tracking, eyebrow
  movement, head tilts, emotional transitions (blend, never snap during emotional beats).
- Lip-sync: mouth opens from the dialogue envelope; the shape follows the emotion.
- Characters never go lifeless while speaking: idle breathing, head motion and gaze always run.

## Motion rules

- Traditional principles: anticipation, squash and stretch, follow-through, secondary motion,
  timing and spacing, exaggeration, clear silhouettes, staging, arcs.
- Every movement needs a reason. No random motion to satisfy a timer.
- Ease with springs or bezier-like easing, never linear for body motion.

## Camera rules

- Mix wide establishing, medium, close-up, extreme close-up, reaction and over-the-shoulder shots.
- Every camera move must help story or composition. Keep still when the moment needs stillness.
- Camera is a keyframed utility (`camera/camera.ts`), not per-component hacks.

## Background rules

- Three layers at minimum: foreground, midground, background, with parallax where it fits.
- Every scene has intentional art direction and a visual identity. No empty walls, no repeated
  compositions. Living details: windows with snow, flickering fire, blinking lights, steam from
  food, smoke from the chimney, particles in the air, changing light.

## Storytelling rules

- Strong hook in the first 5 seconds. A visible event, not an explanation.
- Something meaningful every 10–20 seconds: a joke, reaction, development, or composition change.
- Show, don't narrate. Narration only where the screenplay needs it.
- Every episode ends with a satisfying payoff.

## Audio rules

- Separate voice per character. Narrator sounds natural, expressive, and conversational.
- Sound effects for every meaningful action (footsteps, doors, falls, impacts, bells, paper).
- Music supports the mood and must never bury voices (duck under dialogue).
- No copyrighted recordings without permission. Use original or CC0 material and record its source.

## Quality gates (before calling an episode finished)

1. Every scene renders. 2. Character designs stay consistent. 3. Nothing disappears by accident.
4. No overlaps or clipping. 5. Expressions match the dialogue. 6. Motion is smooth.
7. Camera moves are intentional. 8. Transitions work. 9. Dialogue timing fits the audio.
10. Audio stays synchronized and music does not overpower voices. 11. Backgrounds are detailed.
12. No missing assets. 13. No visual glitches. 14. Runtime fits the brief.
15. The opening hooks. 16. The ending pays off.

Inspect rendered frames (contact sheets or stills) before claiming a scene works. Never describe
footage you have not looked at.

## Working notes

- Test with still renders first (`npx remotion still`), then short clips, then the full film.
- Keep scenes independent: a scene reads its local frame and its own timing from the screenplay.
- Document how to produce the next episode in `docs/studio/NEXT_EPISODE.md`.
