import {CheckIcon, XMarkIcon} from '@heroicons/react/24/outline'
import {UserIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {QuestionWithStats} from 'common/api/types'
import {Row as rowFor} from 'common/supabase/utils'
import {Fragment} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Linkify} from 'web/components/widgets/linkify'
import {useT} from 'web/lib/locale'

import {IMPORTANCE_CHOICES} from './answer-compatibility-question-content'

type Answer = rowFor<'compatibility_answers'>

// One person's side of the comparison: who they are, and what they answered.
export type ComparedSide = {
  name: string
  answer: Answer
  isYou?: boolean
}

const headerClass = 'items-start gap-1.5 row-start-1 min-w-0 self-end pb-2 border-b'
const labelClass = 'font-dm-sans text-[10px] uppercase tracking-[0.14em] sm:text-[11px] truncate'
const cellClass =
  'flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-[13px] sm:text-sm'
const markerClass = 'flex h-4 w-4 shrink-0 items-center justify-center border-2'

// Amber is you, sage is them — the same pairing as "Your answer" / "Accept from them" on the answer
// screen. Both ramps invert with the theme, so one set of classes works in light and dark.
const TONES = {
  mine: {
    text: 'text-primary-700',
    rule: 'border-primary-500/40',
    cell: 'border-primary-500 bg-primary-100 text-primary-900',
    marker: 'border-primary-500 bg-primary-500 text-white',
  },
  theirs: {
    text: 'text-green-500',
    rule: 'border-green-500/40',
    cell: 'border-green-500 bg-green-200 text-green-800',
    marker: 'border-green-500 bg-green-500 text-white',
  },
}
type Tone = (typeof TONES)[keyof typeof TONES]

/**
 * Two answers to the same prompt, side by side — the read-only twin of `AnswerMatrix`, which is
 * where both people filled them in. One column per person, one row per option, laid out in a
 * single grid so an option sits exactly opposite itself even when a label wraps.
 *
 * Each column is about one person's answer: the round marker is that answer, in their color, and
 * the square ticks are what the *other* person accepts, in the other's color. So a column reads as
 * a single check — does the dot land on a tick? — and a miss is outlined in dashed red. With only
 * one answer to show, the ticks are that person's own accepted answers.
 */
export function AnswerComparison(props: {
  question: QuestionWithStats
  sides: [ComparedSide] | [ComparedSide, ComparedSide]
}) {
  const {question, sides} = props
  const t = useT()
  const options = sortedOptions(question)
  if (!options) return null
  const compared = sides.length === 2
  const tones = sideTones(sides)

  return (
    <Col className="gap-2">
      <Legend compared={compared} />
      <div className="border-canvas-200 bg-canvas-100 rounded-2xl border p-2 sm:p-3">
        <div
          className={clsx(
            'grid items-stretch gap-x-2 gap-y-2 sm:gap-x-3',
            compared ? 'grid-cols-2' : 'grid-cols-1',
          )}
        >
          {sides.map((side, col) => {
            const tone = tones[col]
            const other = compared ? sides[1 - col] : undefined
            const accepted = other?.answer.pref_choices?.includes(side.answer.multiple_choice)
            return (
              <Col key={col} style={{gridColumn: col + 1}} className={clsx(headerClass, tone.rule)}>
                <Row className="min-w-0 items-center gap-1.5">
                  <UserIcon className={clsx('h-3.5 w-3.5 shrink-0', tone.text)} />
                  <span className={clsx(labelClass, tone.text)}>
                    {side.isYou ? t('answers.comparison.you', 'You') : side.name}
                  </span>
                </Row>
                <span className="text-ink-500 text-xs">
                  <ImportanceLabel importance={side.answer.importance} />
                </span>
                {other && (
                  <Row
                    className={clsx(
                      'items-center gap-1 text-xs',
                      accepted ? 'text-ink-600' : 'text-red-700',
                    )}
                  >
                    {accepted ? (
                      <CheckIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                    ) : (
                      <XMarkIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className="min-w-0">
                      {accepted
                        ? other.isYou
                          ? t('answers.comparison.you_accept', 'You accept this answer')
                          : t('answers.comparison.user_accepts', '{name} accepts this answer', {
                              name: other.name,
                            })
                        : other.isYou
                          ? t('answers.comparison.you_reject', "You don't accept this answer")
                          : t(
                              'answers.comparison.user_rejects',
                              "{name} doesn't accept this answer",
                              {name: other.name},
                            )}
                    </span>
                  </Row>
                )}
              </Col>
            )
          })}

          {options.map(([label, value], row) => (
            <Fragment key={label}>
              {sides.map((side, col) => {
                const tone = tones[col]
                // Whose accepted answers tick this column: the other person's, or — alone — their own.
                const judge = compared ? sides[1 - col] : side
                const judgeTone = compared ? tones[1 - col] : tone
                const isAnswer = side.answer.multiple_choice === value
                const isAccepted = !!judge.answer.pref_choices?.includes(value)
                return (
                  <div
                    key={col}
                    style={{gridRow: row + 2, gridColumn: col + 1}}
                    className={clsx(
                      cellClass,
                      isAnswer
                        ? clsx(tone.cell, 'font-medium')
                        : isAccepted
                          ? 'border-canvas-200 bg-canvas-50 text-ink-800'
                          : 'border-canvas-200/60 text-ink-400',
                      compared &&
                        isAnswer &&
                        !isAccepted &&
                        'border-dashed !border-red-500/70 ring-1 ring-red-500/40',
                    )}
                  >
                    <span
                      className={clsx(
                        markerClass,
                        'rounded-full',
                        isAnswer ? tone.marker : 'border-ink-300',
                      )}
                    >
                      {isAnswer && <span className="bg-canvas-50 h-1.5 w-1.5 rounded-full" />}
                    </span>
                    <span className="min-w-0 flex-1 break-words">{label}</span>
                    <span
                      className={clsx(
                        markerClass,
                        'rounded-[3px]',
                        isAccepted ? judgeTone.marker : 'border-ink-300',
                      )}
                    >
                      {isAccepted && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />}
                    </span>
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <ComparisonNotes sides={sides} tones={tones} />
    </Col>
  )
}

// You get amber wherever you are; if neither side is you, the compared profile (first) does.
// A lone side that isn't you is theirs.
function sideTones(sides: ComparedSide[]): Tone[] {
  const youIndex = sides.findIndex((side) => side.isYou)
  const mineIndex = youIndex !== -1 ? youIndex : sides.length === 2 ? 0 : -1
  return sides.map((_, i) => (i === mineIndex ? TONES.mine : TONES.theirs))
}

function Legend(props: {compared: boolean}) {
  const {compared} = props
  const t = useT()
  return (
    <Row className="text-ink-500 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <Row className="items-center gap-1.5">
        <span className={clsx(markerClass, 'border-ink-500 bg-ink-500 rounded-full')}>
          <span className="bg-canvas-50 h-1.5 w-1.5 rounded-full" />
        </span>
        {t('answers.comparison.legend_answer', 'Answer')}
      </Row>
      <Row className="items-center gap-1.5">
        <span
          className={clsx(markerClass, 'border-ink-500 bg-ink-500 text-canvas-50 rounded-[3px]')}
        >
          <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />
        </span>
        {compared
          ? t('answers.comparison.legend_accepted_by_other', 'Accepted by the other person')
          : t('answers.comparison.legend_accepts', 'Answers they accept')}
      </Row>
    </Row>
  )
}

/**
 * What each person wrote about the prompt, after the grid — the options say *what*, these say
 * *why*, and that is usually the part worth starting a conversation from. Same serif italic as the
 * explanation on the profile itself.
 */
function ComparisonNotes(props: {sides: ComparedSide[]; tones: Tone[]}) {
  const {sides, tones} = props
  const t = useT()
  // Theirs before yours: you know what you wrote, so the note worth reading comes first.
  const withNotes = sides
    .map((side, i) => ({side, tone: tones[i]}))
    .reverse()
    .filter(({side}) => side.answer.explanation?.trim())
  if (withNotes.length === 0) return null

  return (
    <Col className="mt-3 gap-3">
      <span className={clsx(labelClass, 'text-ink-500')}>
        {t('answers.comparison.notes', 'Thoughts')}
      </span>
      {withNotes.map(({side, tone}, i) => (
        <Col
          key={i}
          className="border-canvas-200 bg-canvas-100 gap-1 rounded-xl border px-3 py-2.5"
        >
          <Row className="items-center gap-1.5">
            <UserIcon className={clsx('h-3 w-3 shrink-0', tone.text)} />
            <span className={clsx(labelClass, tone.text)}>
              {side.isYou ? t('answers.comparison.you', 'You') : side.name}
            </span>
          </Row>
          <div
            className="font-heading text-ink-700 whitespace-pre-line italic"
            style={{fontSize: '15px', lineHeight: '1.55'}}
          >
            <Linkify text={`“${side.answer.explanation!.trim()}”`} />
          </div>
        </Col>
      ))}
    </Col>
  )
}

export function ImportanceLabel(props: {importance: number}) {
  const {importance} = props
  const t = useT()
  const key = Object.keys(IMPORTANCE_CHOICES).find(
    (choice) => IMPORTANCE_CHOICES[choice as keyof typeof IMPORTANCE_CHOICES] === importance,
  )
  return <>{t(`answers.importance.${importance}`, key ?? '')}</>
}

function sortedOptions(question: QuestionWithStats) {
  const {multiple_choice_options} = question
  if (!multiple_choice_options) return null
  return Object.entries(multiple_choice_options as Record<string, number>).sort(
    (a, b) => a[1] - b[1],
  )
}
