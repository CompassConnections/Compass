import clsx from 'clsx'
import {discordLink, formLink, githubRepo} from 'common/constants'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import Link from 'next/link'
import {ReactNode} from 'react'
import {CopyLinkOrShareButton, ShareProfileOnXButton} from 'web/components/buttons/copy-link-button'
import {GeneralButton} from 'web/components/buttons/general-button'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: string
  title: string
  text: ReactNode
}

interface HelpCardProps {
  icon: string
  title: string
  text: ReactNode
  buttonLabel: string
  buttonUrl: string
  buttonPrimary?: boolean
  id?: string
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({icon, title, text}: FeatureCardProps) {
  return (
    <div
      className="
        group relative overflow-hidden
        bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-7
        transition-all duration-[120ms] ease-in
        hover:shadow-[0_10px_30px_rgba(44,36,22,0.09)]
        hover:border-primary-500
      "
    >
      <div className="w-11 h-11 rounded-xl bg-canvas-200 border border-canvas-300 flex items-center justify-center text-xl mb-5 flex-shrink-0">
        {icon}
      </div>
      <h3 className="font-bold text-ink-900 mb-2.5">{title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{text}</p>
    </div>
  )
}

// ─── Full-width Feature Card ──────────────────────────────────────────────────

function FeatureCardWide({icon, title, text}: FeatureCardProps) {
  return (
    <div
      className="
        group relative overflow-hidden col-span-1 md:col-span-2
        bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-7
        flex flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-6
        transition-all duration-[120ms] ease-in
        hover:shadow-[0_10px_30px_rgba(44,36,22,0.09)]
        hover:border-primary-500
      "
    >
      <div className="w-11 h-11 rounded-xl bg-canvas-200 border border-canvas-300 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className={'min-w-0'}>
        <h3 className="font-bold text-ink-900 mb-2">{title}</h3>
        <p className="text-sm text-ink-500 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

// ─── Help Card ────────────────────────────────────────────────────────────────

function HelpCard({icon, title, text, buttonLabel, buttonUrl, buttonPrimary, id}: HelpCardProps) {
  return (
    <div
      className="
        group relative overflow-hidden
        bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-7
        transition-all duration-[120ms] ease-in
        hover:shadow-[0_10px_30px_rgba(44,36,22,0.09)]
        hover:border-primary-500
      "
      // NOTE: Abandoned the left accent bar due to a known Firefox rendering bug.
      // Firefox fails to correctly apply overflow-hidden on rounded containers with borders,
      // causing the absolute/flex-item to bleed past the corner radius.
      // Removed for cross-browser consistency.
    >
      <div className="w-10 h-10 rounded-xl bg-canvas-200 border border-canvas-300 flex items-center justify-center text-lg mb-4 flex-shrink-0">
        {icon}
      </div>
      <h3 id={id} className="font-bold text-ink-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-ink-500 leading-relaxed flex-1 mb-5">{text}</p>
      <div>
        <GeneralButton
          url={buttonUrl}
          content={buttonLabel}
          color={
            buttonPrimary
              ? 'bg-primary-500 hover:bg-primary-600 text-white border-primary-500 shadow-[0_3px_12px_rgba(193,127,62,0.3)]'
              : 'bg-canvas-100 hover:border-primary-600 hover:text-primary-600 border-canvas-300 text-ink-900'
          }
        />
      </div>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({children}: {children: ReactNode}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-ink-500">
        {children}
      </span>
      <div className="flex-1 h-px bg-canvas-200" />
    </div>
  )
}

// ─── Share Strip ──────────────────────────────────────────────────────────────

function ShareStrip({title, text}: {title: string; text: string}) {
  const t = useT()
  return (
    <div className="bg-canvas-950 rounded-2xl px-9 py-8 flex items-center justify-between gap-6 flex-wrap">
      <div className={'max-w-[450px]'}>
        <h3 className="text-white text-lg font-bold mb-1.5">📣 {title}</h3>
        <p className="text-primary-500 text-sm leading-relaxed">{text}</p>
      </div>
      <Row className="flex gap-2 flex-wrap">
        {/*//     */}
        {/*//     ${*/}
        {/*//       primary*/}
        {/*//         ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600'*/}
        {/*//         : 'bg-white/[0.06] text-canvas-200 border-white/10 hover:bg-white/[0.12] hover:text-canvas-50'*/}
        {/*//     }*/}
        <ShareProfileOnXButton
          className={clsx(
            'px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150',
            'bg-white/[0.06] !text-white/60 border-white/10 hover:bg-white/[0.12] hover:text-white',
          )}
        />
        <CopyLinkOrShareButton
          url={DEPLOYED_WEB_URL}
          children={t('about.copy_link', ' Copy Link')}
          className={clsx(
            'px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150',
            'bg-primary-500 text-white hover:text-white border-primary-500 hover:bg-primary-600',
          )}
        />
      </Row>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-canvas-200 to-transparent my-10" />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function About() {
  const t = useT()

  const features: (FeatureCardProps & {wide?: boolean})[] = [
    {
      icon: '🔍',
      title: t('about.block.keyword.title', 'Keyword Search the Database'),
      text: t(
        'about.block.keyword.text',
        '"Meditation", "Hiking", "Neuroscience", "Nietzsche". Access any profile and get niche.',
      ),
    },
    {
      icon: '🔔',
      title: t('about.block.notify.title', 'Get Notified About Searches'),
      text: t(
        'about.block.notify.text',
        "No need to constantly check the app! We'll contact you when new users fit your searches.",
      ),
    },
    {
      icon: '🎭',
      title: t('about.block.personality.title', 'Personality-Centered'),
      text: t('about.block.personality.text', 'Values and interests first, photos are secondary.'),
    },
    {
      icon: '🎁',
      title: t('about.block.free.title', 'Completely Free'),
      text: t('about.block.free.text', 'Subscription-free. Paywall-free. Ad-free.'),
    },
    {
      icon: '🗳️',
      title: t('about.block.democratic.title', 'Democratic'),
      text: (
        <span>
          {t('about.block.democratic.prefix', 'Governed and ')}
          <Link href="/vote" className="text-primary-500 hover:underline">
            {t('about.block.democratic.link_voted', 'voted')}
          </Link>
          {t(
            'about.block.democratic.middle',
            ' by the community, while ensuring no drift through our ',
          )}
          <Link href="/constitution" className="text-primary-500 hover:underline">
            {t('about.block.democratic.link_constitution', 'constitution')}
          </Link>
          {t('about.block.democratic.suffix', '.')}
        </span>
      ),
    },
    {
      icon: '🎯',
      title: t('about.block.mission.title', 'One Mission'),
      text: t(
        'about.block.mission.text',
        'Our only mission is to create more genuine human connections, and every decision must serve that goal.',
      ),
    },
    {
      icon: '🌍',
      title: t('about.block.vision.title', 'Vision'),
      text: t(
        'about.block.vision.text',
        'Compass is to human connection what Linux, Wikipedia, and Firefox are to software and knowledge: a public good built by the people who use it, for the benefit of everyone.',
      ),
      wide: true,
    },
  ]

  const helpCards: HelpCardProps[] = [
    {
      icon: '💡',
      id: 'give-suggestions-or-contribute',
      title: t('about.suggestions.title', 'Give Suggestions or Contribute'),
      text: t(
        'about.suggestions.text',
        'Give suggestions or let us know you want to help through this form. Every idea matters.',
      ),
      buttonLabel: t('about.suggestions.button', 'Suggest Here →'),
      buttonUrl: formLink,
      // buttonPrimary: true,
    },
    {
      icon: '💻',
      id: 'share',
      title: t('about.dev.title', 'Develop the App'),
      text: t(
        'about.dev.text',
        'The full source code and instructions are available on GitHub. PRs welcome.',
      ),
      buttonLabel: t('about.dev.button', 'View Code →'),
      buttonUrl: githubRepo,
    },
    {
      icon: '💬',
      id: 'join-chats',
      title: t('about.join.title', 'Join the Community'),
      text: t(
        'about.join.text',
        "Let's shape the platform together. Share ideas, give feedback, meet other builders.",
      ),
      buttonLabel: t('about.join.button', 'Join the Discord →'),
      buttonUrl: discordLink,
    },
    {
      icon: '❤️',
      id: 'donate',
      title: t('about.donate.title', 'Donate'),
      text: t(
        'about.donate.text',
        'Support our not-for-profit infrastructure. Every contribution keeps the lights on.',
      ),
      buttonLabel: t('about.donate.button', 'Donation Options →'),
      buttonUrl: '/support',
    },
  ]

  return (
    <PageBase trackPageView={'about'}>
      <SEO
        title={t('about.seo.title', 'About')}
        description={t('about.seo.description', 'About Compass')}
        url="/about"
      />

      <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
        {/* ── Page header ── */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-primary-500 mb-3">
            {t('about.eyebrow', 'About Compass')}
          </p>
          <h1 className="text-[clamp(28px,4vw,40px)] font-black text-ink-900 tracking-tight leading-tight mb-3">
            {t('about.title', 'Why Choose Compass?')}
          </h1>
          <p className="text-lg text-ink-500 max-w-lg leading-relaxed">
            {t(
              'about.subtitle',
              'To find your people with ease — based on who they are, not how they look.',
            )}
          </p>
        </div>

        {/* ── Features ── */}
        <SectionLabel>{t('about.features.label', 'What makes us different')}</SectionLabel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {features.map((f) =>
            f.wide ? (
              <FeatureCardWide key={f.title} icon={f.icon} title={f.title} text={f.text} />
            ) : (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} text={f.text} />
            ),
          )}
        </div>

        <Divider />

        {/* ── Help ── */}
        <SectionLabel>{t('about.help.label', 'Help Compass grow')}</SectionLabel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {helpCards.map((card) => (
            <HelpCard key={card.id} {...card} />
          ))}
        </div>

        {/* ── Share strip ── */}
        <ShareStrip
          title={t('about.final.title', 'Tell Your Friends and Family')}
          text={t(
            'about.final.text',
            'The best way to grow Compass is word of mouth. Thank you for supporting our mission.',
          )}
        />
      </div>
    </PageBase>
  )
}
