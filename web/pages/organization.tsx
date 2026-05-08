import {ReactNode} from 'react'
import {GeneralButton} from 'web/components/buttons/general-button'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkItem {
  url: string
  label: string
  primary?: boolean
}

interface SectionCardProps {
  icon: string
  title: string
  description: string
  links: LinkItem[]
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({icon, title, description, links}: SectionCardProps) {
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
      <div className="w-11 h-11 rounded-xl bg-canvas-200 border border-canvas-300 flex items-center justify-center text-xl mb-5 flex-shrink-0">
        {icon}
      </div>

      {/* Title & description */}
      <h2 className="font-bold text-ink-900 mb-2">{title}</h2>
      <p className="text-sm text-ink-500 leading-relaxed mb-6">{description}</p>

      {/* Links */}
      <div className="flex flex-wrap gap-2">
        {links.map(({url, label, primary}) => (
          <GeneralButton
            key={url}
            url={url}
            content={label}
            color={
              primary
                ? 'bg-primary-500 hover:bg-primary-600 text-white border-primary-500 shadow-[0_3px_12px_rgba(193,127,62,0.3)] text-sm'
                : 'bg-canvas-100 border-canvas-300 text-ink-900 hover:border-primary-500 hover:text-primary-500 text-sm'
            }
          />
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

export default function Organization() {
  const t = useT()

  const sections: SectionCardProps[] = [
    {
      icon: 'ℹ️',
      title: t('organization.about.title', 'About us'),
      description: t(
        'organization.about.desc',
        'Who we are, our mission, and how the organization works.',
      ),
      links: [
        {url: '/about', label: t('about.seo.description', 'About Compass'), primary: true},
        {url: '/constitution', label: t('organization.constitution', 'Our constitution')},
      ],
    },
    {
      icon: '📊',
      title: t('organization.proof.title', 'Proof & transparency'),
      description: t(
        'organization.proof.desc',
        'Key numbers, progress, and what others say about us.',
      ),
      links: [
        {url: '/stats', label: t('organization.stats', 'Key metrics & growth'), primary: true},
        {url: '/press', label: t('press.title', 'Press')},
        {url: '/financials', label: t('organization.financials', 'Financial transparency')},
      ],
    },
    {
      icon: '💬',
      title: t('organization.contactSection.title', 'Contact & support'),
      description: t(
        'organization.contactSection.desc',
        'Need help or want to reach us? Start here.',
      ),
      links: [
        {url: '/contact', label: t('organization.contact', 'Contact us'), primary: true},
        {url: '/help', label: t('organization.help', 'Help & support center')},
      ],
    },
    {
      icon: '🔒',
      title: t('organization.trust.title', 'Trust & legal'),
      description: t(
        'organization.trust.desc',
        'How we protect your data and the rules that govern the platform.',
      ),
      links: [
        {url: '/security', label: t('organization.security', 'Security'), primary: true},
        {url: '/terms', label: t('organization.terms', 'Terms and conditions')},
        {url: '/privacy', label: t('organization.privacy', 'Privacy policy')},
      ],
    },
  ]

  return (
    <PageBase trackPageView={'social'}>
      <SEO
        title={t('organization.seo.title', 'Organization')}
        description={t('organization.seo.description', 'Organization')}
        url="/organization"
      />

      <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
        {/* ── Page header ── */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-primary-500 mb-3">
            {t('organization.eyebrow', 'Compass')}
          </p>
          <h1 className="text-[clamp(28px,4vw,40px)] font-black text-ink-900 tracking-tight leading-tight mb-3">
            {t('organization.title', 'Organization')}
          </h1>
          <p className="text-lg text-ink-500 max-w-2xl leading-relaxed">
            {t(
              'organization.subtitle',
              'Everything about how Compass is run, governed, and built — transparently.',
            )}
          </p>
        </div>
        <Divider />
        <SectionLabel>{t('organization.sections.label', 'Explore')}</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((s) => (
            <SectionCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </PageBase>
  )
}
