import {DEPLOYED_WEB_URL} from 'common/envs/constants'

/**
 * `next/image` loader for the bundled static export that the Android and iOS shells ship
 * (`scripts/build_web_view.sh`, `NEXT_PUBLIC_WEBVIEW=1`).
 *
 * A static export has no server, so Next's own optimiser does not exist inside the app and the
 * config used to fall back to `unoptimized: true` — meaning every avatar in the grid, the message
 * list and the mention menu downloaded the *full* Firebase original (up to ~1 MB: `uploadImage` in
 * web/lib/firebase/storage.ts only compresses files already over 1 MB, and images copied in by
 * `rehostExternalImages` skip compression entirely) just to be drawn at 40 px. On cellular that is
 * tens of megabytes for one screen.
 *
 * `/_next/image` is a plain public HTTP endpoint though, so the app can borrow the deployed web
 * app's optimiser and get the same resized WebP/AVIF the browser gets.
 *
 * `DEPLOYED_WEB_URL` (www, prod) rather than `WEB_URL`, for the same reason `buildOgUrl` uses it —
 * see the note on WEB_URL in common/src/envs/constants.ts about the apex domain answering
 * `INVALID_IMAGE_OPTIMIZE_REQUEST`. www is the address that has always worked, and a shipped app
 * cannot be re-pointed the way a redeploy can, so it is not the place to find out otherwise.
 *
 * A dev-flavoured app build therefore optimises through prod, which is fine: the endpoint only
 * fetches and resizes whatever remote URL it is handed, and prod's `remotePatterns` already cover
 * the Firebase and ui-avatars hosts the avatars actually live on.
 */
export default function webviewImageLoader(props: {src: string; width: number; quality?: number}) {
  const {src, width, quality} = props

  // Assets bundled into the export itself (`/_next/static/media/...`), plus `data:`/`blob:` sources.
  // The optimiser could never fetch these — they live inside the webview, behind `capacitor://` on
  // iOS and `https://localhost` on Android — so they are served as-is. Next builds a srcset of
  // identical URLs in that case, which costs one download, not several.
  if (!/^https?:\/\//i.test(src)) return src

  // Both of these are validated by the *deployed* optimiser, which 400s on anything it does not
  // recognise (verified against prod: `w=44` and `q=50` both come back 400).
  //
  // `width` is safe because Next only ever calls a loader with a width from `imageSizes`/
  // `deviceSizes`, and the app build reads the same web/next.config.ts the web build does, so the
  // two lists cannot drift apart. Quality is pinned to 75 because that is prod's `images.qualities`
  // default — putting a `quality` prop on an <Image> means adding that number to `qualities` in the
  // config and deploying the web app *before* shipping an app build that asks for it.
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? 75),
  })
  return `${DEPLOYED_WEB_URL}/_next/image?${params}`
}
