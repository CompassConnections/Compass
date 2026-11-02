import clsx from 'clsx'
import {
  FactorKey,
  FactorResult,
  getOverallCompatibility,
  getSharedOptions,
  ProfileForScoring,
} from 'common/profiles/compatibility-factors'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {Profile} from 'common/profiles/profile'
import {clamp} from 'lodash'
import Link from 'next/link'
import {useMemo} from 'react'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {useCompatibilityFactorLabels} from 'web/components/profile/compatibility-factor-labels'
import {CompatibilityScoreBar, isLowScore} from 'web/components/widgets/compatible-badge'
import {linkClass} from 'web/components/widgets/site-link'
import {shortenName} from 'web/components/widgets/user-link'
import {useProfile} from 'web/hooks/use-profile'
import {useT} from 'web/lib/locale'

/**
 * Every factor behind the number, with its weight and likely range.
 *
 * Computed here, in the browser, from the two profiles already on the page plus the stored prompt
 * score — the same `getOverallCompatibility` the backend ran, so the rows reproduce the stored
 * overall whenever nothing has changed since the last recompute. Nothing is fetched to open it.
 */
export function CompatibilityBreakdownModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  profile: Profile
  compatibility: CompatibilityScore
  /**
   * The other side of the pair when it is not the signed-in member — the admin ranking page compares
   * two arbitrary members. Defaults to your own profile.
   */
  viewer?: Profile
}) {
  const {open, setOpen, profile, compatibility, viewer} = props
  const t = useT()
  const own = useProfile()
  const you = viewer ?? own
  const labels = useCompatibilityFactorLabels()

  const result = useMemo(() => {
    if (!you) return undefined
    const prompt = compatibility.prompt
      ? {...compatibility.prompt, sharedAnswers: compatibility.sharedAnswers}
      : undefined
    return getOverallCompatibility(you as ProfileForScoring, profile, prompt)
  }, [you, profile, compatibility])

  const shared = useMemo(
    () => (you ? getSharedOptions(you as ProfileForScoring, profile) : []),
    [you, profile],
  )

  const name = shortenName(profile.user.name)

  return (
    <Modal open={open} setOpen={setOpen} size="lg">
      {/* The scroll container is an inner column, never the Modal wrapper: the close button hangs
          above the wrapper's top edge, and an overflow on the wrapper clips it away. */}
      <Col className={clsx(MODAL_CLASS, PANEL_CLASS, '!items-stretch')}>
        <Col className={clsx('min-h-0 w-full flex-1 gap-6 pb-4 pr-1', SCROLLABLE_MODAL_CLASS)}>
          <h2 className="font-heading text-primary-900 m-0 text-xl">
            {viewer
              ? t('compatibility.breakdown.title_pair', '{a} and {b}', {
                  a: shortenName(viewer.user.name),
                  b: name,
                })
              : t('compatibility.breakdown.title', 'Your compatibility with {name}', {name})}
          </h2>

          {result?.kind === 'scored' && (
            <>
              <CompatibilityScoreBar
                compatibility={{
                  score: result.score,
                  low: result.low,
                  high: result.high,
                  sharedAnswers: result.sharedAnswers,
                  confidence: result.confidence,
                }}
              />

              <FactorList
                title={t('compatibility.breakdown.counted', 'What it is made of')}
                factors={ordered(result.factors).filter(([, f]) => !f.blank)}
                labels={labels.factor}
                sharedAnswers={result.sharedAnswers}
                sharedItems={shared.map((s) => s.name)}
              />

              <FactorList
                title={t('compatibility.breakdown.blank', 'Unknown — missing on one side')}
                intro={t(
                  'compatibility.breakdown.blank_intro',
                  'Counted at half weight with a wide range. Filling these in, on either profile, settles them.',
                )}
                factors={ordered(result.factors).filter(([, f]) => f.blank)}
                labels={labels.factor}
                sharedAnswers={result.sharedAnswers}
                muted
              />
            </>
          )}

          {result?.kind === 'dealbreaker' && (
            <Col className="gap-2">
              <span className="text-ink-900 font-semibold">
                {t('compatibility.not_a_match', 'Not a match')}
              </span>
              <ul className="text-ink-700 m-0 list-disc pl-5 text-sm">
                {result.dealbreakers.map((key) => (
                  <li key={key}>{labels.dealbreaker[key]}</li>
                ))}
              </ul>
            </Col>
          )}

          <p className="text-ink-600 m-0 text-sm">
            {t(
              'compatibility.breakdown.formula',
              'The score is a weighted geometric mean of the rows above, so one bad row on something that matters pulls your compatibility down rather than averaging out.',
            )}{' '}
          </p>
          {/* The caveat the number needs, where the number is: a percentage with two decimals of
            breakdown reads as a measurement, and it is not one. */}
          <p className="text-ink-600 border-canvas-300 m-0 border-t pt-4 text-sm">
            {t(
              'compatibility.breakdown.disclaimer',
              'This is only a rough estimate. A score below 50% usually means the two of you clash on a dealbreaker. A high score does not mean you will get along for sure though: it makes this person one promising candidate among many. So stay open-minded and connect with different people to find out what works for you.',
            )}{' '}
            <Link href="/compatibility-score" className={clsx(linkClass, 'text-primary-700')}>
              {t(
                'compatibility.breakdown.how',
                'How the score is computed and the evidence behind →',
              )}
            </Link>
          </p>
        </Col>
      </Col>
    </Modal>
  )
}

/**
 * Same height as the answer modal, the tallest in the app: the row list is long. On phones the
 * panel sits at the bottom and the 5rem it leaves above is where the Modal's close button lands,
 * below the status bar (--hloss already subtracts the native safe areas). On larger screens the
 * panel grows with its content up to 8rem short of the viewport, which keeps the button on screen
 * with the wrapper's vertical margins.
 */
const PANEL_CLASS =
  '!h-[calc(100dvh-var(--hloss)-5rem)] sm:!h-auto sm:max-h-[calc(100dvh-var(--hloss)-8rem)]'

const ordered = (factors: Record<FactorKey, FactorResult>) =>
  Object.entries(factors) as [FactorKey, FactorResult][]

function FactorList(props: {
  title: string
  intro?: string
  factors: [FactorKey, FactorResult][]
  labels: Record<FactorKey, string>
  sharedAnswers: number
  sharedItems?: string[]
  muted?: boolean
}) {
  const {title, intro, factors, labels, sharedAnswers, sharedItems, muted} = props
  const t = useT()
  if (!factors.length) return null
  return (
    <Col className="gap-3">
      <div>
        <h3
          className="text-primary-700 font-dm-sans m-0 font-normal uppercase"
          style={{fontSize: '10px', letterSpacing: '0.18em'}}
        >
          {title}
        </h3>
        {intro && <p className="text-ink-500 m-0 mt-1 text-xs">{intro}</p>}
      </div>
      <Col className={clsx('gap-3', muted && 'opacity-70')}>
        {factors.map(([key, f]) => (
          <FactorRow
            key={key}
            label={
              key === 'prompts' && sharedAnswers > 0
                ? `${labels[key]} · ${t('compatibility.breakdown.shared_answers', '{count} shared', {count: String(sharedAnswers)})}`
                : labels[key]
            }
            factor={f}
            detail={key === 'shared_options' && sharedItems?.length ? sharedItems : undefined}
          />
        ))}
      </Col>
    </Col>
  )
}

/** One factor: label and weight, the point and its range, and a hairline track with the band. */
function FactorRow(props: {label: string; factor: FactorResult; detail?: string[]}) {
  const {label, factor, detail} = props
  const score = Math.round(clamp(factor.score, 0, 1) * 100)
  const low = Math.round(clamp(factor.low, 0, 1) * 100)
  const high = Math.round(clamp(factor.high, 0, 1) * 100)
  const lowScore = isLowScore(factor.score)
  return (
    <div className="flex flex-col gap-1.5" data-testid="compatibility-factor-row">
      <Row className="items-baseline justify-between gap-3">
        <span className="text-primary-900 text-sm">
          {label}{' '}
          <span className="text-ink-400 text-xs tabular-nums">×{formatWeight(factor.weight)}</span>
        </span>
        <span
          className={clsx(
            'shrink-0 text-sm tabular-nums',
            lowScore ? 'text-red-600 font-medium' : 'text-ink-600',
          )}
        >
          {score}%{' '}
          <span className="text-ink-400 text-xs">
            {low}–{high}%
          </span>
        </span>
      </Row>
      {/* Same grammar as the score bar: a band for the range, a dot for the point. */}
      <div className="relative h-3 w-full" aria-hidden>
        <div className="bg-canvas-200 absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
        <div
          className={clsx(
            'absolute top-1/2 h-1 -translate-y-1/2 rounded-full',
            lowScore ? 'bg-red-500/30' : 'bg-primary-500/30',
          )}
          style={{left: `${low}%`, width: `${high - low}%`}}
        />
        <div
          className={clsx(
            'ring-canvas-50 absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2',
            lowScore ? 'bg-red-600' : 'bg-primary-600',
          )}
          style={{left: `${score}%`}}
        />
      </div>
      {detail && <span className="text-ink-500 text-xs">{detail.join(' · ')}</span>}
    </div>
  )
}

const formatWeight = (w: number) => (Number.isInteger(w) ? String(w) : w.toFixed(1))
