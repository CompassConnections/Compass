import {IS_LOCAL, IS_WEBVIEW} from 'common/hosting/constants'

import webviewImageLoader from './webview-image-loader'

/**
 * The URL `next/image` would have used for `src` drawn at `width` device px — for the few places
 * that cannot use `next/image` itself, such as an SVG `<image href>`.
 *
 * Without it those surfaces download the *full* Firebase original (up to ~1 MB, see the note in
 * webview-image-loader.ts) to draw a 40 px face. `next/image` does this for every other avatar in
 * the app; this is the same optimiser, addressed by hand.
 *
 * `width` must be one of Next's `imageSizes`/`deviceSizes` and `quality` one of `images.qualities`,
 * or the optimiser answers 400 — the loader has the details.
 */
export function optimizedImageUrl(src: string, width: number, quality = 75) {
  // Mirrors `images.unoptimized: IS_LOCAL` in next.config.ts: locally there is no optimiser to ask.
  if (IS_LOCAL) return src

  // The static export shipped inside the app borrows the deployed optimiser over HTTP.
  if (IS_WEBVIEW) return webviewImageLoader({src, width, quality})

  // Bundled assets and `data:`/`blob:` sources the optimiser could not fetch.
  if (!/^https?:\/\//i.test(src)) return src

  const params = new URLSearchParams({url: src, w: String(width), q: String(quality)})
  return `/_next/image?${params}`
}
