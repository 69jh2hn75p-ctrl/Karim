# How to make the next episode

The studio code is reusable. A new episode changes the screenplay, the scenes and, when needed,
the sets and characters. The rig, faces, lip-sync, camera and audio pipeline stay the same.

## 1. Write the screenplay (data first)

Create `src/studio/screenplay/<episode>.json` with the same shape as
`christmas-at-our-house.json`: `scenes` with `from`/`to` in seconds, and `lines` with
`speaker`, `start` (absolute film seconds) and `text`. Scenes must be contiguous and cover the film.
Aim for dense dialogue: about 2.5 spoken words per second of film, leaving room for silent comedy.

## 2. Characters

Each family member is one spec in `src/studio/characters/family.ts`: palette, outfit, hair, glasses,
size and voice. Voices go in `voice.elevenlabsVoiceId` (ElevenLabs) with an espeak fallback.
Keep specs fixed across episodes so characters stay recognisable.

## 3. Scenes

One file per scene in `src/studio/scenes/`. A scene is a `SceneDef`:

- `camera`: keyframes in scene-local seconds (`x`, `y`, `zoom`) and optional `shakes`.
- `background`: a function returning the set (use the existing rooms, or add one in `backgrounds/`).
- `world`: props drawn behind the actors. `foreground`: props drawn in front.
- `actors`: for each character, functions of local time for `x`, `facing`, `pose`, `emotion`,
  and optionally `drop` (falling or sitting offset) and `opacity`.

Poses come from `animations/poses.ts` (walk, run, sit, cheer, brace, fall, sneak, dance, ...).
Emotions come from `faces/emotions.ts`. The shared `SceneRenderer` adds blinking, lip-sync,
captions, dialogue audio and the fades.

Register each scene in `src/studio/compositions/ChristmasFilm.tsx` (or a new film composition).

## 4. Audio

- `TTS_PROVIDER=espeak npm run build:studio-audio` builds every line offline (default).
  Set `TTS_PROVIDER=elevenlabs` for the account voices (needs quota). The build lays dialogue out
  automatically and reports any line that runs past its scene.
- `npm run build:studio-music` writes the generated background bed. Replace it with licensed or
  original music by putting a file at the same path.
- Generated audio is ignored by git; it is rebuilt by the scripts above.

## 5. Check, then render

- `npx tsx scripts/studio-still.ts <CompositionId> <outDir> <frames>` for quick stills.
  Tile them with ffmpeg and look at a contact sheet before a full render.
- `npx tsx scripts/render-studio.ts <CompositionId> <out.mp4> <frames> 1920 1080 24` renders and
  validates the MP4 (codec, pixel format, frame count, duration, audio).

## 6. Thumbnail and YouTube text

Add a `Thumbnail` composition (see `compositions/Thumbnail.tsx`), render one still at 1280x720,
and write the title, description, chapters and tags in `docs/studio/` next to the episode.

## Limits to know

- ElevenLabs free accounts run out of characters quickly. A full rebuild of a 6-minute script
  uses roughly 4,000 characters. Check the quota before rebuilding.
- The renderer is CPU-only in this environment. A full 6-minute film takes a while to render;
  preview individual scenes first.
