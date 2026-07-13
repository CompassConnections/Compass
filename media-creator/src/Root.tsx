import {Composition} from 'remotion';
import {FORMATS} from './theme';
import {Intro, INTRO_DURATION} from './scenes/Intro';

// Register every video composition here. The same Intro scenes render into two
// Instagram-ready canvases; render with:
//   npm run render:post    -> out/compass-intro-post.mp4   (4:5 feed post)
//   npm run render:story   -> out/compass-intro-story.mp4  (9:16 story / reel)
//   npx remotion render <id> out/<name>.mp4
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IntroPost"
        component={Intro}
        durationInFrames={INTRO_DURATION}
        fps={FORMATS.post.fps}
        width={FORMATS.post.width}
        height={FORMATS.post.height}
      />
      <Composition
        id="IntroStory"
        component={Intro}
        durationInFrames={INTRO_DURATION}
        fps={FORMATS.story.fps}
        width={FORMATS.story.width}
        height={FORMATS.story.height}
      />
    </>
  );
};
