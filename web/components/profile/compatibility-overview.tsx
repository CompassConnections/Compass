import clsx from 'clsx'
import {getDealbreakers} from 'common/profiles/compatibility-factors'
import {Profile} from 'common/profiles/profile'
import Link from 'next/link'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import {CompatibilityBreakdownModal} from 'web/components/profile/compatibility-breakdown-modal'
import {useCompatibilityFactorLabels} from 'web/components/profile/compatibility-factor-labels'
import {Section} from 'web/components/profile/section'
import {CompatibilityScoreBar} from 'web/components/widgets/compatible-badge'
import {linkClass} from 'web/components/widgets/site-link'
import {useProfile} from 'web/hooks/use-profile'
import {useCompatibleProfiles} from 'web/hooks/use-profiles'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

/**
 * The overall score, first thing in the prose column of someone else's profile, with the breakdown
 * a tap away. When there is no stored score the reason is worked out here from the two profiles: a
 * dealbreaker is named, anything else reads as "no score yet".
 */
export function CompatibilityOverview(props: {profile: Profile}) {
  const {profile} = props
  const t = useT()
  const currentUser = useUser()
  const you = useProfile()
  const labels = useCompatibilityFactorLabels()
  const compatibleProfiles = useCompatibleProfiles(currentUser?.id)
  const compatibility = compatibleProfiles?.profileCompatibilityScores?.[profile.user_id]
  const [open, setOpen] = useState(false)

  if (!currentUser || currentUser.id === profile.user_id) return null
  // Still loading the scores: no heading for an empty block.
  if (!compatibleProfiles) return null

  const dealbreakers = !compatibility && you ? getDealbreakers(you, profile) : []

  return (
    <Section title={t('compatibility.label', 'Compatibility')} testId="compatibility-overview">
      <Col className="gap-3">
        {compatibility ? (
          <>
            <CompatibilityScoreBar
              compatibility={compatibility}
              hideLabel
              onClick={() => setOpen(true)}
            />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={clsx(linkClass, 'text-primary-700 w-fit text-sm')}
            >
              {t('compatibility.see_breakdown', 'See the breakdown')}
            </button>
            <CompatibilityBreakdownModal
              open={open}
              setOpen={setOpen}
              profile={profile}
              compatibility={compatibility}
            />
          </>
        ) : dealbreakers.length ? (
          <Col className="gap-1.5">
            <span className="text-ink-900 text-sm font-semibold">
              {t('compatibility.not_a_match', 'Not a match')}
            </span>
            <ul className="text-ink-700 m-0 list-disc pl-5 text-sm">
              {dealbreakers.map((key) => (
                <li key={key}>{labels.dealbreaker[key]}</li>
              ))}
            </ul>
          </Col>
        ) : (
          <span className="text-ink-600 text-sm">
            {t('compatibility.no_score_yet', 'No score yet.')}
          </span>
        )}
        <Link href="/compatibility-score" className={clsx(linkClass, 'text-ink-500 w-fit text-xs')}>
          {t('compatibility.how_it_works', 'How the score works')}
        </Link>
      </Col>
    </Section>
  )
}
