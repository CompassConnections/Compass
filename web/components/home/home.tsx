import {AdjustmentsHorizontalIcon, EyeIcon, UsersIcon} from '@heroicons/react/24/outline'
import {discordLink, githubRepo} from 'common/constants'
import Link from 'next/link'
import {ComponentType, ReactNode, SVGProps, useEffect, useRef} from 'react'
import {FaDiscord, FaGithub} from 'react-icons/fa'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SignUpButton} from 'web/components/nav/sidebar'
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
    <div className="inline-flex items-center gap-2 bg-canvas-200 text-primary-700 border border-primary-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 animate-fade-up">
      {/*<span className="w-2 h-2 rounded-full bg-[#6B8F71] inline-block" />*/}
      {children}
    </div>
  )
}

function FeatureCard({icon: Icon, title, text}: FeatureCardProps) {
  return (
    <div
      className="
      group relative overflow-hidden
      bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-7
      transition-all duration-200
      hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(44,36,22,0.10)] hover:border-primary-500
    "
    >
      <div className="w-11 h-11 rounded-xl bg-primary-100 border border-primary-200 flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-primary-600" strokeWidth={1.8} />
      </div>
      <h3 className="font-bold text-ink-1000 mb-2.5">{title}</h3>
      <p className="text-sm text-ink-600 leading-relaxed">{text}</p>
    </div>
  )
}

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
  const avatars: SocialAvatarProps[] = [
    {letter: 'S', gradient: 'linear-gradient(135deg, #C17F3E, #8B5E3C)'},
    {letter: 'R', gradient: 'linear-gradient(135deg, #6B8F71, #4A7055)'},
    {letter: 'T', gradient: 'linear-gradient(135deg, #8B5E3C, #6B3E22)'},
    {letter: 'L', gradient: 'linear-gradient(135deg, #C17F3E, #D4955A)'},
  ]

  return (
    <div className="flex items-center gap-3 text-ink-600 text-sm">
      <div className="flex">
        {avatars.map((av) => (
          <SocialAvatar key={av.letter} {...av} />
        ))}
      </div>
      <span>{label}</span>
    </div>
  )
}

function QuoteBlock({children}: {children: React.ReactNode}) {
  return (
    <div className="relative bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl px-10 py-9 text-center max-w-2xl mx-auto mb-14">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute top-2 left-3 w-9 h-9 text-primary-500/30 select-none"
      >
        <path d="M9.5 5C6.46 5 4 7.46 4 10.5c0 2.9 2.24 5.27 5.08 5.48-.34 1.2-1.2 2.3-2.58 3.02a.6.6 0 0 0 .3 1.13c3.9-.5 6.7-3.78 6.7-8.13V10.5C13.5 7.46 11.04 5 9.5 5Zm9 0C15.46 5 13 7.46 13 10.5c0 2.9 2.24 5.27 5.08 5.48-.34 1.2-1.2 2.3-2.58 3.02a.6.6 0 0 0 .3 1.13c3.9-.5 6.7-3.78 6.7-8.13V10.5C22.5 7.46 20.04 5 18.5 5Z" />
      </svg>
      <p className="relative z-10 text-base text-ink-600 italic leading-relaxed">{children}</p>
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
    <div className="w-full max-w-3xl bg-canvas-950 dark:bg-canvas-300 rounded-2xl px-10 py-8 flex items-center justify-between gap-6 flex-wrap">
      <div>
        <h3 className="text-white text-xl font-bold mb-1.5">{title}</h3>
        <p className="text-white/55 text-sm leading-relaxed">{description}</p>
      </div>
      <Row className="flex flex-wrap gap-4">
        {badges.map((b) => (
          <Link
            href={b.url}
            key={b.label}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150
              ${
                b.primary
                  ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600'
                  : 'bg-primary-500/30 text-white/75 border-primary-500/30 hover:bg-primary-500/50'
              }
            `}
          >
            {b.icon}
            {b.label}
          </Link>
        ))}
      </Row>
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
        'Filter by values, interests, goals, and keywords — from "stoicism" to "sustainable living." Surface connections that truly matter.',
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
      {/* Mobile sign-up CTA */}
      {user === null && (
        <Col className="mb-4 gap-2 lg:hidden">
          <SignUpButton
            className="mt-4 flex-1 fixed bottom-[calc(55px+env(safe-area-inset-bottom))] w-full left-0 right-0 z-10 mx-auto px-4"
            size="xl"
          />
        </Col>
      )}

      <div className="flex flex-col items-center w-full px-4 pb-16">
        {/* ── Hero ── */}
        <section className="relative flex flex-col items-center text-center max-w-3xl w-full pt-16 pb-12">
          {/* Soft radial glow behind the hero for depth. Dark mode uses a brighter,
              lighter-hued, faster-falloff core so it reads as light, not brown haze. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_60%_at_50%_30%,rgba(193,127,62,0.16),transparent_70%)]"
          />

          <EyebrowBadge>
            {t('home.eyebrow', 'Free forever · Open source · No matching algorithms')}
          </EyebrowBadge>

          <h1 className="animate-fade-up text-[clamp(52px,8vw,96px)] font-black leading-none tracking-tight mb-2">
            {t('home.title', "Don't Swipe.")}
          </h1>

          {/* Typewriter line */}
          <div
            className="animate-fade-up text-[clamp(52px,8vw,96px)] font-black leading-none tracking-tight text-primary-500 mb-9 flex items-center justify-center min-h-[1.1em]"
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
            <strong className="text-ink-900">{t('home.subtitle.intentions', 'intentions')}</strong>
            {t('home.subtitle.end', ' — not just your photos.')}
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up flex gap-3 flex-wrap justify-center items-center mb-10"
            style={{animationDelay: '240ms'}}
          >
            {user === null && (
              <Link
                href={'/register'}
                className="hidden sm:inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-primary-500 text-white font-bold text-[15px] shadow-[0_4px_16px_rgba(193,127,62,0.35)] hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(193,127,62,0.4)] transition-all duration-150"
              >
                {t('home.cta.primary', 'Get started — free')}
              </Link>
            )}
            <Link
              href={'/about'}
              className="px-7 py-3.5 rounded-xl bg-transparent text-[#8B5E3C] font-semibold text-[15px] border-2 border-canvas-200 hover:border-primary-500 hover:text-primary-500 hover:-translate-y-0.5 transition-all duration-150"
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
                  <strong className="text-ink-900">{t('home.proof.count', '600+')}</strong>
                  {t('home.proof.suffix', ' real people worldwide')}
                </>
              }
            />
          </div>
        </section>

        {/* Divider */}
        <div className="w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-[#D8D0C4] to-transparent mb-14" />

        {/* ── Features ── */}
        <section className="w-full max-w-4xl mb-14">
          <p className="text-center text-xs font-bold tracking-[1.5px] uppercase text-primary-500 mb-3">
            {t('home.features.label', 'Why Compass')}
          </p>
          <h2 className="text-center text-[clamp(24px,3vw,32px)] font-extrabold text-ink-1000 tracking-tight mb-10">
            {t('home.features.title', 'Built different. On purpose.')}
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* ── Quote ── */}
        <QuoteBlock>
          {t('home.quote.prefix', 'Compass is to human connection what ')}
          <strong className="text-ink-900">{t('home.quote.linux', 'Linux')}</strong>
          {t('home.quote.linux_suffix', ' is to software, ')}
          <strong className="text-ink-900">{t('home.quote.wikipedia', 'Wikipedia')}</strong>
          {t('home.quote.wikipedia_suffix', ' is to knowledge, and ')}
          <strong className="text-ink-900">{t('home.quote.firefox', 'Firefox')}</strong>
          {t('home.quote.end', ' is to browsing — a public digital good designed to ')}
          <strong className="text-ink-900">
            {t('home.quote.mission', 'serve people, not profit.')}
          </strong>
        </QuoteBlock>

        {/* ── Open source strip ── */}
        <OpenSourceStrip
          title={t('home.strip.title', 'Open Source & Free Forever')}
          description={t(
            'home.strip.description',
            'No venture capital. No ads. No subscription fees. Built transparently by the community, for the community.',
          )}
          badges={openSourceBadges}
        />
      </div>

      {/* Mobile bottom spacing */}
      <div className="block lg:hidden h-12" />
    </>
  )
}
