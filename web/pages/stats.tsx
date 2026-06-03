import {
  ArrowTrendingUpIcon,
  BoltIcon,
  BuildingLibraryIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleOvalLeftIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  HandRaisedIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {type Stats} from 'common/stats'
import {ComponentType, ReactNode, SVGProps, useEffect, useState} from 'react'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import ChartMembers from 'web/components/widgets/charts'
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
  large?: boolean
}

interface StatGroupProps {
  icon: IconType
  title: string
  children: ReactNode
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({value, label, icon: Icon, accent = 'amber', large}: StatCardProps) {
  if (value === null || value === undefined || value === 0) return null

  const formatted = typeof value === 'number' ? formatNumber(value) : value

  const accentClasses = {
    amber: 'text-primary-500',
    sage: 'text-green-500',
    muted: 'text-ink-500',
  }

  return (
    <div
      className="
        group relative overflow-hidden
        bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-6
        transition-all duration-[120ms] ease-in
        hover:shadow-[0_10px_30px_rgba(44,36,22,0.09)]
        hover:border-primary-500
      "
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary-100 border border-primary-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-[18px] h-[18px] text-primary-600" strokeWidth={1.8} />
        </div>
      </div>

      <div
        className={clsx(
          'font-black tracking-tight leading-none mb-2',
          large ? 'text-4xl' : 'text-3xl',
          accentClasses[accent],
        )}
      >
        {formatted}
      </div>

      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide leading-tight">
        {label}
      </p>
    </div>
  )
}

// ─── Stat Group ───────────────────────────────────────────────────────────────

function StatGroup({icon: Icon, title, children}: StatGroupProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-4 h-4 text-primary-500" strokeWidth={1.8} />
        <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-ink-500">
          {title}
        </span>
        <div className="flex-1 h-px bg-canvas-200" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  )
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────

function ChartCard() {
  const t = useT()
  return (
    <div
      className="
      bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-6 mb-10
      shadow-[0_2px_8px_rgba(44,36,22,0.05)]
    "
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-primary-100 border border-primary-200 flex items-center justify-center">
          <ArrowTrendingUpIcon className="w-4 h-4 text-primary-600" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink-900 leading-tight">
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

// ─── Highlight Row ────────────────────────────────────────────────────────────

function HighlightRow({
  members,
  active,
  messages,
}: {
  members: number | null
  active: number | null
  messages: number | null | undefined
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
  ].filter((i) => !!i.value)

  if (!items.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="
            relative overflow-hidden
            bg-canvas-950 rounded-2xl p-6
            border-[1.5px] border-canvas-900
          "
          >
            <div className="w-9 h-9 rounded-lg bg-canvas-900 flex items-center justify-center mb-4">
              <Icon className="w-[18px] h-[18px] text-primary-400" strokeWidth={1.8} />
            </div>
            <div
              className={clsx(
                'text-4xl font-black tracking-tight leading-none mb-2',
                item.accent === 'sage' ? 'text-green-500' : 'text-primary-400',
              )}
            >
              {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
            </div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">
              {item.label}
            </p>
          </div>
        )
      })}
    </div>
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

  const genderRatioLabel = statsData?.genderRatio
    ? `${statsData.genderRatio.male ?? 0} / ${statsData.genderRatio.female ?? 0}`
    : null

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

      <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
        {/* ── Page header ── */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-primary-500 mb-3">
            {t('stats.eyebrow', 'Transparency')}
          </p>
          <h1 className="text-[clamp(28px,4vw,40px)] font-black text-ink-900 tracking-tight leading-tight mb-3">
            {t('stats.title', 'Growth & Stats')}
          </h1>
          <p className="text-lg text-ink-500 max-w-3xl leading-relaxed">
            {t(
              'stats.subtitle',
              "Real numbers. No spin. Compass is built in the open — here's exactly how we're growing.",
            )}
          </p>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
            {Array.from({length: 6}).map((_, i) => (
              <div
                key={i}
                className="bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-6 animate-pulse"
              >
                <div className="w-9 h-9 rounded-lg bg-canvas-200 mb-4" />
                <div className="h-8 w-20 bg-canvas-200 rounded mb-2" />
                <div className="h-3 w-24 bg-canvas-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── Hero highlight row ── */}
            <HighlightRow
              members={data.profiles}
              active={data.active_members}
              messages={statsData?.messages}
            />

            {/* ── Growth chart ── */}
            <ChartCard />

            {/* ── Community ── */}
            <StatGroup icon={UsersIcon} title={t('stats.group.community', 'Community')}>
              <StatCard
                value={data.profiles}
                label={t('stats.members', 'Members')}
                icon={UserIcon}
                accent="amber"
              />
              <StatCard
                value={data.active_members}
                label={t('stats.active_members', 'Active (last month)')}
                icon={BoltIcon}
                accent="sage"
              />
              <StatCard
                value={genderRatioLabel}
                label={t('stats.gender_ratio', 'Male / Female')}
                icon={ScaleIcon}
                accent="muted"
              />
              <StatCard
                value={data.profile_comments}
                label={t('stats.endorsements', 'Endorsements')}
                icon={StarIcon}
                accent="amber"
              />
            </StatGroup>

            {/* ── Conversations ── */}
            <StatGroup
              icon={ChatBubbleLeftRightIcon}
              title={t('stats.group.conversations', 'Conversations')}
            >
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

            {/* ── Compatibility ── */}
            <StatGroup
              icon={PuzzlePieceIcon}
              title={t('stats.group.compatibility', 'Compatibility')}
            >
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

            {/* ── Democracy ── */}
            <StatGroup icon={BuildingLibraryIcon} title={t('stats.group.democracy', 'Democracy')}>
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
              {/*<StatCard*/}
              {/*  value={data.bookmarked_searches}*/}
              {/*  label={t('stats.searches_bookmarked', 'Saved Searches')}*/}
              {/*  icon="🔖"*/}
              {/*  accent="muted"*/}
              {/*/>*/}
            </StatGroup>
          </>
        )}
      </div>
    </PageBase>
  )
}
