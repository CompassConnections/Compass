import {CodeBracketIcon, StarIcon, UserGroupIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {githubRepo} from 'common/constants'
import {ComponentType, ReactNode, SVGProps} from 'react'
import {Reveal} from 'web/components/widgets/reveal'
import {surface} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'

/**
 * Open-source activity as evidence for "Community Owned / no VC" (A6 in docs/marketing-visuals.md).
 *
 * A2 — a genuine photo of the people behind the project — is the better version of this claim and is
 * still open, because it needs consent only Martin can collect. This is the half that needs nobody's
 * consent: the repo is public, so its contributor count, stars and commit recency are already facts a
 * reader can check, and they say the thing the card asserts.
 *
 * **Our components, not a screenshot of GitHub.** H2 rejected embedding a third-party contributor
 * graph for two reasons that still hold: it is stale the moment it is captured, and it is not Compass
 * pixels on a page whose other visuals are. Rendering live numbers in our own type also survives a
 * restyle and translates properly.
 *
 * **Proxied through our API** (`repo-stats`), not fetched from the browser. Unauthenticated GitHub
 * allows 60 requests/hour per IP; a public page calling it directly would spend that budget on its
 * own visitors and start rendering nothing. The endpoint caches for six hours.
 *
 * Renders nothing when the upstream call fails, and each number is independently omitted when only
 * that one is missing — a fabricated or zeroed count would undercut the exact claim being made.
 */

type IconType = ComponentType<SVGProps<SVGSVGElement>>

function Metric({
  icon: Icon,
  value,
  label,
  live,
}: {
  icon: IconType
  value: ReactNode
  label: string
  live?: boolean
}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-primary-100 ring-1 ring-primary-200 flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px] text-primary-600" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-heading text-xl font-bold text-ink-900 leading-tight tabular-nums">
          {/* The recency stat is the one signal that survives when the counts are still under their
              display floors, so it carries the "the project is alive" claim on its own. The pulse makes
              that read at a glance instead of asking the reader to parse a date. motion-safe so
              reduced-motion visitors just get the static dot. */}
          {live && (
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500/70 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
            </span>
          )}
          {value}
        </div>
        <div className="text-xs text-ink-600 truncate">{label}</div>
      </div>
    </div>
  )
}

/** "3 days ago" / "today" — enough to show the project is alive without implying more precision. */
function daysAgoLabel(date: Date, t: ReturnType<typeof useT>) {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return t('about.repo.today', 'today')
  if (days === 1) return t('about.repo.yesterday', 'yesterday')
  return t('about.repo.days_ago', '{count} days ago', {count: days})
}

export function RepoActivity({className}: {className?: string}) {
  const t = useT()
  const {data} = useAPIGetter('repo-stats', {})

  if (!data) return null

  // The Date survives the wire as a Date via the schema's Zod serialization, but a cached response
  // rehydrated from a string would not — normalise rather than trust it.
  const lastCommit = data.lastCommitTime ? new Date(data.lastCommitTime) : null
  const hasValidCommit = !!lastCommit && !isNaN(lastCommit.getTime())

  // A contributor or star count only supports the "community owned" claim once it is large enough to
  // read as momentum; below these floors the honest move is to omit the number rather than sit a small
  // one next to a sentence about being community-owned. Recency has no floor — "changed this week" is
  // proof of life whatever the other two say — so in practice this block is usually just that one stat,
  // and the layout below treats one metric as its normal case, not a degenerate one.
  const CONTRIBUTORS_FLOOR = 10
  const STARS_FLOOR = 100
  const metrics: {icon: IconType; value: ReactNode; label: string; live?: boolean}[] = []
  if (data.contributors !== null && data.contributors >= CONTRIBUTORS_FLOOR)
    metrics.push({
      icon: UserGroupIcon,
      value: data.contributors,
      label: t('about.repo.contributors', 'Contributors'),
    })
  if (data.stars !== null && data.stars >= STARS_FLOOR)
    metrics.push({
      icon: StarIcon,
      value: data.stars,
      label: t('about.repo.stars', 'GitHub stars'),
    })
  if (hasValidCommit)
    metrics.push({
      icon: CodeBracketIcon,
      value: daysAgoLabel(lastCommit as Date, t),
      label: t('about.repo.last_commit', 'Last change'),
      live: true,
    })

  // Every count fell below its display floor and there is no commit date — nothing here earns a heading.
  if (metrics.length === 0) return null

  // {
  //   /* Section and label live in here rather than in the page, so that a failed GitHub call takes
  //         the whole section with it instead of leaving a heading over nothing. */
  // }
  return (
    // <Section>
    // <SectionLabel>{t('about.repo.label', 'Built in the open')}</SectionLabel>
    <Reveal className={clsx(surface, 'p-6 sm:p-8', className)}>
      <p className="font-heading text-ink-900 text-xl sm:text-2xl leading-snug tracking-tight mb-3 max-w-2xl text-balance">
        {t(
          'about.repo.claim',
          'Community owned. No investors, no acquisition, nothing to sell you.',
        )}
      </p>
      <p className="text-sm text-ink-600 leading-relaxed max-w-2xl">
        {t(
          'about.repo.intro',
          'The whole thing is built in public — every line of code, every change, open to read and to challenge:',
        )}
      </p>

      {/* A footer bar, not a grid: the metric count is usually one (the counts sit below their display
          floors), and one cell in a three-column grid reads as broken. Here the stats and the source
          link share a rule-topped row that stays balanced whether one metric shows or three — the stats
          settle to the left, the link to the right, and both wrap cleanly on a phone. */}
      <div className="mt-7 border-t border-canvas-200 pt-7 flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          {metrics.map((m) => (
            <Metric key={m.label} icon={m.icon} value={m.value} label={m.label} live={m.live} />
          ))}
        </div>
        <a
          href={githubRepo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-canvas-200 bg-canvas-100 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-canvas-200/60"
        >
          {t('about.repo.link', 'Read the source →')}
        </a>
      </div>
    </Reveal>
    // </Section>
  )
}
