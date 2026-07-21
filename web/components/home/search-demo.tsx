import clsx from 'clsx'
import Image from 'next/image'
import {useEffect, useState} from 'react'
import {useT} from 'web/lib/locale'

/**
 * The home-page hero clip: one real session — filter to women, type "meditation", the list narrows,
 * open a profile, scroll it, reach out.
 *
 * The page promises "Don't Swipe. / Search." and otherwise never shows a search. This is the evidence.
 * Captured in both themes and swapped at runtime: the clip is a screenshot, so a light one on a dark
 * page reads as a broken asset rather than a screenshot.
 *
 * Both assets are generated from the live app — see `docs/marketing-visuals.md` (H1) and
 * `media-creator/scripts/capture-search.mjs`; regenerate with `npm run capture:search` then
 * `npm run render:search` / `npm run still:search`.
 *
 * Mobile capture rather than desktop, deliberately: a desktop screenshot scaled into a phone-width
 * column puts the app's 14px type at roughly 5px, which is unreadable for most visitors. A mobile
 * capture is legible on a phone at natural scale, and on desktop the phone frame below explains the
 * tall aspect ratio instead of it reading as an odd crop.
 *
 * Loading shape is deliberate:
 *  - the poster is a plain <Image priority> chosen by CSS, so the LCP element is a static image, never
 *    the video, and never the wrong theme's;
 *  - the <video> only mounts after the page has loaded, so a 1.5 MB file never competes with the hero
 *    copy for bandwidth on a cold visit;
 *  - `prefers-reduced-motion: reduce` keeps the poster and mounts no video at all.
 *
 * The poster is frame 0 (the unfiltered listing), so it matches exactly what the video shows on its
 * first frame and playback starts without a visible jump. The trade-off is that reduced-motion
 * visitors see the starting state rather than the payoff — worth revisiting if that matters more than
 * the seam.
 *
 * The clip has no baked-in text, so it serves every locale unchanged.
 */

/**
 * Where the clips are served from.
 *
 * Normally same-origin: the videos are ~1.8 MB each and are not committed, but
 * `scripts/fetch-media.mjs` pulls them from Cloudflare R2 into public/videos/ during the build, so
 * Vercel's CDN serves them and a visitor's request path has no third party in it.
 *
 * `NEXT_PUBLIC_MEDIA_BASE_URL` overrides that with an absolute base, for switching to runtime CDN
 * delivery later without touching this component. Leave it unset unless that is what you want.
 *
 * The posters stay in the repo on purpose: they are the LCP image, and sending the largest paint
 * through a second origin to save 270 KB of git would be a bad trade.
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/$/, '')
const videoUrl = (name: string) => `${MEDIA_BASE}/videos/${name}`

const ASSETS = {
  light: {
    poster: '/images/search-demo-poster-light.jpg',
    video: videoUrl('search-demo-light.mp4'),
  },
  dark: {
    poster: '/images/search-demo-poster-dark.jpg',
    video: videoUrl('search-demo-dark.mp4'),
  },
} as const

// The capture canvas from capture-search.mjs (390x844 CSS at DPR 2). Hardcoding the ratio keeps the
// box from reflowing between poster and video.
const WIDTH = 780
const HEIGHT = 1688

/**
 * Tracks the app's resolved theme.
 *
 * Not `prefers-color-scheme`: the site also has a manual toggle, and `use-theme.ts` resolves the two
 * into a single signal — the `dark` class on <html>. Observing that class covers system changes and
 * the toggle together. Starts light so server and first client render agree.
 *
 * Only the <video> uses this. The poster cannot: it is the first paint, and anything resolved in an
 * effect necessarily paints the light one first. See the CSS swap below.
 */
function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setIsDark(root.classList.contains('dark'))
    read()

    const observer = new MutationObserver(read)
    observer.observe(root, {attributes: true, attributeFilter: ['class']})
    return () => observer.disconnect()
  }, [])

  return isDark
}

function useShouldPlay() {
  const [shouldPlay, setShouldPlay] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Wait for load rather than mount: on a cold visit the hero copy and CTA matter more than the
    // clip, and a 1.5 MB video competing with them is a worse first paint.
    const start = () => setShouldPlay(true)
    if (document.readyState === 'complete') {
      start()
      return
    }
    window.addEventListener('load', start)
    return () => window.removeEventListener('load', start)
  }, [])

  return shouldPlay
}

function Poster({src, alt, className}: {src: string; alt: string; className: string}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={WIDTH}
      height={HEIGHT}
      priority
      sizes="310px"
      className={clsx('absolute inset-0 w-full h-full object-cover', className)}
    />
  )
}

export function SearchDemo() {
  const t = useT()
  const shouldPlay = useShouldPlay()
  const isDark = useIsDarkTheme()
  const {poster, video} = ASSETS[isDark ? 'dark' : 'light']

  const label = t(
    'home.demo.alt',
    'Searching Compass on a phone: filtering to women, typing the keyword "meditation", opening a matching profile and writing to her',
  )

  // Spacing is the hero grid's job (`gap`), not this component's — it sits in a grid cell on lg and
  // stacks below the copy on smaller screens.
  return (
    <figure className="flex justify-center lg:justify-end">
      {/* Phone frame. Drawn in CSS rather than baked into the capture: it stays crisp at any size,
          follows the theme tokens, and keeps the video itself pure product pixels. */}
      <div
        className="
          relative rounded-[2.25rem] p-2
          bg-canvas-100 border-[1.5px] border-canvas-200
          shadow-[0_24px_64px_rgba(44,36,22,0.18)]
        "
        style={{width: 'min(310px, 78vw)'}}
      >
        <div
          className="relative overflow-hidden rounded-[1.75rem] bg-canvas-50"
          style={{aspectRatio: `${WIDTH} / ${HEIGHT}`}}
        >
          {/* Both posters ship in the markup and CSS picks one, because the poster is the first
              paint. `init-theme.js` puts the `dark` class on <html> in a render-blocking script, so
              the choice is already made before anything is painted. Resolving it in JS instead —
              which is what the <video> below still does — means the server sends and preloads the
              light poster and a dark-mode visitor watches it swap. The second poster costs one
              extra optimised image (~50 KB); the video, at 1.8 MB, is not worth fetching twice, and
              it does not need to be: it mounts after `load`, by which time the effect has run.
              Both carry the same alt text: `display: none` takes the hidden one out of the
              accessibility tree, so whichever is showing is the only one announced. */}
          <Poster src={ASSETS.light.poster} alt={label} className="dark:hidden" />
          <Poster src={ASSETS.dark.poster} alt={label} className="hidden dark:block" />
          {shouldPlay && (
            <video
              // Keyed so a theme change swaps the element rather than leaving the old decoded video
              // in place — <video> does not reload on a src prop change alone.
              key={video}
              src={video}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              // Decorative: the poster's alt text already describes the content, and a screen reader
              // announcing the same thing twice is noise.
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </figure>
  )
}
