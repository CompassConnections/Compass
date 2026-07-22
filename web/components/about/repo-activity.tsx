import {CodeBracketIcon, StarIcon, UserGroupIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {githubRepo} from 'common/constants'
import {ComponentType, ReactNode, SVGProps} from 'react'
import {SectionLabel} from 'web/components/about/section'
import {Reveal} from 'web/components/widgets/reveal'
import {Section, surface} from 'web/components/widgets/surface'
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

function Metric({icon: Icon, value, label}: {icon: IconType; value: ReactNode; label: string}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-primary-100 ring-1 ring-primary-200 flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px] text-primary-600" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="font-heading text-xl font-bold text-ink-900 leading-tight tabular-nums">
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

export function RepoActivity() {
  const t = useT()
  const {data} = useAPIGetter('repo-stats', {})

  if (!data) return null

  // The Date survives the wire as a Date via the schema's Zod serialization, but a cached response
  // rehydrated from a string would not — normalise rather than trust it.
  const lastCommit = data.lastCommitTime ? new Date(data.lastCommitTime) : null
  const hasAny =
    data.contributors !== null ||
    data.stars !== null ||
    (lastCommit && !isNaN(lastCommit.getTime()))
  if (!hasAny) return null

  return (
    <Section>
      {/* Section and label live in here rather than in the page, so that a failed GitHub call takes
          the whole section with it instead of leaving a heading over nothing. */}
      <SectionLabel>{t('about.repo.label', 'Built in the open')}</SectionLabel>
      <Reveal className={clsx(surface, 'p-6 sm:p-8')}>
        <p className="font-heading text-ink-900 text-xl sm:text-2xl leading-snug tracking-tight mb-3 max-w-2xl text-balance">
          {t(
            'about.repo.claim',
            'Community owned. No investors, no acquisition, nothing to sell you.',
          )}
        </p>
        <p className="text-sm text-ink-600 leading-relaxed mb-7 max-w-2xl">
          {t(
            'about.repo.intro',
            'The whole thing is built in public — every line of code, every change, open to read and to challenge:',
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {data.contributors !== null && (
            <Metric
              icon={UserGroupIcon}
              value={data.contributors}
              label={t('about.repo.contributors', 'Contributors')}
            />
          )}
          {data.stars !== null && (
            <Metric
              icon={StarIcon}
              value={data.stars}
              label={t('about.repo.stars', 'GitHub stars')}
            />
          )}
          {lastCommit && !isNaN(lastCommit.getTime()) && (
            <Metric
              icon={CodeBracketIcon}
              value={daysAgoLabel(lastCommit, t)}
              label={t('about.repo.last_commit', 'Last change')}
            />
          )}
        </div>

        <p className="text-sm leading-relaxed mt-7">
          <a
            href={githubRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-700 hover:underline"
          >
            {t('about.repo.link', 'Read the source →')}
          </a>
        </p>
      </Reveal>
    </Section>
  )
}
