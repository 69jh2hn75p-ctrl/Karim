/**
 * Loads the screenplay through the configured story provider, validates it, prints the
 * storyboard, and checks it against the render timeline.
 * Usage: npm run check:story   (STORY_PROVIDER=manual by default)
 */
import { DEFAULT_BRIEF, createStoryProvider } from '../src/engine/story/providers';
import { validateScreenplay } from '../src/engine/story/schema';
import { buildStoryboard, diffWithTimeline, formatStoryboard } from '../src/engine/storyboard';

async function main(): Promise<void> {
  const provider = createStoryProvider();
  const sp = await provider.generate(DEFAULT_BRIEF);
  const shots = sp.scenes.flatMap((s) => s.shots).length;
  console.log(`Provider: ${provider.id}. "${sp.title}": ${sp.scenes.length} scenes, ${shots} shots, ${sp.durationSeconds} s at ${sp.fps} fps.`);
  console.log('');
  console.log(formatStoryboard(buildStoryboard(sp)));
  console.log('');

  const errors = [...validateScreenplay(sp), ...diffWithTimeline(sp)];
  if (errors.length > 0) {
    console.error('Story check FAILED:');
    for (const e of errors) console.error(`- ${e}`);
    console.error('The renderer still reads src/engine/timeline.ts, so mismatches would not reach the video.');
    process.exit(1);
  }
  console.log('Story check passed: the screenplay is valid and matches the render timeline.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
