import clsx from 'clsx'
import Image from 'next/image'
import {useEffect, useState} from 'react'
import {useT} from 'web/lib/locale'

/**
 * The saved-search alert clip on the about page (A4 in docs/marketing-visuals.md).
 *
 * "Get Notified About Searches" is the most distinctive claim the page makes and the hardest to prove
 * with a still, because the whole point of it happens *later*: you search for something specific, find
 * nobody, ask to be told when someone turns up, and days afterwards the platform tells you. Only a clip
 * can show elapsed time.
 *
 * It renders as a card *inside* "What makes us different", in the column beside the three cards it is
 * evidence for ("Keyword Search the Database", "Get Notified About Searches", "Personality-Centered"),
 * rather than as a section of its own further down. The claim and its proof were a full screen apart,
 * which is the one arrangement that stops the clip from doing any work.
 *
 * Generated from the live app plus the real email template — see
 * `media-creator/scripts/capture-alert.mjs`; regenerate with `npm run capture:alert` then
 * `npm run render:alert` / `npm run still:alert`.
 *
 * Loading shape mirrors the home hero (`components/home/search-demo.tsx`, which carries the longer
 * note): CSS picks the poster so the first paint is never the wrong theme, the <video> mounts only
 * after `load`, and reduced-motion visitors keep the poster and get no video at all.
 *
 * Unlike the hero clip this one is **English-only**, and unavoidably so: its middle beat is a
 * screenshot of an email, and the email's text is baked into the image. The surrounding caption is
 * translated normally, so the point still lands in every locale — same trade-off as the vote card.
 */

const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/$/, '')
const videoUrl = (name: string) => `${MEDIA_BASE}/videos/${name}`

const ASSETS = {
  light: {
    poster: '/images/search-alert-poster-light.jpg',
    video: videoUrl('search-alert-light.mp4'),
  },
  dark: {
    poster: '/images/search-alert-poster-dark.jpg',
    video: videoUrl('search-alert-dark.mp4'),
  },
} as const

// The capture canvas from capture-alert.mjs (390x844 CSS at DPR 2).
const WIDTH = 780
const HEIGHT = 1688

/**
 * Tracks the app's resolved theme via the `dark` class on <html>, which `use-theme.ts` sets from both
 * the system preference and the manual toggle. Only the <video> uses it; the poster is chosen in CSS
 * because it is the first paint.
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
      // Not `priority`: this sits well below the fold on the about page, unlike the home hero where
      // the equivalent poster *is* the LCP element.
      sizes="280px"
      className={clsx('absolute inset-0 w-full h-full object-cover', className)}
    />
  )
}

export function AlertDemo({
  width = 'min(280px, 72vw)',
  className,
}: {
  /** CSS width of the device frame. The frame is 780x1688, so height follows at ~2.16x this. */
  width?: string
  className?: string
} = {}) {
  const t = useT()

  const label = t(
    'about.alert.alt',
    'Filtering Compass to a vegan atheist man aged 24 to 40 near Grenoble, finding nobody, saving the search, then receiving the email days later when someone matching it joins',
  )

  const shouldPlay = useShouldPlay()
  const isDark = useIsDarkTheme()
  const {poster, video} = ASSETS[isDark ? 'dark' : 'light']

  return (
    <div className={clsx('flex-1 flex items-center justify-center', className)}>
      {/* Deeper, more offset shadow than the surrounding cards on purpose: this is a physical object
          sitting on the panel, not another panel. It is the one place on the page where a heavy shadow
          is doing representational work rather than signalling elevation. */}
      <div
        className="
            relative rounded-[2.25rem] p-2
            bg-canvas-100 ring-1 ring-canvas-200
            shadow-[0_8px_16px_-8px_rgb(44_36_22/0.25),0_40px_80px_-32px_rgb(44_36_22/0.45)]
          "
        style={{width}}
      >
        <div
          className="relative overflow-hidden rounded-[1.75rem] bg-canvas-50"
          style={{aspectRatio: `${WIDTH} / ${HEIGHT}`}}
        >
          {/* Both posters ship and CSS picks one — `init-theme.js` sets the `dark` class before
                first paint, so resolving the theme in JS here would paint the light one first and
                visibly swap. `display: none` keeps the hidden one out of the accessibility tree, so
                the shared alt text is announced once. */}
          <Poster src={ASSETS.light.poster} alt={label} className="dark:hidden" />
          <Poster src={ASSETS.dark.poster} alt={label} className="hidden dark:block" />
          {shouldPlay && (
            <video
              key={video}
              src={video}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function SearchAlertDemo() {
  const t = useT()

  return (
    <figure
      className="
        h-full flex flex-col
        bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-5 sm:p-7
      "
    >
      <h3 className="font-bold text-ink-900 mb-2.5">
        {t('about.alert.title', 'What happens after you search')}
      </h3>
      {/*<p className="text-sm text-ink-500 leading-relaxed mb-5">*/}
      {/*  {t(*/}
      {/*    'about.alert.claim',*/}
      {/*    'Search for something specific enough that nobody matches it yet — and be told the day somebody does.',*/}
      {/*  )}*/}
      {/*</p>*/}

      {/* Grows to fill the column so the phone centres against the stack of cards beside it rather
          than pinning to the top of a taller card. */}
      <AlertDemo />

      {/*<figcaption className="text-sm text-ink-500 leading-relaxed mt-5">*/}
      {/*  {t(*/}
      {/*    'about.alert.caption',*/}
      {/*    'The email is the real one, sent to people with saved searches. Daily at most, and only when somebody new actually matches.',*/}
      {/*  )}*/}
      {/*</figcaption>*/}
    </figure>
  )
}
