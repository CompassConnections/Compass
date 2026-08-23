import {
  ArrowsPointingOutIcon,
  BellAlertIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {githubRepo, IS_IOS_APP_PUBLISHED} from 'common/constants'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import Link from 'next/link'
import {ComponentType, SVGProps} from 'react'
import {FaApple, FaGooglePlay} from 'react-icons/fa'
import {StoreBadge} from 'web/components/download/store-badge'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {QRCode} from 'web/components/widgets/qr-code'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow, IconChip, surface} from 'web/components/widgets/surface'
import {DOWNLOAD_PAGE, useAppDownload} from 'web/hooks/use-app-download'
import {useT} from 'web/lib/locale'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

/**
 * The canonical install page: one URL that every phone, laptop, QR code and email footer can be
 * pointed at, which then works out where that particular visitor should actually go.
 *
 * **Why this exists at all when the sidebar links straight to the store.** The sidebar knows the
 * device it is being rendered on, so it skips this page — a resolved iPhone gets the App Store in
 * one tap. But everything *off* the site (a QR code on a card, a link in a newsletter opened on who
 * knows what, the `about` page read on a laptop) has no such luck, and the answer to "which store"
 * has to live somewhere it can be computed at open time. That somewhere is here. The two are not
 * redundant: this page is the fallback path, and the sidebar is the shortcut past it.
 *
 * **The QR code is the desktop feature, not decoration.** A laptop visitor cannot install anything;
 * the device they need is in their pocket. So the desktop layout gives the QR the hero's second
 * column rather than burying it, and both store badges sit below as the answer for someone who
 * wants to mail themselves a link instead. On a phone the QR would be an instruction to scan your
 * own screen, so it drops out entirely.
 *
 * Note that an iPhone scanning that QR with the app already installed will open the *app* at this
 * path rather than Safari — `web/public/.well-known/apple-app-site-association` claims `/*`. That
 * is the right outcome (they already have it) and the reason the in-app render hides the CTA.
 *
 * No `getStaticProps`: this page has to survive the static export that becomes the mobile bundle
 * (see the `SSG_PAGES` note in `scripts/build_web_view.sh`), and it has nothing to fetch anyway.
 */
export default function DownloadPage() {
  const t = useT()

  return (
    <PageBase trackPageView={'download'} className="col-span-10">
      <SEO
        title={t('download.seo.title', 'Get the Compass app')}
        description={t(
          'download.seo.description',
          'Compass on Android and iPhone — the same profiles, messages and account, with notifications that reach you.',
        )}
        url="/download"
      />

      {/* `max-w-6xl mx-auto`, the same container `/about` uses. Without it the hero grid stretches
          to the full viewport on a wide screen and the QR panel ends up marooned a foot away from
          the copy it belongs to. */}
      <Col className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Hero />
        <WhatItAdds />
        <SameCompass />
        <NoPhone />
      </Col>
    </PageBase>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const t = useT()
  const {device, store} = useAppDownload()

  // Before hydration `device` is 'unknown' and this is false, so the prerendered HTML — the copy
  // Google indexes and the no-JS render — is the desktop one, which names both platforms and
  // explains itself. Sharpening downward on a phone is safe; the reverse would ship a page telling
  // a search crawler to scan a QR code.
  const onPhone = device === 'ios' || device === 'android'

  return (
    <section className="relative grid grid-cols-1 items-center gap-10 pt-14 pb-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:pt-20">
      {/* Same radial wash as the / hero, so arriving here from the landing page feels like the same
          site rather than a utility page bolted on. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_60%_at_50%_30%,rgba(193,127,62,0.16),transparent_70%)]"
      />

      <div className="min-w-0">
        <p className={clsx(eyebrow, 'text-primary-700')}>
          {t('download.eyebrow', 'Android and iPhone')}
        </p>

        <h1 className="font-heading text-ink-900 mt-4 max-w-2xl text-[clamp(34px,5.4vw,56px)] leading-[1.08] tracking-tight text-balance">
          {t('download.title', 'Compass, in your pocket.')}
        </h1>

        <p className="text-ink-600 mt-5 max-w-xl text-[clamp(16px,2vw,19px)] leading-relaxed">
          {t(
            'download.subtitle',
            'The same profiles, the same messages, the same account. What the app adds is a notification that reaches you when someone writes.',
          )}
        </p>

        {/* min-h so the row does not jump when the resolved badge replaces the generic pair on
            hydration — the CTA moving under a thumb already reaching for it is the one layout shift
            that actually costs something here. */}
        <div className="mt-8 flex min-h-[62px] flex-wrap items-center gap-3">
          {store === 'android' && <StoreBadge store="android" large />}
          {store === 'ios' && <StoreBadge store="ios" large />}
          {!store && (
            <>
              <StoreBadge store="android" large />
              {IS_IOS_APP_PUBLISHED && <StoreBadge store="ios" large />}
            </>
          )}
        </div>

        {/* The one place the iOS gap is stated plainly rather than papered over. Disappears on its
            own the moment `IOS_APP_URL` stops being a placeholder. */}
        {!IS_IOS_APP_PUBLISHED && <IosPending />}

        <p className="text-ink-500 mt-6 text-sm">
          {t(
            'download.requirements',
            'Free, no ads, no tracking beyond what the website already does. Android 6.0 and up; iPhone on iOS 14 and up.',
          )}
        </p>
      </div>

      {!onPhone && <QrPanel />}
    </section>
  )
}

/**
 * The desktop hand-off: scan this with the device you actually want it on.
 *
 * Points at this page rather than at a store, deliberately — the phone that scans it re-runs the
 * same resolution and lands on its own store, so one printed code serves both platforms and keeps
 * working when a third one appears.
 */
function QrPanel() {
  const t = useT()
  const url = DEPLOYED_WEB_URL + DOWNLOAD_PAGE

  return (
    <Reveal className="hidden lg:block">
      <div className={clsx(surface, 'w-72 flex-shrink-0 p-7 text-center')}>
        <QRCode url={url} width={180} height={180} className="mx-auto rounded-lg" />
        <p className="text-ink-900 mt-5 text-sm font-semibold">
          {t('download.qr.title', 'Scan with your phone')}
        </p>
        <p className="text-ink-500 mt-1.5 text-xs leading-relaxed">
          {t(
            'download.qr.caption',
            'It opens this page on the phone and sends it to the right store.',
          )}
        </p>
      </div>
    </Reveal>
  )
}

/** Placeholder state for the App Store listing — see `IS_IOS_APP_PUBLISHED` in `common/constants`. */
function IosPending() {
  const t = useT()

  return (
    <div className="mt-5 flex max-w-xl items-start gap-3 rounded-xl bg-canvas-100 p-4">
      <FaApple className="text-ink-700 mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
      <p className="text-ink-600 text-sm leading-relaxed">
        {t(
          'download.ios_pending',
          'The iPhone app is with Apple for review. Until it clears, open compassmeet.com in Safari and tap Share → Add to Home Screen — it behaves like an app, notifications included.',
        )}
      </p>
    </div>
  )
}

// ─── What the app adds ────────────────────────────────────────────────────────

/**
 * Three things, all of which are true of the shipped app and none of which the browser can do.
 *
 * The temptation on a page like this is a feature list of things the *product* does — search,
 * filters, profiles — but a visitor here already knows what Compass is; they are deciding whether
 * the app is worth an install over the tab they already have open. So every card is a delta.
 */
function WhatItAdds() {
  const t = useT()

  const cards: {icon: IconType; title: string; text: string}[] = [
    {
      icon: BellAlertIcon,
      title: t('download.adds.push.title', 'It tells you when someone writes'),
      text: t(
        'download.adds.push.text',
        'A real notification on your lock screen, rather than email spams or a message you find next time you happen to open the tab.',
      ),
    },
    {
      icon: DevicePhoneMobileIcon,
      title: t('download.adds.home.title', 'One tap, already signed in'),
      text: t(
        'download.adds.home.text',
        'An icon on your home screen, no signing in again. Reading profiles on a phone stops feeling like reading a website.',
      ),
    },
    {
      icon: ArrowsPointingOutIcon,
      // Renamed off `...updates.*`: the copy changed from self-updating to full-screen, and a key
      // that still says "updates" is how fr/de end up translating a claim the page stopped making.
      title: t('download.adds.screen.title', 'A larger screen'),
      text: t(
        'download.adds.screen.text',
        'No browser URL nor navigation bar. The app spans your full screen for a smoother experience.',
      ),
    },
  ]

  return (
    <section className="border-canvas-200/70 mt-16 border-t pt-14 sm:mt-20 sm:pt-20">
      <Reveal>
        <p className={clsx(eyebrow, 'text-primary-700')}>
          {t('download.adds.eyebrow', 'What the app adds')}
        </p>
        <h2 className="font-heading text-ink-900 mt-3 max-w-3xl text-[clamp(22px,3vw,32px)] leading-[1.15] tracking-tight text-balance">
          {t('download.adds.title', 'Three things the browser can’t do.')}
        </h2>
      </Reveal>

      {/* Unframed, with a hairline rule on top — `FeatureCard` on `/about`, to the class. These three
          are supporting notes under a heading that already states the claim, not peers of it, and
          boxing them made three items of quite different weight look identical and forced all three
          to the tallest one's height. The wider `gap-x-10` is what separates the columns once the
          frames are gone. */}
      <div className="mt-9 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 70}>
            <div className="border-canvas-200 h-full border-t pt-6">
              <div className="mb-5">
                <IconChip icon={c.icon} />
              </div>
              <h3 className="text-ink-900 mb-2.5 font-bold">{c.title}</h3>
              <p className="text-ink-600 text-sm leading-relaxed">{c.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ─── The honest bit ───────────────────────────────────────────────────────────

/**
 * What the app actually is, said before anyone has to find out.
 *
 * A transparency-first project that ships a native wrapper and lets people assume it is a
 * ground-up native client has spent exactly the credibility it is trying to accumulate. It is also
 * genuinely reassuring here — "same code, same account" is the answer to "do I now have two
 * Compasses that can disagree with each other".
 */
function SameCompass() {
  const t = useT()

  return (
    <section className="border-canvas-200/70 mt-16 border-t pt-14 sm:mt-20 sm:pt-20">
      <Reveal>
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <IconChip icon={CodeBracketIcon} />
              <p className={clsx(eyebrow, 'text-primary-700')}>
                {t('download.same.eyebrow', 'What you’re installing')}
              </p>
            </div>

            <h2 className="font-heading text-ink-900 mt-0 mb-4 max-w-2xl text-[24px] font-bold leading-[1.2] tracking-tight text-balance">
              {t('download.same.title', 'It’s the same Compass, in a native shell.')}
            </h2>

            <div className="text-ink-600 max-w-2xl text-base leading-relaxed [&>p+p]:mt-4">
              <p>
                {t(
                  'download.same.p1',
                  'Both apps wrap the same web app you are reading now. Same code, same account, same data — nothing is stored on the phone that isn’t on the site, and there is no second version that can drift from this one.',
                )}
              </p>
              <p>
                {t(
                  'download.same.p2',
                  'The shells are in the same public repository as everything else, so you can read exactly what the app asks your phone for before you let it.',
                )}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href={githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-700 hover:text-primary-800 inline-flex w-fit items-center text-sm font-semibold transition-colors"
              >
                {t('download.same.link.source', 'Read the source →')}
              </Link>
              <Link
                href="/privacy"
                className="text-primary-700 hover:text-primary-800 inline-flex w-fit items-center text-sm font-semibold transition-colors"
              >
                {t('download.same.link.privacy', 'What we collect →')}
              </Link>
            </div>
          </div>

          <PlatformRows />
        </div>
      </Reveal>
    </section>
  )
}

/**
 * The three places Compass runs, as rows rather than a sentence — the same visual `/about` uses for
 * the same list, deliberately, so the two pages agree on what this fact looks like.
 */
function PlatformRows() {
  const t = useT()

  const rows: {icon: IconType; name: string; sub: string}[] = [
    {
      icon: FaGooglePlay,
      name: t('download.rows.android', 'Android'),
      sub: t('download.rows.android_sub', 'Google Play · 6.0 and up'),
    },
    {
      icon: FaApple,
      name: t('download.rows.ios', 'iPhone'),
      sub: IS_IOS_APP_PUBLISHED
        ? t('download.rows.ios_sub', 'App Store · iOS 14 and up')
        : t('download.rows.ios_sub_pending', 'App Store · in review'),
    },
    {
      icon: GlobeAltIcon,
      name: t('download.rows.browser', 'Browser'),
      sub: t('download.rows.browser_sub', 'Any device, nothing to install'),
    },
  ]

  return (
    <div className="bg-canvas-100 mt-8 flex flex-col gap-2 rounded-xl p-5 sm:p-6 lg:mt-0 lg:w-72 lg:flex-shrink-0">
      {rows.map((r) => (
        <div
          key={r.name}
          className="border-canvas-300 bg-canvas-0 flex items-center gap-3 rounded-lg border p-3"
        >
          <r.icon className="text-primary-600 h-4 w-4 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-ink-900 whitespace-nowrap text-[13px] font-semibold">{r.name}</div>
            <div className="text-ink-500 text-xs">{r.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Closing ──────────────────────────────────────────────────────────────────

/**
 * The exit for the visitor this page cannot serve — someone on a desktop who is not going to pick
 * up their phone. Sending them away to the product is a better outcome than leaving them on an
 * install page they have no use for.
 */
function NoPhone() {
  const t = useT()

  return (
    <section className="border-canvas-200/70 mt-16 border-t pt-14 sm:mt-20 sm:pt-20">
      <Reveal>
        {/* Prose left, CTA right — the shape `/home`'s closing block uses. Stacked in one column
            this left two thirds of a full-width card empty, which reads as an unfinished section
            rather than a quiet one. */}
        <div className={clsx(surface, 'px-7 py-9 sm:px-12 sm:py-12')}>
          <div className="lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="min-w-0">
              <h2 className="font-heading text-ink-900 text-[clamp(20px,2.6vw,28px)] leading-[1.2] tracking-tight text-balance">
                {t('download.closing.title', 'Not on a phone? Nothing is missing.')}
              </h2>
              <p className="text-ink-600 mt-3 max-w-xl text-base leading-relaxed">
                {t(
                  'download.closing.text',
                  'Every profile, filter and conversation works the same in a browser. The app is a convenience, not the product.',
                )}
              </p>
            </div>
            <Link
              href="/"
              className="bg-cta hover:bg-cta-hover mt-6 inline-flex flex-shrink-0 items-center justify-center rounded-xl px-7 py-3 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(193,127,62,0.35)] transition-all duration-150 hover:-translate-y-0.5 lg:mt-0"
            >
              {t('download.closing.cta', 'Browse members')}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
