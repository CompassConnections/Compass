import {CodeBracketIcon, EnvelopeIcon, MegaphoneIcon, UsersIcon} from '@heroicons/react/24/outline'
import {
  discordLink,
  githubRepo,
  instagramLink,
  redditLink,
  supportEmail,
  xLink,
} from 'common/constants'
import {ComponentType, ReactNode, SVGProps} from 'react'
import {FaDiscord, FaGithub, FaInstagram, FaReddit} from 'react-icons/fa'
import {FaXTwitter} from 'react-icons/fa6'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

// ─── Types ────────────── ──────────────────────────────────────────────────────

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface SocialLink {
  url: string
  label: string
  icon: ReactNode
  primary?: boolean
}

interface SectionCardProps {
  icon: IconType
  title: string
  description: string
  links: SocialLink[]
}

// ─── Social Link Button ───────────────────────────────────────────────────────

function SocialLinkButton({url, label, icon, primary}: SocialLink) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl
        border-[1.5px] text-sm font-semibold
        transition-all duration-[120ms] ease-in
        hover:-translate-y-0.5
        ${
          primary
            ? 'bg-primary-500 border-primary-500 text-white hover:bg-primary-600 shadow-[0_3px_12px_rgba(193,127,62,0.3)]'
            : 'bg-canvas-100 border-canvas-300 text-ink-900 hover:border-primary-500 hover:text-primary-500'
        }
      `}
    >
      {icon && <span className="flex items-center text-base leading-none">{icon}</span>}
      {label}
    </a>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({icon: Icon, title, description, links}: SectionCardProps) {
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
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-primary-100 border border-primary-200 flex items-center justify-center mb-5 flex-shrink-0">
        <Icon className="w-5 h-5 text-primary-600" strokeWidth={1.8} />
      </div>

      {/* Title & description */}
      <h2 className="font-bold text-ink-900 mb-1.5">{title}</h2>
      <p className="text-sm text-ink-500 leading-relaxed mb-5">{description}</p>

      {/* Links */}
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <SocialLinkButton key={link.url} {...link} />
        ))}
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

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-canvas-200 to-transparent my-8" />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Social() {
  const t = useT()

  const sections: SectionCardProps[] = [
    {
      icon: UsersIcon,
      title: t('social.community.title', 'Community'),
      description: t(
        'social.community.desc',
        'Join our community chats and shape the platform with us.',
      ),
      links: [
        {
          url: discordLink,
          label: t('social.discord', 'Discord'),
          icon: <FaDiscord className="w-4 h-4" />,
          primary: true,
        },
        {
          url: redditLink,
          label: t('social.reddit', 'Reddit'),
          icon: <FaReddit className="w-4 h-4" />,
        },
        // {url: stoatLink, label: t('social.stoat', 'Revolt / Stoat'), icon: '💬'},
      ],
    },
    {
      icon: MegaphoneIcon,
      title: t('social.follow.title', 'Follow & Updates'),
      description: t(
        'social.follow.desc',
        'Stay informed about announcements, releases, and news.',
      ),
      links: [
        {
          url: xLink,
          label: t('social.x', 'X / Twitter'),
          icon: <FaXTwitter className="w-4 h-4" />,
          primary: true,
        },
        {
          url: instagramLink,
          label: t('social.instagram', 'Instagram'),
          icon: <FaInstagram className="w-4 h-4" />,
        },
      ],
    },
    {
      icon: CodeBracketIcon,
      title: t('social.dev.title', 'Development'),
      description: t(
        'social.dev.desc',
        'Explore our source code, open issues, or contribute a PR.',
      ),
      links: [
        {
          url: githubRepo,
          label: t('social.github', 'GitHub'),
          icon: <FaGithub className="w-4 h-4" />,
          primary: true,
        },
      ],
    },
    {
      icon: EnvelopeIcon,
      title: t('social.contact.title', 'Contact'),
      description: t('social.contact.desc', 'Reach out to us directly for inquiries or support.'),
      links: [
        {
          url: `mailto:${supportEmail}`,
          label: `${t('social.email_button', 'Email us')}`,
          icon: <EnvelopeIcon className="w-4 h-4" strokeWidth={1.8} />,
          primary: true,
        },
      ],
    },
  ]

  return (
    <PageBase trackPageView={'social'}>
      <SEO
        title={t('social.seo.title', 'Socials')}
        description={t('social.seo.description', 'All our social channels and contact info')}
        url="/social"
      />

      <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
        {/* ── Page header ── */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-primary-500 mb-3">
            {t('social.eyebrow', 'Connect with us')}
          </p>
          <h1 className="text-[clamp(28px,4vw,40px)] font-black text-ink-900 tracking-tight leading-tight mb-3">
            {t('social.title', 'Socials')}
          </h1>
          <p className="text-lg text-ink-500 max-w-2xl leading-relaxed">
            {t(
              'social.subtitle',
              'Find us across the web — join the conversation, follow updates, or say hello.',
            )}
          </p>
        </div>

        <Divider />

        {/* ── Cards ── */}
        <SectionLabel>{t('social.sections.label', 'Our channels')}</SectionLabel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((s) => (
            <SectionCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </PageBase>
  )
}
