import clsx from 'clsx'
import {
  outcomeRate,
  OUTREACH_SEND_KIND_LABELS,
  OUTREACH_STAGE_LABELS,
  OutreachOutcomes,
  sumOutcomes,
} from 'common/outreach/outreach'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useAPIGetter} from 'web/hooks/use-api-getter'

/**
 * The columns, in the order the funnel runs: they wrote back, then they used it, then someone used it
 * on them, then they brought someone. `title` is the definition — every one of these is a measured
 * behaviour, and which behaviour matters more than the number next to it.
 */
const COLUMNS: {key: keyof Omit<OutreachOutcomes, 'members'>; label: string; title: string}[] = [
  {
    key: 'repliedToUs',
    label: 'Replied to us',
    title: 'Wrote back in the founder thread. Measures the outreach message, not the product.',
  },
  {
    key: 'messagedMember',
    label: 'Messaged a member',
    title:
      'Sent a message to someone who is not the founder — the product working rather than you.',
  },
  {
    key: 'heardFromMember',
    label: 'Heard from a member',
    title: 'Another member wrote to them: they are findable, whether or not they acted on it.',
  },
  {
    key: 'broughtSomeone',
    label: 'Brought someone',
    title: 'At least one member joined naming them as referrer — Contact #3’s ask, answered.',
  },
]

/**
 * How each stage of the sequence actually turns out.
 *
 * Read down a column, not across a row: the stages are worked best-first, so a deeper stage starts
 * from better members and its rates are not a claim that the stage caused them. What the panel is for
 * is the comparisons the queue itself cannot show — a stage against `not_started`, which is the
 * members nobody has written to, and the hand-written stages against the automated sends, which is the
 * number that decides how much founder time the sequence is worth.
 */
export function OutreachStats() {
  const {data} = useAPIGetter('get-outreach-stats', {})
  if (!data) return null

  const {stages, sends} = data

  // Excluded members are not outreach — they are the people it was decided not to apply to — so they
  // sit outside every rate while still being counted somewhere, and the totals stay reconcilable.
  const active = stages.filter((s) => s.stage !== 'excluded')
  const excluded = stages.find((s) => s.stage === 'excluded')
  const total = sumOutcomes(active)
  const written = sumOutcomes(active.filter((s) => s.stage !== 'not_started'))

  return (
    <Col className={'gap-2'}>
      <Row className={'items-baseline gap-3'}>
        <div className={'text-ink-800 text-lg'}>How it turns out</div>
        <div className={'text-ink-500 text-sm'}>
          {written.members} of {total.members} members written to
          {excluded?.members ? ` · ${excluded.members} excluded` : ''}
        </div>
      </Row>

      <div className={'overflow-x-auto'}>
        <table className={'w-full min-w-[44rem] text-sm'}>
          <thead className={'text-ink-400 text-left text-xs uppercase'}>
            <tr>
              <th className={'py-1 pr-3 font-normal'}>Stage</th>
              <th className={'py-1 pr-3 font-normal'}>Members</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className={'py-1 pr-3 font-normal'} title={c.title}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {active.map((row) => (
              <OutcomeRow
                key={row.stage}
                label={OUTREACH_STAGE_LABELS[row.stage]}
                // The baseline the rest of the table is read against: what members do with no help.
                note={row.stage === 'not_started' ? 'baseline — nobody wrote to them' : undefined}
                outcomes={row}
              />
            ))}
            <OutcomeRow label={'All members'} outcomes={total} bold />
            {excluded?.members ? (
              <OutcomeRow
                label={OUTREACH_STAGE_LABELS.excluded}
                note={'outside outreach'}
                outcomes={excluded}
                dim
              />
            ) : null}
          </tbody>

          {/* The automated sends, in the same columns on purpose — comparing them to the written
              stages is the whole reason the sends are logged at all. Members appear in both halves. */}
          {sends.length > 0 && (
            <tbody>
              <tr>
                <td
                  className={'text-ink-400 pt-4 pb-1 text-xs uppercase'}
                  colSpan={COLUMNS.length + 2}
                >
                  Automated sends
                </td>
              </tr>
              {sends.map((row) => (
                <OutcomeRow
                  key={row.kind}
                  label={OUTREACH_SEND_KIND_LABELS[row.kind]}
                  outcomes={row}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>

      <div className={'text-ink-400 text-xs'}>
        Every rate is lifetime behaviour, not behaviour since the stage was set — a stage carries no
        timestamp of when it began. Percentages are of that row’s members; hover a heading for what
        it counts.
      </div>
    </Col>
  )
}

function OutcomeRow(props: {
  label: string
  note?: string
  outcomes: OutreachOutcomes
  bold?: boolean
  dim?: boolean
}) {
  const {label, note, outcomes, bold, dim} = props

  return (
    <tr className={clsx('border-canvas-100 border-t', dim && 'text-ink-400')}>
      <td className={clsx('py-1.5 pr-3 whitespace-nowrap', bold && 'text-ink-900 font-medium')}>
        {label}
        {note && <span className={'text-ink-400 ml-2 text-xs normal-case'}>{note}</span>}
      </td>
      <td className={clsx('py-1.5 pr-3', bold && 'font-medium')}>{outcomes.members}</td>
      {COLUMNS.map((c) => (
        <RateCell key={c.key} n={outcomes[c.key]} total={outcomes.members} />
      ))}
    </tr>
  )
}

/** The rate first and the count second: with a few dozen members the count is what keeps it honest. */
function RateCell(props: {n: number; total: number}) {
  const {n, total} = props

  return (
    <td className={'py-1.5 pr-3 whitespace-nowrap'} title={`${n} of ${total}`}>
      <span className={clsx(n === 0 ? 'text-ink-300' : 'text-ink-900')}>
        {outcomeRate(n, total)}%
      </span>
      <span className={'text-ink-400 ml-1 text-xs'}>{n}</span>
    </td>
  )
}
