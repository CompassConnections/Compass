import {ArrowRightIcon, CheckIcon, InformationCircleIcon} from '@heroicons/react/24/outline'
import {UserGroupIcon, UserIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {QuestionWithStats} from 'common/api/types'
import {Row as rowFor} from 'common/supabase/utils'
import {User} from 'common/user'
import {shortenNumber} from 'common/util/format'
import {sortBy} from 'lodash'
import {Fragment, useId, useState} from 'react'
import toast from 'react-hot-toast'
import {PinQuestionButton} from 'web/components/answers/pin-question-button'
import {Button} from 'web/components/buttons/button'
import {CompatibilityCategoryTag} from 'web/components/compatibility/category'
import {CommunityImportance} from 'web/components/compatibility/community-importance'
import {CompatibilitySort, CompatibilitySortWidget} from 'web/components/compatibility/sort-widget'
import {Col} from 'web/components/layout/col'
import {SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {ExpandingInput} from 'web/components/widgets/expanding-input'
import {Tooltip} from 'web/components/widgets/tooltip'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

import {filterKeys} from '../questions-form'

export type CompatibilityAnswerSubmitType = Omit<
  rowFor<'compatibility_answers'>,
  'created_time' | 'id'
>

export const IMPORTANCE_CHOICES = {
  'Not Important': 0,
  'Somewhat Important': 1,
  Important: 2,
  'Very Important': 3,
} as const

type ImportanceColorsType = {
  [key: number]: string
}

export const IMPORTANCE_RADIO_COLORS: ImportanceColorsType = {
  0: `bg-teal-700 ring-teal-200`,
  1: `bg-teal-800 ring-teal-200`,
  2: `bg-teal-900 ring-teal-300`,
  3: `bg-teal-950 ring-teal-400`,
}

export const IMPORTANCE_DISPLAY_COLORS: ImportanceColorsType = {
  0: `bg-stone-300 dark:bg-stone-600`,
  1: `bg-yellow-500/20`,
  2: `bg-yellow-500/50`,
  3: `bg-yellow-400/80`,
}

export const submitCompatibilityAnswer = async (newAnswer: CompatibilityAnswerSubmitType) => {
  if (!newAnswer) return
  const input = {
    ...filterKeys(newAnswer, (key, _) => !['id', 'created_time'].includes(key)),
  } as CompatibilityAnswerSubmitType

  try {
    await api('set-compatibility-answer', {
      questionId: input.question_id,
      multipleChoice: input.multiple_choice,
      prefChoices: input.pref_choices ?? [],
      importance: input.importance,
      explanation: input.explanation ?? null,
    })

    // Track only if upsert succeeds
    track('answer compatibility question', {
      ...newAnswer,
    })
  } catch (error) {
    console.error('Failed to set compatibility answer:', error)
    // Note: toast not localized here due to lack of hook; callers may handle UI feedback
    toast.error('Error submitting. Try again?')
  }
}

export const deleteCompatibilityAnswer = async (id: number, userId: string) => {
  if (!userId || !id) return
  try {
    await api('delete-compatibility-answer', {id})
    await track('delete compatibility question', {id})
  } catch (error) {
    console.error('Failed to delete prompt answer:', error)
    // Note: toast not localized here due to lack of hook; callers may handle UI feedback
    toast.error('Error deleting. Try again?')
  }
}

export function getEmptyAnswer(userId: string, questionId: number) {
  return {
    creator_id: userId,
    explanation: null,
    multiple_choice: -1,
    pref_choices: [],
    question_id: questionId,
    importance: -1,
  }
}

/**
 * Height rules for the panel that wraps this content, shared by the answer flow and the edit modal.
 *
 * `Modal` draws its close button in the strip *above* the panel (it pads that container by `pt-20`
 * and hangs the X off the panel's top edge), so the panel has to leave that strip alone or the only
 * way out of the dialog goes off-screen. Phones get the whole viewport minus exactly that 5rem —
 * bottom-aligned, so the strip is real space above it — and everything wider sizes to its content,
 * capped low enough that centering still leaves the button room. `!` because both fight
 * `MODAL_CLASS`'s own fixed `h-*` for the same property.
 */
export const ANSWER_MODAL_PANEL_CLASS =
  '!h-[calc(100dvh-var(--hloss)-5rem)] sm:!h-auto sm:max-h-[calc(95dvh-var(--hloss)-120px)]'

export function AnswerCompatibilityQuestionContent(props: {
  question: QuestionWithStats
  user: User
  index?: number
  total?: number
  answer?: CompatibilityAnswerSubmitType | null
  onSubmit: () => void
  onNext?: () => void
  isLastQuestion: boolean
  noSkip?: boolean
  sort?: CompatibilitySort
  setSort?: (sort: CompatibilitySort) => void
}) {
  const {question, user, onSubmit, isLastQuestion, onNext, noSkip, index, total, sort, setSort} =
    props
  const t = useT()
  const [answer, setAnswer] = useState<CompatibilityAnswerSubmitType>(
    (props.answer as CompatibilityAnswerSubmitType) ?? getEmptyAnswer(user.id, question.id),
  )

  const [loading, setLoading] = useState(false)
  const [skipLoading, setSkipLoading] = useState(false)

  if (
    question.answer_type !== 'compatibility_multiple_choice' ||
    !question.multiple_choice_options
  ) {
    return null
  }

  const optionOrder = sortBy(Object.entries(question.multiple_choice_options), 1).map(
    ([label]) => label,
  )

  const multipleChoiceValid = answer.multiple_choice != null && answer.multiple_choice !== -1

  const prefChoicesValid = answer.pref_choices && answer.pref_choices.length > 0

  const importanceValid = answer.importance !== null && answer.importance !== -1

  const missing = !multipleChoiceValid
    ? t('answers.missing.your_answer', 'Pick your answer')
    : !prefChoicesValid
      ? t('answers.missing.accept', "Pick what you'll accept")
      : !importanceValid
        ? t('answers.missing.importance', 'Set how much this matters')
        : null

  const shortenedPopularity = question.answer_count ? shortenNumber(question.answer_count) : null

  const hint = t(
    'answers.matrix.hint',
    'Pick where you stand, then tick every answer you could accept from them.',
  )
  return (
    <Col className="min-h-0 w-full gap-4">
      <Col className="gap-1 shrink-0">
        <Row className={'items-center gap-3'}>
          {isFinite(index!) && isFinite(total!) && (
            <Row className="min-w-0 flex-1 items-center gap-2">
              {/* A bare "1 / 39" reads as a chore with no end in sight; the filling bar turns the
                  same number into something that visibly moves every time you answer one. */}
              <div className="bg-canvas-200 h-1 min-w-0 flex-1 overflow-hidden rounded-full">
                <div
                  className="from-primary-400 to-primary-600 h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out"
                  style={{width: `${(((index ?? 0) + 1) / (total || 1)) * 100}%`}}
                />
              </div>
              <span className="text-ink-500 shrink-0 text-xs tabular-nums">
                {index! + 1} / {total}
              </span>
            </Row>
          )}
          {sort && setSort ? (
            <CompatibilitySortWidget
              className="shrink-0 text-sm sm:flex"
              sort={sort}
              setSort={setSort}
              user={user}
              ignore={['your_important']}
            />
          ) : null}
        </Row>
        <Row className={'items-center gap-2'}>
          {/* The instructions were a line of prose under the question, read once and then in the way
              on every question after — and on a phone they cost two lines directly above the thing
              they describe. As an icon they sit with the rest of the prompt's metadata and stay
              available to anyone who wants them. */}
          <Tooltip text={hint}>
            <button
              type="button"
              aria-label={hint}
              className="text-ink-500 hover:text-ink-800 flex items-center transition-colors"
            >
              <InformationCircleIcon className="h-4 w-4" />
            </button>
          </Tooltip>
          {shortenedPopularity && (
            <Tooltip
              text={t(
                'answers.content.people_answered',
                '{count} people have answered this question',
                {count: String(shortenedPopularity)},
              )}
            >
              <Row className="select-none items-center text-sm guidance">
                {shortenedPopularity}
                <UserIcon className="h-4 w-4" />
              </Row>
            </Tooltip>
          )}
          <CommunityImportance percent={question.community_importance_percent} />
          {/* 16px to match the metadata icons it sits with, rather than the 20px a prompt row uses. */}
          <PinQuestionButton questionId={question.id} iconClassName="h-4 w-4" />
          {question.category && (
            <CompatibilityCategoryTag className="ml-auto" category={question.category} />
          )}
        </Row>
        <div
          data-testid="compatibility-question"
          className="font-heading text-ink-900 mt-1 text-lg leading-snug sm:text-xl"
        >
          {question.question}
        </div>
      </Col>
      <Col className={clsx(SCROLLABLE_MODAL_CLASS, 'w-full gap-4 flex-1 min-h-0 pr-2')}>
        <AnswerMatrix
          options={optionOrder}
          choice={answer.multiple_choice}
          setChoice={(choice) => setAnswer({...answer, multiple_choice: choice})}
          prefChoices={answer.pref_choices ?? []}
          setPrefChoices={(choices) => setAnswer({...answer, pref_choices: choices})}
        />
        <ImportanceScale
          value={answer.importance ?? -1}
          setValue={(importance) => setAnswer({...answer, importance})}
        />
        <Col className="gap-2">
          <span className="text-ink-600 text-sm">
            {t('answers.content.your_thoughts', 'Your thoughts (optional, but recommended)')}
          </span>
          {/* `!` because these fight the shared ExpandingInput's own utilities for the same
              properties, and same-specificity conflicts resolve by stylesheet order, not by the
              order they are written here. Its `border-ink-300` is a cool grey (100/100/100 in dark)
              — the one cold edge in a warm palette — and the typed text was inheriting the modal's
              pure-white ink-1000. This puts the field on the same warm border and softer off-white
              the answer cells above it use. */}
          <ExpandingInput
            className={
              'text-ink-800 placeholder:text-ink-500 !border-canvas-200 focus:!border-primary-400 focus:!ring-primary-500/25 w-full !rounded-xl py-2.5 !leading-relaxed focus:!ring-2'
            }
            data-testid="compatibility-question-thoughts"
            rows={2}
            placeholder={t(
              'answers.content.thoughts_placeholder',
              'What made you answer that way?',
            )}
            value={answer.explanation ?? ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setAnswer({...answer, explanation: e.target.value})
            }
          />
        </Col>
      </Col>
      <Row className="border-canvas-200 w-full shrink-0 items-center justify-between gap-3 border-t pt-3">
        {noSkip ? (
          <div />
        ) : (
          <button
            disabled={loading || skipLoading}
            onClick={() => {
              setSkipLoading(true)
              submitCompatibilityAnswer(getEmptyAnswer(user.id, question.id))
                .then(() => {
                  if (isLastQuestion) {
                    onSubmit()
                  } else if (onNext) {
                    onNext()
                  }
                })
                .finally(() => setSkipLoading(false))
            }}
            className={clsx(
              'text-ink-500 disabled:text-ink-300 text-sm hover:underline disabled:cursor-not-allowed',
              skipLoading && 'animate-pulse',
            )}
          >
            {t('answers.menu.skip', 'Skip')}
          </button>
        )}
        {/* The Next button was simply dead until all three parts were filled in, with nothing saying
            which one was missing. */}
        {missing && <span className="text-ink-400 ml-auto text-xs sm:text-sm">{missing}</span>}
        <Button
          className={clsx('gap-2', !missing && 'ml-auto')}
          color="cta"
          disabled={
            !multipleChoiceValid || !prefChoicesValid || !importanceValid || loading || skipLoading
          }
          loading={loading}
          onClick={() => {
            setLoading(true)
            submitCompatibilityAnswer(answer)
              .then(() => {
                if (isLastQuestion) {
                  onSubmit()
                } else if (onNext) {
                  onNext()
                }
              })
              .finally(() => setLoading(false))
          }}
        >
          {isLastQuestion ? t('answers.finish', 'Finish') : t('answers.next', 'Next')}
          <ArrowRightIcon className="h-4 w-4" strokeWidth={2.5} />
        </Button>
      </Row>
    </Col>
  )
}

/**
 * The two halves of an answer, side by side: what you think on the left, what you would accept from
 * someone else on the right, one row per option so the two are directly comparable at a glance.
 *
 * Both columns live in a *single* grid, with every cell placed explicitly (`gridRow`, `col-start`),
 * rather than two column-shaped lists next to each other. That is what guarantees "Neutral" on the
 * left sits exactly opposite "Neutral" on the right even when a long label wraps onto two lines —
 * the grid row is shared, so it is as tall as the taller of the two cells.
 *
 * Colors come from the theme ramps, not from raw Tailwind palettes, because two of those lie in
 * this app: `ink-200` is *black* in dark mode (a border drawn in it vanishes), and `teal-*` is
 * remapped to the greyscale `--color-yes-*` ramp, so a "teal" accent renders grey and `text-teal-900`
 * lands as near-black on a near-black cell. `primary` (amber, "you") and `green` (sage, "them") both
 * invert with the theme, so one class works in light and dark.
 *
 * The e2e page object asserts the two column testids are visible, so they sit on the headers, which
 * are real boxes; the option cells keep their own per-index testids and their label text.
 */
export const AnswerMatrix = (props: {
  options: string[]
  choice: number
  setChoice: (value: number) => void
  prefChoices: number[]
  setPrefChoices: (value: number[]) => void
}) => {
  const {options, choice, setChoice, prefChoices, setPrefChoices} = props
  const t = useT()
  // The cells are laid out by the grid, not nested under their column, so screen readers get the
  // "mine" / "theirs" context from the header they point at rather than from the DOM structure.
  const columnId = useId()
  const mineHeaderId = `${columnId}-mine`
  const acceptHeaderId = `${columnId}-accept`
  const allAccepted = options.length > 0 && options.every((_, i) => prefChoices.includes(i))

  const headerClass = 'items-center gap-1.5 row-start-1 min-w-0 self-end pb-2'
  const labelClass = 'font-dm-sans text-[10px] uppercase tracking-[0.14em] sm:text-[11px] truncate'
  const cellClass =
    'group flex min-w-0 items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left text-[13px] outline-none transition-all duration-150 focus-visible:ring-2 sm:text-sm'
  // Shape is what says single-choice vs multi-choice before any color does: a round radio on the
  // left, a hard-cornered checkbox on the right, both with a 2px edge so the empty state is clearly
  // a control waiting to be ticked rather than a faint outline.
  const markerClass =
    'flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 transition-all'

  return (
    <div className="border-canvas-200 bg-canvas-100 rounded-2xl border p-2 sm:p-3">
      <div className="grid grid-cols-2 items-stretch gap-x-2 gap-y-2 sm:gap-x-3">
        <Row
          id={mineHeaderId}
          data-testid="compatibility-question-your-answer"
          className={clsx(headerClass, 'border-primary-500/40 col-start-1 border-b')}
        >
          <UserIcon className="text-primary-600 h-3.5 w-3.5 shrink-0" />
          <span className={clsx(labelClass, 'text-primary-600')}>
            {t('answers.preferred.your_answer', 'Your answer')}
          </span>
        </Row>
        <Row
          id={acceptHeaderId}
          data-testid="compatibility-answers-you-accept"
          className={clsx(headerClass, 'col-start-2 border-b border-green-500/40')}
        >
          <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-green-500" />
          <span className={clsx(labelClass, 'text-green-500')}>
            {t('answers.matrix.you_accept', "You'll accept")}
          </span>
          <button
            type="button"
            onClick={() => setPrefChoices(allAccepted ? [] : options.map((_, i) => i))}
            className="text-ink-500 hover:text-ink-800 ml-auto shrink-0 pl-1 text-[10px] uppercase tracking-wider underline-offset-2 hover:underline sm:text-[11px]"
          >
            {allAccepted ? t('answers.matrix.none', 'None') : t('answers.matrix.all', 'All')}
          </button>
        </Row>

        {options.map((label, i) => {
          const isMine = choice === i
          const isAccepted = prefChoices.includes(i)
          return (
            <Fragment key={label}>
              <button
                type="button"
                aria-pressed={isMine}
                aria-describedby={mineHeaderId}
                data-testid={`compatibility-your-answer-${i}`}
                style={{gridRow: i + 2}}
                onClick={() => setChoice(i)}
                className={clsx(
                  cellClass,
                  'ring-primary-500 col-start-1',
                  isMine
                    ? 'border-primary-500 bg-primary-100 text-primary-900 shadow-[0_2px_14px_-6px_rgb(var(--color-primary-500)/0.8)] font-medium'
                    : 'border-canvas-200 bg-canvas-50 text-ink-700 hover:border-primary-400 hover:text-ink-900',
                )}
              >
                <span
                  className={clsx(
                    markerClass,
                    'rounded-full',
                    isMine
                      ? 'border-primary-500 bg-primary-500 ring-primary-500/30 ring-4'
                      : 'border-ink-400 group-hover:border-primary-400',
                  )}
                >
                  {isMine && <span className="bg-canvas-50 h-2 w-2 rounded-full" />}
                </span>
                <span className="min-w-0 break-words">{label}</span>
              </button>
              <button
                type="button"
                aria-pressed={isAccepted}
                aria-describedby={acceptHeaderId}
                data-testid={`compatibility-answers-you-accept-${i}`}
                style={{gridRow: i + 2}}
                onClick={() =>
                  setPrefChoices(
                    isAccepted ? prefChoices.filter((v) => v !== i) : [...prefChoices, i],
                  )
                }
                className={clsx(
                  cellClass,
                  'col-start-2 ring-green-500',
                  isAccepted
                    ? 'bg-green-200 font-medium text-green-800 shadow-[0_2px_14px_-6px_rgb(var(--color-green-500)/0.9)] border-green-500'
                    : 'border-canvas-200 bg-canvas-50 text-ink-700 hover:text-ink-900 hover:border-green-500/60',
                  // Faint tie-back to the row you picked for yourself, so the "do I accept my own
                  // answer?" question reads straight across instead of by counting rows.
                  isMine && !isAccepted && 'border-primary-500/40 border-dashed',
                )}
              >
                <span
                  className={clsx(
                    markerClass,
                    'rounded-[3px]',
                    isAccepted
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-ink-400 group-hover:border-green-500',
                  )}
                >
                  {isAccepted && <CheckIcon className="h-3 w-3" strokeWidth={3.5} />}
                </span>
                <span className="min-w-0 break-words">{label}</span>
              </button>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

/**
 * How much the question matters, as a rising meter rather than four identical dots.
 *
 * The dots it replaces were drawn from `teal-700..950`, which in this app's config is the greyscale
 * `--color-yes-*` ramp — four grey circles that neither read as a scale nor said which end was which
 * until you found the labels on either side. Height plus an amber ramp says "more" without reading
 * anything, and the selected level is named in the chip.
 */
export const ImportanceScale = (props: {value: number; setValue: (value: number) => void}) => {
  const {value, setValue} = props
  const t = useT()
  // Hovering fills the scale up to the level under the cursor, the way a star rating does, so you
  // can see what a click is about to mean before committing to it.
  const [hovered, setHovered] = useState(-1)
  const shown = hovered >= 0 ? hovered : value
  const previewing = hovered >= 0 && hovered !== value
  const levels = Object.entries(IMPORTANCE_CHOICES) as [keyof typeof IMPORTANCE_CHOICES, number][]
  const heights = ['h-6', 'h-8', 'h-10', 'h-12']
  const fills = [
    'bg-primary-500/25 border-primary-500/40',
    'bg-primary-500/45 border-primary-500/60',
    'bg-primary-500/70 border-primary-500/80',
    'bg-primary-500 border-primary-500',
  ]
  const current = levels.find(([, v]) => v === shown)

  return (
    <Col className="gap-2">
      <Row className="items-center gap-2">
        <span className="text-ink-500 text-sm">
          {t('answers.content.importance', 'Importance')}
        </span>
        {current && (
          <span
            className={clsx(
              'bg-primary-100 text-primary-900 rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity',
              previewing && 'opacity-60',
            )}
          >
            {t(`answers.importance.${current[1]}`, current[0])}
          </span>
        )}
      </Row>
      <Row className="items-end gap-1.5" onMouseLeave={() => setHovered(-1)}>
        {levels.map(([label, v], i) => {
          const filled = shown >= 0 && shown >= v
          return (
            <button
              key={v}
              type="button"
              aria-label={t(`answers.importance.${v}`, label)}
              aria-pressed={value === v}
              data-testid={`compatibility-question-importance-${v}`}
              // Clicking the level you are on clears it, as the dots did.
              onClick={() => setValue(value === v ? -1 : v)}
              onMouseEnter={() => setHovered(v)}
              onFocus={() => setHovered(v)}
              onBlur={() => setHovered(-1)}
              className={clsx(
                'ring-primary-500 flex-1 rounded-lg border outline-none transition-all duration-150 focus-visible:ring-2',
                heights[i],
                filled
                  ? clsx(fills[i], previewing && 'opacity-70')
                  : 'border-canvas-200 bg-canvas-50',
              )}
            />
          )
        })}
      </Row>
      <Row className="text-ink-500 justify-between text-[11px]">
        <span>{t(`answers.importance.0`, 'Not Important')}</span>
        <span>{t(`answers.importance.3`, 'Very Important')}</span>
      </Row>
    </Col>
  )
}

//Exported types for test files to use when referencing the keys of the choices objects
export type ImportanceTuple = {
  [K in keyof typeof IMPORTANCE_CHOICES]: [K, (typeof IMPORTANCE_CHOICES)[K]]
}[keyof typeof IMPORTANCE_CHOICES]
