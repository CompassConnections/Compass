import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BuildingLibraryIcon,
  CakeIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  FingerPrintIcon,
  FlagIcon,
  GlobeAltIcon,
  HeartIcon,
  LanguageIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
  SunIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {type DemographicField, type Distribution, type Stats} from 'common/stats'
import dynamic from 'next/dynamic'
import {ComponentType, SVGProps, useEffect, useState} from 'react'
import {SectionLabel} from 'web/components/about/section'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import ChartMembers from 'web/components/widgets/charts'
import {MIN_COUNTRIES} from 'web/components/widgets/country-spread'
import {Reveal} from 'web/components/widgets/reveal'
import {DistributionCard} from 'web/components/widgets/stat-distribution'
import {DonutSegment, StatDonut} from 'web/components/widgets/stat-donut'
import {eyebrow, Section, surface} from 'web/components/widgets/surface'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {getCount} from 'web/lib/supabase/users'

// The map pulls in the world-atlas geometry (~100KB) plus d3-geo; code-split it so it never weighs on the
// initial load, and never runs on the server — it's a client-only visual on an already client-fetched page.
const WorldHeatmap = dynamic(
  () => import('web/components/widgets/world-heatmap').then((m) => m.WorldHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className={clsx(surface, 'h-full min-h-[320px] animate-pulse p-6')}>
        <div className="h-4 w-40 rounded bg-canvas-200" />
        <div className="mt-6 h-[240px] rounded-xl bg-canvas-100" />
      </div>
    ),
  },
)

// ─── Types ────────────────────────────────────────────────────────────────────

type IconType = ComponentType<SVGProps<SVGSVGElement>>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

// ─── Hero band ──────────────────────────────────────────────────────────────────

/**
 * The headline numbers as one dark, rule-divided band rather than a row of identical tiles — the tiles
 * were the start of the "wall of same block" the rest of the page also fights. A single feature surface
 * with an amber glow reads as an opening statement; it appears exactly once, so it never becomes texture.
 */
function HeroBand({
  members,
  active,
  countries,
  discussions,
  messages,
}: {
  members: number | null
  active: number | null
  countries: number | null | undefined
  discussions: number | null
  messages: number | null | undefined
}) {
  const t = useT()
  const items = [
    {value: members, label: t('stats.highlight.members', 'Members')},
    {value: active, label: t('stats.highlight.active', 'Active this month')},
    {
      value: countries && countries > 1 ? countries : undefined,
      label: t('stats.highlight.countries', 'Countries'),
    },
    {value: discussions, label: t('stats.discussions', 'Discussions')},
    {value: messages, label: t('stats.messages', 'Messages')},
  ].filter((i) => !!i.value)

  if (!items.length) return null

  return (
    <div className="relative overflow-hidden rounded-3xl bg-canvas-950 px-6 py-8 sm:px-10 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl"
      />
      <div className="relative flex flex-wrap gap-x-10 gap-y-7 sm:gap-x-14">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={clsx(
              i === 0 && 'sm:border-r sm:border-white/10 sm:pr-14',
              i > 0 && 'min-w-[92px]',
            )}
          >
            <div
              className={clsx(
                'font-black leading-none tracking-tight tabular-nums text-primary-400',
                i === 0 ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl',
              )}
            >
              {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
            </div>
            <div className={clsx(eyebrow, 'mt-2.5 text-white/55')}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Growth chart ────────────────────────────────────────────────────────────

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

// ─── Activity panel ──────────────────────────────────────────────────────────

/**
 * A small labelled list of related counts (conversations, compatibility, democracy). Replaces three
 * near-identical two-card sections with three compact panels in one row — same information, a fraction of
 * the vertical run, and no more repeated card grid at the foot of the page.
 */
function ActivityPanel({
  icon: Icon,
  title,
  rows,
}: {
  icon: IconType
  title: string
  rows: {label: string; value: number | null | undefined}[]
}) {
  const shown = rows.filter((r) => !!r.value)
  if (!shown.length) return null
  return (
    <div className={clsx(surface, 'flex h-full flex-col p-5 sm:p-6')}>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 ring-1 ring-primary-200">
          <Icon className="h-[18px] w-[18px] text-primary-600" strokeWidth={1.8} />
        </div>
        <h3 className="text-sm font-bold text-ink-900">{title}</h3>
      </div>
      <dl className="space-y-3">
        {shown.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 border-t border-canvas-200/70 pt-3 first:border-0 first:pt-0"
          >
            <dt className="text-sm text-ink-600">{r.label}</dt>
            <dd className="text-lg font-black tabular-nums text-primary-600">
              {formatNumber(r.value as number)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * The three activity panels as a row, with empty ones dropped entirely rather than left as blank grid
 * cells — a young platform may have votes but no messages yet, and a hole in the row reads as a bug.
 */
function ActivitySection({
  data,
  messages,
}: {
  data: Record<string, number | null>
  messages: number | null | undefined
}) {
  const t = useT()
  const panels = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: t('stats.group.conversations', 'Conversations'),
      rows: [
        {label: t('stats.discussions', 'Discussions'), value: data.private_user_message_channels},
        {label: t('stats.messages', 'Messages'), value: messages},
      ],
    },
    {
      icon: PuzzlePieceIcon,
      title: t('stats.group.compatibility', 'Compatibility'),
      rows: [
        {
          label: t('stats.compatibility_prompts', 'Prompts created'),
          value: data.compatibility_prompts,
        },
        {label: t('stats.prompts_answered', 'Prompts answered'), value: data.compatibility_answers},
      ],
    },
    {
      icon: BuildingLibraryIcon,
      title: t('stats.group.democracy', 'Democracy'),
      rows: [
        {label: t('stats.proposals', 'Proposals'), value: data.votes},
        {label: t('stats.votes', 'Votes cast'), value: data.vote_results},
      ],
    },
  ].filter((p) => p.rows.some((r) => !!r.value))

  if (!panels.length) return null

  return (
    <Section>
      <SectionLabel>{t('stats.group.activity', 'Activity & participation')}</SectionLabel>
      <div
        className={clsx(
          'grid grid-cols-1 gap-3 sm:gap-4',
          panels.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        {panels.map((p, i) => (
          <Reveal key={p.title} delay={i * 70}>
            <ActivityPanel icon={p.icon} title={p.title} rows={p.rows} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

// ─── Demographics ───────────────────────────────────────────────────────────────

/**
 * The bar-list breakdowns, in a masonry rather than a fixed grid. Their natural heights differ (education
 * has five rows, languages seven, "looking for" three), so a rigid grid would pad them all to the tallest
 * in the row — the exact uniformity that made the section read as wallpaper. CSS columns let each card
 * keep its own height and pack organically. Gender, age and countries are pulled out above as a donut /
 * donut / map trio, so the wall is broken before the bar lists even begin.
 */
const BAR_CARDS: {field: DemographicField; title: string; icon: IconType}[] = [
  {field: 'education_level', title: 'Education', icon: AcademicCapIcon},
  {field: 'political_beliefs', title: 'Politics', icon: FlagIcon},
  {field: 'religion', title: 'Religion & spirituality', icon: SunIcon},
  {field: 'mbti', title: 'Personality (MBTI)', icon: FingerPrintIcon},
  {field: 'diet', title: 'Diet', icon: CakeIcon},
  {field: 'orientation', title: 'Orientation', icon: HeartIcon},
  {field: 'ethnicity', title: 'Ethnicity', icon: GlobeAltIcon},
  {field: 'pref_relation_styles', title: 'Looking for', icon: MagnifyingGlassIcon},
  {field: 'relationship_status', title: 'Relationship status', icon: LinkIcon},
  {field: 'languages', title: 'Languages spoken', icon: LanguageIcon},
]

// Gender is folded to man / woman / other for the donut: three slices read at a glance where the full
// gender vocabulary would not, and "other" is exact (base − men − women) regardless of how the tail was
// truncated. Colour follows the entity, on the brand's warm ramp; the legend carries identity.
function genderSegments(
  dist: Distribution | undefined,
  t: ReturnType<typeof useT>,
): DonutSegment[] {
  if (!dist) return []
  const male = dist.items.find((i) => i.value === 'male')?.count ?? 0
  const female = dist.items.find((i) => i.value === 'female')?.count ?? 0
  const other = Math.max(0, dist.base - male - female)
  return [
    {label: t('stats.gender.women', 'Women'), value: female, colorVar: '--color-primary-500'},
    {label: t('stats.gender.men', 'Men'), value: male, colorVar: '--color-primary-300'},
    {label: t('stats.gender.other', 'Other'), value: other, colorVar: '--color-ink-500'},
  ].sort((a, b) => b.value - a.value)
}

// Age keeps its buckets in age order (not by size) and rides a light→dark amber ramp — an ordinal ramp
// for an ordinal field, so "older" reads as "deeper" without a legend having to say so.
const AGE_RAMP = [
  '--color-primary-200',
  '--color-primary-300',
  '--color-primary-400',
  '--color-primary-600',
]

function ageSegments(dist: Distribution | undefined): DonutSegment[] {
  if (!dist) return []
  return dist.items.map((it, i) => ({
    label: it.value,
    value: it.count,
    colorVar: AGE_RAMP[Math.min(i, AGE_RAMP.length - 1)],
  }))
}

function Demographics({stats}: {stats: Stats}) {
  const t = useT()
  const {demographics, countries, countryCount} = stats
  const barCards = BAR_CARDS.filter((c) => demographics[c.field])
  const hasCountries = (countries?.length ?? 0) >= MIN_COUNTRIES
  const gender = genderSegments(demographics.gender, t)
  const age = ageSegments(demographics.age)

  if (!barCards.length && !hasCountries && !gender.length && !age.length) return null

  return (
    <Section>
      <SectionLabel>{t('stats.demographics.label', "Who's on Compass")}</SectionLabel>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink-600">
        {t(
          'stats.demographics.subtitle',
          'Self-reported by members, shown as a share of everyone who answered. Multi-choice fields can add up to more than 100%.',
        )}
      </p>

      {/* Feature block: a full-width map, then the two donuts side by side — three different marks
          before the bar lists, so the section never opens on a grid of identical cards. */}
      {hasCountries && (
        <Reveal>
          <WorldHeatmap countries={countries} countryCount={countryCount} />
        </Reveal>
      )}
      <div className={clsx('grid gap-3 sm:grid-cols-2 sm:gap-4', hasCountries && 'mt-3 sm:mt-4')}>
        {!!gender.length && (
          <Reveal delay={80}>
            <StatDonut
              title={t('stats.demographics.field.gender', 'Gender')}
              subtitle={t('stats.donut.shared', '{count} shared', {
                count: demographics.gender?.base ?? 0,
              })}
              icon={UserGroupIcon}
              segments={gender}
            />
          </Reveal>
        )}
        {!!age.length && (
          <Reveal delay={140}>
            <StatDonut
              title={t('stats.demographics.field.age', 'Age')}
              subtitle={t('stats.donut.shared', '{count} shared', {
                count: demographics.age?.base ?? 0,
              })}
              icon={CalendarDaysIcon}
              segments={age}
            />
          </Reveal>
        )}
      </div>

      {/* Masonry bar lists. CSS columns give each card its own height. */}
      <div className="mt-3 gap-3 [column-fill:_balance] sm:mt-4 sm:gap-4 sm:columns-2 lg:columns-3">
        {barCards.map((c, i) => (
          <div key={c.field} className="mb-3 break-inside-avoid sm:mb-4">
            <Reveal delay={(i % 3) * 60}>
              <DistributionCard
                field={c.field}
                title={t(`stats.demographics.field.${c.field}`, c.title)}
                icon={c.icon}
                dist={demographics[c.field]}
              />
            </Reveal>
          </div>
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
        'private_user_message_channels',
        'compatibility_prompts',
        'compatibility_answers',
        'votes',
        'vote_results',
      ] as const

      const [settled, statsResult] = await Promise.allSettled([
        Promise.allSettled(tables.map((tbl) => getCount(tbl))),
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
          <div className="rounded-3xl bg-canvas-950 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-wrap gap-x-14 gap-y-7">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-10 w-24 rounded bg-white/10" />
                  <div className="mt-3 h-3 w-16 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Hero band ── */}
            <HeroBand
              members={data.profiles}
              active={data.active_members}
              countries={statsData?.countryCount}
              discussions={data.private_user_message_channels}
              messages={statsData?.messages}
            />

            {/* ── Who's on Compass (map, donuts + demographic breakdowns) ── */}
            {statsData && <Demographics stats={statsData} />}

            {/* ── Growth over time ── */}
            <Section>
              <SectionLabel>{t('stats.group.growth', 'Growth over time')}</SectionLabel>
              <ChartCard />
            </Section>

            {/* ── Activity & participation ── */}
            <ActivitySection data={data} messages={statsData?.messages} />
          </>
        )}
      </div>
    </PageBase>
  )
}
