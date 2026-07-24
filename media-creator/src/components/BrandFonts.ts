// Loads the real Compass web faces so a render looks like the site rather than like the local
// system-font stack.
//
// The woff2 files are vendored under public/fonts (both families are SIL OFL) rather than fetched
// from Google at render time — theme.ts's rule is that a render must be reproducible offline, and a
// missing network would otherwise silently fall back to Georgia mid-render.
//
// Importing this module registers the faces and holds the render open until the browser reports
// them ready. Only scenes that need them should import it; the video scenes deliberately do not,
// so their renders stay font-fetch free.
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion'

// Variable fonts: one file per family covers every weight, hence the `100 900` range.
const FACES: {family: string; file: string; style?: string}[] = [
  {family: 'Newsreader', file: 'fonts/Newsreader-latin.woff2'},
  {family: 'Newsreader', file: 'fonts/Newsreader-Italic-latin.woff2', style: 'italic'},
  {family: 'DM Sans', file: 'fonts/DMSans-latin.woff2'},
  {family: 'Cormorant Garamond', file: 'fonts/CormorantGaramond-500-latin.woff2'},
]

const handle = delayRender('Loading Compass brand fonts')

Promise.all(
  FACES.map(async ({family, file, style}) => {
    const face = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, {
      weight: '100 900',
      style: style ?? 'normal',
    })
    document.fonts.add(await face.load())
  }),
)
  .then(() => continueRender(handle))
  // Falling back silently would ship a card in the wrong typeface, which is worse than a red render.
  .catch((err) => cancelRender(err))
