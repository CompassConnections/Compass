import {Composition, Still} from 'remotion'
import {FORMATS} from './theme'
import {Intro, INTRO_DURATION} from './scenes/Intro'
import {OgCard} from './scenes/OgCard'
import {
  calculateProfileScrollMetadata,
  PROFILE_SCROLL_DURATION,
  ProfileScroll,
  ProfileScrollProps,
} from './scenes/ProfileScroll'
import {PROFILE_TOUR_DURATION, ProfileTour} from './scenes/ProfileTour'
import {calculateSearchDemoMetadata, SearchDemo, SearchDemoProps} from './scenes/SearchDemo'
import {calculateSearchAlertMetadata, SearchAlert, SearchAlertProps} from './scenes/SearchAlert'

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
      {/* Twelve-second silent b-roll of one whole profile, to lay under the closing sentences of a
          talking-head story. Story format only — it is never a standalone post.

          Which profile it plays is the `username` prop: the page's dimensions, crop and stops all
          come from public/profile-<username>/manifest.json via calculateMetadata, so a new profile
          needs no change here or in the scene.
            node scripts/capture-profile.mjs https://www.compassmeet.com/mhg1
            npm run render:scroll mhg1 */}
      <Composition
        id="ProfileScrollStory"
        component={ProfileScroll}
        durationInFrames={PROFILE_SCROLL_DURATION}
        fps={FORMATS.story.fps}
        width={FORMATS.story.width}
        height={FORMATS.story.height}
        // Cast so the prop type stays `ProfileScrollManifest | null` rather than being narrowed to
        // `null` by inference; calculateMetadata supplies the real manifest.
        defaultProps={{username: 'Martin', manifest: null} as ProfileScrollProps}
        calculateMetadata={calculateProfileScrollMetadata}
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
      {/* The about-page saved-search clip. Canvas and duration come from
          public/alert/<theme>/manifest.json via calculateMetadata, so re-capturing with different
          filters or an extra beat needs no change here.
            npm run capture:alert && npm run render:alert */}
      <Composition
        id="SearchAlertLight"
        component={SearchAlert}
        durationInFrames={480}
        fps={30}
        width={780}
        height={1688}
        defaultProps={{manifest: null, theme: 'light'} as SearchAlertProps}
        calculateMetadata={calculateSearchAlertMetadata}
      />
      <Composition
        id="SearchAlertDark"
        component={SearchAlert}
        durationInFrames={480}
        fps={30}
        width={780}
        height={1688}
        defaultProps={{manifest: null, theme: 'dark'} as SearchAlertProps}
        calculateMetadata={calculateSearchAlertMetadata}
      />
      {/* The default social preview card. A Still, not a Composition — there is no timeline, and
          `remotion still` is the only way it is ever rendered:
            npm run still:og   -> out/compass-og-card.jpg */}
      <Still id="OgCard" component={OgCard} width={FORMATS.og.width} height={FORMATS.og.height} />
    </>
  )
}
