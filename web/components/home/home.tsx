import {AdjustmentsHorizontalIcon, EyeIcon, UsersIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {discordLink, githubRepo} from 'common/constants'
import Link from 'next/link'
import {ComponentType, ReactNode, SVGProps, useEffect, useRef} from 'react'
import {FaDiscord, FaGithub} from 'react-icons/fa'
import {SearchDemo} from 'web/components/home/search-demo'
import {Row} from 'web/components/layout/row'
import {SignUpButton} from 'web/components/nav/sidebar'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow, Section, surface, surfaceHover} from 'web/components/widgets/surface'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface FeatureCardProps {
  icon: IconType
  title: string
  text: string
}

interface SocialAvatarProps {
  letter: string
  gradient: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EyebrowBadge({children}: {children: React.ReactNode}) {
  return (
    <div className="inline-flex items-center gap-2 bg-canvas-200 text-primary-700 ring-1 ring-primary-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 animate-fade-up">
      {/*<span className="w-2 h-2 rounded-full bg-[#6B8F71] inline-block" />*/}
      {children}
    </div>
  )
}

function FeatureCard({icon: Icon, title, text}: FeatureCardProps) {
  return (
    <div className={clsx(surface, surfaceHover, 'h-full p-6 sm:p-7')}>
      <div className="w-11 h-11 rounded-xl bg-primary-100 ring-1 ring-primary-200 flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-primary-600" strokeWidth={1.8} />
      </div>
      <h3 className="font-bold text-ink-1000 mb-2.5">{title}</h3>
      <p className="text-sm text-ink-600 leading-relaxed">{text}</p>
    </div>
  )
}

// Kept for the commented-out avatar row in SocialProof below: the gradient initials were fabricated
// social proof sitting next to the word "real", so they are disabled rather than deleted.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SocialAvatar({letter, gradient}: SocialAvatarProps) {
  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-canvas-50 -ml-2 first:ml-0 flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{background: gradient}}
    >
      {letter}
    </div>
  )
}

function SocialProof({label}: {label: React.ReactNode}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const avatars: SocialAvatarProps[] = [
    {letter: 'S', gradient: 'linear-gradient(135deg, #C17F3E, #8B5E3C)'},
    {letter: 'R', gradient: 'linear-gradient(135deg, #6B8F71, #4A7055)'},
    {letter: 'T', gradient: 'linear-gradient(135deg, #8B5E3C, #6B3E22)'},
    {letter: 'L', gradient: 'linear-gradient(135deg, #C17F3E, #D4955A)'},
  ]

  return (
    <div className="flex items-center gap-3 text-ink-600 text-sm">
      {/*<div className="flex">*/}
      {/*  {avatars.map((av) => (*/}
      {/*    <SocialAvatar key={av.letter} {...av} />*/}
      {/*  ))}*/}
      {/*</div>*/}
      <span>{label}</span>
    </div>
  )
}

/**
 * The manifesto line, promoted to the page's one statement block.
 *
 * It was a 16px italic paragraph in a card the same weight as the three feature tiles above it, which
 * is an odd way to treat the sentence that states what the project is *for*. It is now the only body
 * copy on the page set at display size, on the only tinted surface — the same role "One Mission" plays
 * on /about, and deliberately the same treatment so the two pages read as one product.
 */
function QuoteBlock({children}: {children: React.ReactNode}) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl px-8 py-10 sm:px-14 sm:py-14',
        'bg-gradient-to-br from-primary-100 via-canvas-50 to-canvas-50',
        'dark:from-primary-900/25 dark:via-canvas-50 dark:to-canvas-50',
        'ring-1 ring-primary-200',
        'shadow-[0_1px_2px_rgb(44_36_22/0.04),0_16px_40px_-24px_rgb(44_36_22/0.35)]',
        'dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]',
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute -top-2 left-4 w-20 h-20 text-primary-500/15 select-none"
      >
        <path d="M9.5 5C6.46 5 4 7.46 4 10.5c0 2.9 2.24 5.27 5.08 5.48-.34 1.2-1.2 2.3-2.58 3.02a.6.6 0 0 0 .3 1.13c3.9-.5 6.7-3.78 6.7-8.13V10.5C13.5 7.46 11.04 5 9.5 5Zm9 0C15.46 5 13 7.46 13 10.5c0 2.9 2.24 5.27 5.08 5.48-.34 1.2-1.2 2.3-2.58 3.02a.6.6 0 0 0 .3 1.13c3.9-.5 6.7-3.78 6.7-8.13V10.5C22.5 7.46 20.04 5 18.5 5Z" />
      </svg>
      <p className="relative z-10 font-heading text-ink-900 text-[clamp(20px,2.6vw,32px)] leading-[1.3] tracking-tight max-w-3xl text-balance">
        {children}
      </p>
    </div>
  )
}

function OpenSourceStrip({
  title,
  description,
  badges,
}: {
  title: string
  description: string
  badges: {label: string; url: string; primary?: boolean; icon?: ReactNode}[]
}) {
  return (
    // `bg-canvas-950` in both themes rather than the old `dark:bg-canvas-300`. Inverting it made the
    // closing block a *pale* slab on a dark page — the one element meant to read as the page's ending
    // instead read as a hole punched in it. Espresso-on-cream and near-black-on-dark both land as the
    // same gesture. Matches the closing strip on /about.
    <div className="relative overflow-hidden w-full bg-canvas-950 rounded-3xl px-7 py-10 sm:px-12 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 w-[440px] h-[440px] rounded-full bg-primary-500/20 blur-3xl"
      />
      <div className="relative flex items-center justify-between gap-8 flex-wrap">
        <div className="max-w-[520px]">
          <h3 className="font-heading text-white text-[clamp(22px,2.4vw,32px)] font-bold leading-tight tracking-tight mb-3 text-balance">
            {title}
          </h3>
          <p className="text-white/70 text-base leading-relaxed">{description}</p>
        </div>
        <Row className="flex flex-wrap gap-3">
          {badges.map((b) => (
            <Link
              href={b.url}
              key={b.label}
              className={clsx(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ease-out',
                b.primary
                  ? 'bg-cta text-white border-cta hover:bg-cta-hover shadow-[0_6px_20px_-6px_rgba(193,127,62,0.6)]'
                  : 'bg-white/[0.06] text-white/70 border-white/10 hover:bg-white/[0.12] hover:text-white',
              )}
            >
              {b.icon}
              {b.label}
            </Link>
          ))}
        </Row>
      </div>
    </div>
  )
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(words: string[]) {
  const elRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    let wordIndex = 0
    let charIndex = 0
    let deleting = false
    let timeoutId: ReturnType<typeof setTimeout>

    function tick() {
      const word = words[wordIndex]

      if (!el) return

      if (!deleting) {
        el.textContent = word.substring(0, charIndex + 1)
        charIndex++
        if (charIndex === word.length) {
          deleting = true
          timeoutId = setTimeout(tick, 1800)
          return
        }
      } else {
        el.textContent = word.substring(0, charIndex - 1)
        charIndex--
        if (charIndex === 0) {
          deleting = false
          wordIndex = (wordIndex + 1) % words.length
        }
      }

      timeoutId = setTimeout(tick, deleting ? 60 : 120)
    }

    timeoutId = setTimeout(tick, 600)
    return () => clearTimeout(timeoutId)
  }, [words])

  return elRef
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LoggedOutHome() {
  const user = useUser()
  const t = useT()

  const typewriterWords = [
    t('home.typewriter.search', 'Search.'),
    t('home.typewriter.connect', 'Connect.'),
    // t('home.typewriter.belong', 'Belong.'),
  ]

  const typewriterRef = useTypewriter(typewriterWords)

  const features: FeatureCardProps[] = [
    {
      icon: EyeIcon,
      title: t('home.feature1.title', 'Radically Transparent'),
      text: t(
        'home.feature1.text',
        'No algorithms. Every profile fully searchable. You decide who to discover — not a black box.',
      ),
    },
    {
      icon: AdjustmentsHorizontalIcon,
      title: t('home.feature2.title', 'Built for Depth'),
      text: t(
        'home.feature2.text',
        'Filter by values, interests, goals, and keywords — from "meditation" to "sustainable living." Surface connections that truly matter.',
      ),
    },
    {
      icon: UsersIcon,
      title: t('home.feature3.title', 'Community Owned'),
      text: t(
        'home.feature3.text',
        'Free forever. No ads, no subscriptions. Built by the people who use it, for the benefit of everyone.',
      ),
    },
  ]

  const openSourceBadges = [
    {
      label: t('home.strip.github', 'GitHub'),
      url: githubRepo,
      icon: <FaGithub className="w-4 h-4" />,
    },
    {
      label: t('home.strip.discord', 'Discord'),
      url: discordLink,
      icon: <FaDiscord className="w-4 h-4" />,
    },
    {label: t('home.strip.join', 'Join Now →'), url: '/register', primary: true},
  ]

  return (
    <>
      {/* Mobile sign-up CTA.
          The fixed positioning now lives on a wrapper rather than on the button itself. Previously the
          button carried `w-full left-0 right-0 px-4`, so it spanned edge to edge and the `px-4` became
          padding *inside* it instead of a gutter — a full-bleed slab with its corners cut off by the
          viewport. The wrapper owns the gutter, the button keeps its radius.
          The gradient backdrop fades page content out behind the bar as it scrolls under; it is
          `pointer-events-none` so the transparent upper half does not swallow taps, with the button
          itself opting back in. */}
      {user === null && (
        <div className="lg:hidden fixed left-0 right-0 bottom-[calc(55px+env(safe-area-inset-bottom))] z-20 px-4 pb-3 pt-8 pointer-events-none bg-gradient-to-t from-canvas-100 via-canvas-100/90 to-transparent">
          <SignUpButton className="pointer-events-auto" size="xl" />
        </div>
      )}

      <div className="flex flex-col items-center w-full px-4 pb-16">
        {/* ── Hero ──
            Two columns from lg up: copy left, phone clip right. Stacked and centred below that, which
            is also the mobile shape. The clip is a portrait phone recording, so stacking it under a
            centred hero on a wide screen left ~535px dead on either side and pushed the features
            section off the fold; side by side, its height is an asset instead of a cost. */}
        <section className="relative w-full max-w-3xl lg:max-w-6xl pt-16 pb-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:gap-14 items-center">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Soft radial glow behind the hero for depth. Dark mode uses a brighter,
              lighter-hued, faster-falloff core so it reads as light, not brown haze. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_60%_at_50%_30%,rgba(193,127,62,0.16),transparent_70%)]"
            />

            <EyebrowBadge>
              {t('home.eyebrow', 'Free forever · Open source · No matching algorithms')}
            </EyebrowBadge>

            <h1 className="animate-fade-up text-[clamp(52px,8vw,96px)] lg:text-[clamp(44px,5.4vw,84px)] leading-none tracking-tight mb-2">
              {t('home.title', "Don't Swipe.")}
            </h1>

            {/* Typewriter line */}
            <div
              // font-heading: this is the second line of the same headline as the <h1> above, but it is a
              // <div>, so the global h1–h6 rule does not reach it — without this the two lines render in
              // different faces.

              // primary-600, not -500: at 69px this counts as large text, which needs 3:1, and the
              // brand base measured 2.70:1 on the light canvas. One step down clears it at 3.71:1,
              // and because the ramp inverts, the dark theme gets a *brighter* amber here (6.8:1)
              // rather than a dimmer one.
              className="animate-fade-up font-heading font-semibold text-[clamp(52px,8vw,96px)] lg:text-[clamp(44px,5.4vw,84px)] leading-none tracking-tight text-primary-600 mb-9 flex items-center justify-center lg:justify-start min-h-[1.1em]"
              style={{animationDelay: '80ms'}}
            >
              <span ref={typewriterRef} />
              <span className="animate-pulse ml-0.5 font-light">|</span>
            </div>

            <p
              className="animate-fade-up text-[clamp(17px,2.2vw,22px)] text-ink-600 leading-relaxed max-w-xl mb-10"
              style={{animationDelay: '160ms'}}
            >
              {t('home.subtitle', 'Find people who share your ')}
              <strong className="text-ink-900">{t('home.subtitle.values', 'values')}</strong>
              {', '}
              <strong className="text-ink-900">{t('home.subtitle.ideas', 'ideas')}</strong>
              {t('home.subtitle.and', ', and ')}
              <strong className="text-ink-900">
                {t('home.subtitle.intentions', 'intentions')}
              </strong>
              {t('home.subtitle.end', ' — not just your photos.')}
            </p>

            {/* CTAs */}
            <div
              className="animate-fade-up flex gap-3 flex-wrap justify-center lg:justify-start items-center mb-10"
              style={{animationDelay: '240ms'}}
            >
              {user === null && (
                <Link
                  href={'/register'}
                  className="hidden sm:inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-cta text-white font-bold text-[15px] shadow-[0_4px_16px_rgba(193,127,62,0.35)] hover:bg-cta-hover hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(193,127,62,0.4)] transition-all duration-150"
                >
                  {t('home.cta.primary', 'Get started — free')}
                </Link>
              )}
              {/* Was a hardcoded `text-[#8B5E3C]`, which is a light-mode value: on the dark theme it
                  rendered dark-brown-on-dark and all but disappeared (2.7:1). `ink-900` rather than a
                  `primary-*` step because the ink ramp inverts reliably between themes, and it matches
                  the outline buttons on /about. The accent stays on the border and the hover. */}
              <Link
                href={'/about'}
                className="px-7 py-3.5 rounded-xl bg-transparent text-ink-900 font-semibold text-[15px] border-2 border-canvas-200 hover:border-primary-500 hover:text-primary-500 hover:-translate-y-0.5 transition-all duration-200 ease-out"
              >
                {t('home.cta.secondary', 'Learn how it works')}
              </Link>
            </div>

            {/* Social proof */}
            <div className="animate-fade-up" style={{animationDelay: '320ms'}}>
              <SocialProof
                label={
                  <>
                    {t('home.proof.prefix', 'Joined by ')}
                    <strong className="text-ink-900">{t('home.proof.count', '700+')}</strong>
                    {t('home.proof.suffix', ' real people worldwide')}
                  </>
                }
              />
            </div>
          </div>

          {/* Proof of the hero's claim: the headline says "Don't Swipe. Search." and this is what
              searching actually looks like. */}
          <SearchDemo />
        </section>

        {/* Every section below the hero shares the hero's container instead of stepping through
            max-w-3xl / 4xl / 2xl / 3xl as it used to. Those four different widths gave the page a
            ragged left and right edge all the way down; the measure is now capped on the text inside
            each block rather than on the blocks themselves. The gradient divider that used to sit here
            is gone with it — `Section`'s rhythm separates them without a drawn rule. */}
        <div className="w-full max-w-6xl">
          {/* ── Features ── */}
          <Section>
            <p className={clsx(eyebrow, 'text-center text-primary-700 mb-3')}>
              {t('home.features.label', 'Why Compass')}
            </p>
            <h2 className="text-center text-[clamp(26px,3.4vw,40px)] text-ink-1000 tracking-tight mb-12 text-balance">
              {t('home.features.title', 'Built different. On purpose.')}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <FeatureCard {...f} />
                </Reveal>
              ))}
            </div>
          </Section>

          {/* ── Quote ── */}
          <Section>
            <Reveal>
              <QuoteBlock>
                {t('home.quote.prefix', 'Compass is to human connection what ')}
                <strong className="text-primary-700">{t('home.quote.linux', 'Linux')}</strong>
                {t('home.quote.linux_suffix', ' is to software, ')}
                <strong className="text-primary-700">
                  {t('home.quote.wikipedia', 'Wikipedia')}
                </strong>
                {t('home.quote.wikipedia_suffix', ' is to knowledge, and ')}
                <strong className="text-primary-700">{t('home.quote.firefox', 'Firefox')}</strong>
                {t('home.quote.end', ' is to browsing — a public digital good designed to ')}
                <strong className="text-primary-700">
                  {t('home.quote.mission', 'serve people, not profit.')}
                </strong>
              </QuoteBlock>
            </Reveal>
          </Section>

          {/* ── Open source strip ── */}
          <Section>
            <Reveal>
              <OpenSourceStrip
                title={t('home.strip.title', 'Open Source & Free Forever')}
                description={t(
                  'home.strip.description',
                  'No venture capital. No ads. No subscription fees. Built transparently by the community, for the community.',
                )}
                badges={openSourceBadges}
              />
            </Reveal>
          </Section>
        </div>
      </div>

      {/* Mobile bottom spacing */}
      <div className="block lg:hidden h-12" />
    </>
  )
}
