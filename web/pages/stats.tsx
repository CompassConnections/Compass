import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  CakeIcon,
  CalendarDaysIcon,
  ChatBubbleOvalLeftIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  FingerPrintIcon,
  FlagIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  HeartIcon,
  LanguageIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  SunIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {type DemographicField, type Stats} from 'common/stats'
import {ComponentType, ReactNode, SVGProps, useEffect, useState} from 'react'
import {SectionLabel} from 'web/components/about/section'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import ChartMembers from 'web/components/widgets/charts'
import {CountrySpread, MIN_COUNTRIES} from 'web/components/widgets/country-spread'
import {Reveal} from 'web/components/widgets/reveal'
import {DistributionCard} from 'web/components/widgets/stat-distribution'
import {eyebrow, Section, surface, surfaceHover} from 'web/components/widgets/surface'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {getCount} from 'web/lib/supabase/users'

// ─── Types ────────────────────────────────────────────────────────────────────

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface StatCardProps {
  value: string | number | null | undefined
  label: string
  icon: IconType
  accent?: 'amber' | 'sage' | 'muted'
}

interface StatGroupProps {
  title: string
  /** Optional block sharing the group's row — the right column on large screens. */
  aside?: ReactNode
  children: ReactNode
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({value, label, icon: Icon, accent = 'amber'}: StatCardProps) {
  if (value === null || value === undefined || value === 0) return null

  const formatted = typeof value === 'number' ? formatNumber(value) : value

  const accentClasses = {
    amber: 'text-primary-600',
    sage: 'text-green-600',
    muted: 'text-ink-700',
  }

  return (
    <div className={clsx(surface, surfaceHover, 'group p-5 sm:p-6')}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 ring-1 ring-primary-200">
        <Icon className="h-[18px] w-[18px] text-primary-600" strokeWidth={1.8} />
      </div>

      <div
        className={clsx(
          'mb-2 text-3xl font-black leading-none tracking-tight',
          accentClasses[accent],
        )}
      >
        {formatted}
      </div>

      <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-ink-500">
        {label}
      </p>
    </div>
  )
}

// ─── Stat Group ───────────────────────────────────────────────────────────────

function StatGroup({title, aside, children}: StatGroupProps) {
  return (
    <>
      <SectionLabel>{title}</SectionLabel>
      {/* With an `aside`, the cards give up half the width and drop to a 2×2 block beside it on large
          screens; without one they keep the full-width 4-up row. The aside stacks underneath below
          `lg` rather than squeezing — its country bars need the horizontal room. */}
      <div className={clsx('grid gap-3 sm:gap-4', aside && 'items-start lg:grid-cols-2')}>
        <div
          className={clsx(
            'grid grid-cols-2 gap-3 sm:gap-4',
            aside ? 'md:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-4',
          )}
        >
          {children}
        </div>
        {aside}
      </div>
    </>
  )
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────

function ChartCard() {
  const t = useT()
  return (
    <div className={clsx(surface, 'p-5 sm:p-6')}>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 ring-1 ring-primary-200">
          <ArrowTrendingUpIcon className="h-[18px] w-[18px] text-primary-600" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-bold leading-tight text-ink-900">
            {t('stats.chart.title', 'Member Growth')}
          </h2>
          <p className="text-xs text-ink-500">
            {t('stats.chart.subtitle', 'Total & completed profiles over time')}
          </p>
        </div>
      </div>
      <ChartMembers />
    </div>
  )
}

// ─── Hero highlight band ────────────────────────────────────────────────────────

function HighlightRow({
  members,
  active,
  messages,
  countries,
}: {
  members: number | null
  active: number | null
  messages: number | null | undefined
  countries: number | null | undefined
}) {
  const t = useT()
  const items: {
    value: number | null | undefined
    label: string
    icon: IconType
    accent: 'amber' | 'sage'
  }[] = [
    {
      value: members,
      label: t('stats.highlight.members', 'Total Members'),
      icon: UsersIcon,
      accent: 'amber' as const,
    },
    {
      value: active,
      label: t('stats.highlight.active', 'Active (last month)'),
      icon: BoltIcon,
      accent: 'sage' as const,
    },
    {
      value: messages,
      label: t('stats.highlight.messages', 'Messages sent'),
      icon: EnvelopeIcon,
      accent: 'amber' as const,
    },
    {
      value: countries && countries > 1 ? countries : undefined,
      label: t('stats.highlight.countries', 'Countries'),
      icon: GlobeAltIcon,
      accent: 'sage' as const,
    },
  ].filter((i) => !!i.value)

  if (!items.length) return null

  return (
    <div
      className={clsx(
        'grid grid-cols-2 gap-3 sm:gap-4',
        items.length >= 4 ? 'lg:grid-cols-4' : 'sm:grid-cols-3',
      )}
    >
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <Reveal key={item.label} delay={i * 60}>
            <div className="relative h-full overflow-hidden rounded-2xl border-[1.5px] border-canvas-900 bg-canvas-950 p-5 sm:p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-500/10 blur-2xl"
              />
              <div className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-canvas-900">
                <Icon className="h-[18px] w-[18px] text-primary-400" strokeWidth={1.8} />
              </div>
              <div
                className={clsx(
                  'relative mb-2 text-3xl font-black leading-none tracking-tight sm:text-4xl',
                  item.accent === 'sage' ? 'text-green-500' : 'text-primary-400',
                )}
              >
                {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
              </div>
              <p className="relative text-xs font-semibold uppercase tracking-wide text-white/60">
                {item.label}
              </p>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

// ─── Demographics ───────────────────────────────────────────────────────────────

/**
 * The order and chrome of the "Who's on Compass" cards. The data (and whether a field appears at all)
 * comes from the `stats` payload — a field the backend withheld for too few respondents simply has no
 * entry here, and its `DistributionCard` renders nothing. Gender leads (with the country card beside it,
 * inserted separately below), then the rest run roughly most-universal first: nearly everyone has an age
 * and an education; a language or relationship-status breakdown is a deeper cut.
 */
const DEMOGRAPHIC_CARDS: {field: DemographicField; title: string; icon: IconType}[] = [
  {field: 'gender', title: 'Gender', icon: ScaleIcon},
  {field: 'age', title: 'Age', icon: CalendarDaysIcon},
  {field: 'pref_relation_styles', title: 'Looking for', icon: MagnifyingGlassIcon},
  {field: 'orientation', title: 'Orientation', icon: HeartIcon},
  {field: 'relationship_status', title: 'Relationship status', icon: LinkIcon},
  {field: 'ethnicity', title: 'Ethnicity', icon: GlobeAltIcon},
  {field: 'education_level', title: 'Education', icon: AcademicCapIcon},
  {field: 'political_beliefs', title: 'Politics', icon: FlagIcon},
  {field: 'religion', title: 'Religion & spirituality', icon: SunIcon},
  {field: 'diet', title: 'Diet', icon: CakeIcon},
  {field: 'mbti', title: 'Personality (MBTI)', icon: FingerPrintIcon},
  {field: 'languages', title: 'Languages spoken', icon: LanguageIcon},
]

// This section absorbed what used to be the standalone "Community" block: the gender split and the
// country spread are just two more ways of answering "who's on Compass", so they sit in the same grid as
// the profile-field breakdowns rather than in a section of their own. The bare member/active/endorsement
// counts that lived there are dropped — the hero band above already carries the headline totals.
function Demographics({stats}: {stats: Stats}) {
  const t = useT()
  const {demographics, countries, countryCount} = stats
  const cards = DEMOGRAPHIC_CARDS.filter((c) => demographics[c.field])
  const hasCountries = (countries?.length ?? 0) >= MIN_COUNTRIES
  if (!cards.length && !hasCountries) return null

  return (
    <Section>
      <SectionLabel>{t('stats.demographics.label', "Who's on Compass")}</SectionLabel>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink-600">
        {t(
          'stats.demographics.subtitle',
          'Self-reported by members, shown as a share of everyone who answered. Multi-choice fields can add up to more than 100%.',
        )}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {/* Countries is a raw-count bar list rather than a percentage split (the full population per
            country isn't in the payload), so it keeps `CountrySpread` instead of a `DistributionCard` —
            wrapped in the same surface so it reads as one more block in the grid. */}
        {hasCountries && (
          <Reveal>
            <div className={clsx(surface, 'flex h-full flex-col p-5 sm:p-6')}>
              <CountrySpread countries={countries} countryCount={countryCount} />
            </div>
          </Reveal>
        )}
        {cards.map((c, i) => (
          <Reveal key={c.field} delay={((i + (hasCountries ? 1 : 0)) % 3) * 70}>
            <DistributionCard
              field={c.field}
              title={t(`stats.demographics.field.${c.field}`, c.title)}
              icon={c.icon}
              dist={demographics[c.field]}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Stats() {
  const t = useT()
  const [data, setData] = useState<Record<string, number | null>>({})
  const [statsData, setStatsData] = useState<Stats | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const tables = [
        'profiles',
        'active_members',
        'bookmarked_searches',
        'private_user_message_channels',
        'profile_comments',
        'compatibility_prompts',
        'compatibility_answers',
        'votes',
        'vote_results',
      ] as const

      const [settled, statsResult] = await Promise.allSettled([
        Promise.allSettled(tables.map((t) => getCount(t))),
        api('stats', {}),
      ])

      const result: Record<string, number | null> = {}
      if (settled.status === 'fulfilled') {
        settled.value.forEach((res, i) => {
          result[tables[i]] = res.status === 'fulfilled' ? res.value : null
        })
      }

      if (statsResult.status === 'fulfilled') setStatsData(statsResult.value)

      setData(result)
      setLoading(false)
    }

    void load()
  }, [])

  return (
    <PageBase trackPageView={'stats'}>
      <SEO
        title={t('stats.seo.title', 'Platform Statistics & Growth')}
        description={t(
          'stats.seo.description',
          'Explore Compass platform growth metrics, member statistics, active discussions, and community engagement data.',
        )}
        url="/stats"
      />

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8">
        {/* ── Page header ── */}
        <div className="mb-10">
          <p className={clsx(eyebrow, 'mb-4 text-primary-700')}>
            {t('stats.eyebrow', 'Transparency')}
          </p>
          <h1 className="mb-4 text-[clamp(30px,5vw,48px)] font-black leading-[1.08] tracking-tight text-ink-900">
            {t('stats.title', 'Growth & Stats')}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-600">
            {t(
              'stats.subtitle',
              "Real numbers. No spin. Compass is built in the open — here's exactly who we are and how we're growing.",
            )}
          </p>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className={clsx(surface, 'animate-pulse p-6')}>
                <div className="mb-4 h-9 w-9 rounded-lg bg-canvas-200" />
                <div className="mb-2 h-8 w-20 rounded bg-canvas-200" />
                <div className="h-3 w-24 rounded bg-canvas-200" />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── Hero highlight band ── */}
            <HighlightRow
              members={data.profiles}
              active={data.active_members}
              messages={statsData?.messages}
              countries={statsData?.countryCount}
            />

            {/* ── Who's on Compass (gender, countries + demographic breakdowns) ── */}
            {statsData && <Demographics stats={statsData} />}

            {/* ── Growth chart ── */}
            <Section>
              <SectionLabel>{t('stats.group.growth', 'Growth over time')}</SectionLabel>
              <ChartCard />
            </Section>

            {/* ── Conversations ── */}
            <Section>
              <StatGroup title={t('stats.group.conversations', 'Conversations')}>
                <StatCard
                  value={data.private_user_message_channels}
                  label={t('stats.discussions', 'Discussions')}
                  icon={ChatBubbleOvalLeftIcon}
                  accent="amber"
                />
                <StatCard
                  value={statsData?.messages}
                  label={t('stats.messages', 'Messages')}
                  icon={EnvelopeIcon}
                  accent="sage"
                />
              </StatGroup>
            </Section>

            {/* ── Compatibility ── */}
            <Section>
              <StatGroup title={t('stats.group.compatibility', 'Compatibility')}>
                <StatCard
                  value={data.compatibility_prompts}
                  label={t('stats.compatibility_prompts', 'Prompts Created')}
                  icon={QuestionMarkCircleIcon}
                  accent="amber"
                />
                <StatCard
                  value={data.compatibility_answers}
                  label={t('stats.prompts_answered', 'Prompts Answered')}
                  icon={CheckCircleIcon}
                  accent="sage"
                />
              </StatGroup>
            </Section>

            {/* ── Democracy ── */}
            <Section>
              <StatGroup title={t('stats.group.democracy', 'Democracy')}>
                <StatCard
                  value={data.votes}
                  label={t('stats.proposals', 'Proposals')}
                  icon={ClipboardDocumentListIcon}
                  accent="amber"
                />
                <StatCard
                  value={data.vote_results}
                  label={t('stats.votes', 'Votes Cast')}
                  icon={HandRaisedIcon}
                  accent="sage"
                />
              </StatGroup>
            </Section>
          </>
        )}
      </div>
    </PageBase>
  )
}
