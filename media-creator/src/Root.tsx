import {Composition} from 'remotion'
import {FORMATS} from './theme'
import {Intro, INTRO_DURATION} from './scenes/Intro'
import {ProfileTour, PROFILE_TOUR_DURATION} from './scenes/ProfileTour'
import {SearchDemo, SearchDemoProps, calculateSearchDemoMetadata} from './scenes/SearchDemo'

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
      <Composition
        id="ProfileTourStory"
        component={ProfileTour}
        durationInFrames={PROFILE_TOUR_DURATION}
        fps={FORMATS.story.fps}
        width={FORMATS.story.width}
        height={FORMATS.story.height}
      />
      <Composition
        id="ProfileTourPost"
        component={ProfileTour}
        durationInFrames={PROFILE_TOUR_DURATION}
        fps={FORMATS.post.fps}
        width={FORMATS.post.width}
        height={FORMATS.post.height}
      />
      {/* Home-page hero clip. Not a social format: its canvas is the capture viewport, and both
          size and duration come from public/search/manifest.json via calculateMetadata, so a
          re-capture with a different --query needs no change here.
            npm run capture:search && npm run render:search */}
      <Composition
        id="SearchDemoLight"
        component={SearchDemo}
        durationInFrames={480}
        fps={30}
        width={780}
        height={1688}
        // Cast so the prop type stays `SearchManifest | null` rather than being narrowed to `null`
        // by inference; calculateMetadata supplies the real manifest.
        defaultProps={{manifest: null, theme: 'light'} as SearchDemoProps}
        calculateMetadata={calculateSearchDemoMetadata}
      />
      <Composition
        id="SearchDemoDark"
        component={SearchDemo}
        durationInFrames={514}
        fps={30}
        width={780}
        height={1688}
        defaultProps={{manifest: null, theme: 'dark'} as SearchDemoProps}
        calculateMetadata={calculateSearchDemoMetadata}
      />
    </>
  )
}
