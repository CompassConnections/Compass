import {RadioGroup} from '@headlessui/react'
import {UserIcon} from '@heroicons/react/solid'
import clsx from 'clsx'
import {Row as rowFor} from 'common/supabase/utils'
import {User} from 'common/user'
import {shortenNumber} from 'common/util/format'
import {sortBy} from 'lodash'
import {useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {ExpandingInput} from 'web/components/widgets/expanding-input'
import {RadioToggleGroup} from 'web/components/widgets/radio-toggle-group'
import {Tooltip} from 'web/components/widgets/tooltip'
import {QuestionWithCountType} from 'web/hooks/use-questions'
import {track} from 'web/lib/service/analytics'
import {api} from 'web/lib/api'
import {filterKeys} from '../questions-form'
import toast from "react-hot-toast"
import {useT} from 'web/lib/locale'

export type CompatibilityAnswerSubmitType = Omit<
  rowFor<'compatibility_answers'>,
  'created_time' | 'id'
>

export const IMPORTANCE_CHOICES = {
  'Not Important': 0,
  'Somewhat Important': 1,
  'Important': 2,
  'Very Important': 3,
}

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

export const submitCompatibilityAnswer = async (
  newAnswer: CompatibilityAnswerSubmitType
) => {
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

export const deleteCompatibilityAnswer = async (
  id: number,
  userId: string
) => {
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

export function AnswerCompatibilityQuestionContent(props: {
  compatibilityQuestion: QuestionWithCountType
  user: User
  index?: number
  total?: number
  answer?: CompatibilityAnswerSubmitType | null
  onSubmit: () => void
  onNext?: () => void
  isLastQuestion: boolean
  noSkip?: boolean
}) {
  const {
    compatibilityQuestion,
    user,
    onSubmit,
    isLastQuestion,
    onNext,
    noSkip,
    index,
    total,
  } = props
  const t = useT()
  const [answer, setAnswer] = useState<CompatibilityAnswerSubmitType>(
    (props.answer as CompatibilityAnswerSubmitType) ??
    getEmptyAnswer(user.id, compatibilityQuestion.id)
  )

  const [loading, setLoading] = useState(false)
  const [skipLoading, setSkipLoading] = useState(false)
  if (
    compatibilityQuestion.answer_type !== 'compatibility_multiple_choice' ||
    !compatibilityQuestion.multiple_choice_options
  ) {
    return null
  }

  const optionOrder = sortBy(
    Object.entries(compatibilityQuestion.multiple_choice_options),
    1
  ).map(([label]) => label)

  const multipleChoiceValid =
    answer.multiple_choice != null && answer.multiple_choice !== -1

  const prefChoicesValid = answer.pref_choices && answer.pref_choices.length > 0

  const importanceValid = answer.importance !== null && answer.importance !== -1

  const shortenedPopularity = compatibilityQuestion.answer_count
    ? shortenNumber(compatibilityQuestion.answer_count)
    : null
  return (
    <Col className="h-full w-full gap-4">
      <Col className="gap-1">
        {/*{compatibilityQuestion.importance_score > 0 && <Row className="text-blue-400 -mt-4 w-full justify-start text-sm">*/}
        {/*  <span>*/}
        {/*    Massive upgrade coming soon! More prompts, better predictive power, filtered by category, etc.*/}
        {/*  </span>*/}
        {/*</Row>}*/}
        {index !== null &&
          index !== undefined &&
          total !== null &&
          total !== undefined &&
          total > 1 && (
            <Row className="text-ink-500 -mt-4 w-full justify-end text-sm">
              <span>
                <span className="text-ink-600 font-semibold">{index + 1}</span>{' '}
                / {total}
              </span>
            </Row>
          )}
        <div>{compatibilityQuestion.question}</div>
        {shortenedPopularity && (
          <Row className="text-ink-500 select-none items-center text-sm">
            <Tooltip
              text={t('answers.content.people_answered', '{count} people have answered this question', { count: String(shortenedPopularity) })}
            >
              {shortenedPopularity}
            </Tooltip>
            <UserIcon className="h-4 w-4"/>
          </Row>
        )}
      </Col>
      <Col
        className={clsx(
          SCROLLABLE_MODAL_CLASS,
          'h-[20rem] w-full gap-4 sm:h-[30rem]'
        )}
      >
        <Col className="gap-2">
          <span className="text-ink-500 text-sm">{t('answers.content.your_answer', 'Your answer')}</span>
          <SelectAnswer
            value={answer.multiple_choice}
            setValue={(choice) =>
              setAnswer({...answer, multiple_choice: choice})
            }
            options={optionOrder}
          />
        </Col>
        <Col className="gap-2">
          <span className="text-ink-500 text-sm">{t('answers.content.answers_you_accept', "Answers you'll accept")}</span>
          <MultiSelectAnswers
            values={answer.pref_choices ?? []}
            setValue={(choice) =>
              setAnswer({...answer, pref_choices: choice})
            }
            options={optionOrder}
          />
        </Col>
        <Col className="gap-2">
          <span className="text-ink-500 text-sm">{t('answers.content.importance', 'Importance')}</span>
          <RadioToggleGroup
            currentChoice={answer.importance ?? -1}
            choicesMap={IMPORTANCE_CHOICES}
            setChoice={(choice: number) =>
              setAnswer({...answer, importance: choice})
            }
            indexColors={IMPORTANCE_RADIO_COLORS}
          />
        </Col>
        <Col className="-mt-6 gap-2">
          <span className="text-ink-500 text-sm">
            {t('answers.content.your_thoughts', 'Your thoughts (optional, but recommended)')}
          </span>
          <ExpandingInput
            className={'w-full'}
            rows={3}
            value={answer.explanation ?? ''}
            onChange={(e) =>
              setAnswer({...answer, explanation: e.target.value})
            }
          />
        </Col>
      </Col>
      <Row className="w-full justify-between gap-4">
        {noSkip ? (
          <div/>
        ) : (
          <button
            disabled={loading || skipLoading}
            onClick={() => {
              setSkipLoading(true)
              submitCompatibilityAnswer(
                getEmptyAnswer(user.id, compatibilityQuestion.id)
              )
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
              skipLoading && 'animate-pulse'
            )}
          >
            {t('answers.content.skip', 'Skip')}
          </button>
        )}
        <Button
          disabled={
            !multipleChoiceValid ||
            !prefChoicesValid ||
            !importanceValid ||
            loading ||
            skipLoading
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
          {isLastQuestion ? t('answers.content.finish', 'Finish') : t('answers.content.next', 'Next')}
        </Button>
      </Row>
    </Col>
  )
}

export const SelectAnswer = (props: {
  value: number
  setValue: (value: number) => void
  options: string[]
}) => {
  const {value, setValue, options} = props
  return (
    <RadioGroup
      className={
        'border-ink-300 text-ink-400 bg-canvas-0 inline-flex flex-col gap-2 rounded-md border p-1 text-sm shadow-sm'
      }
      value={value}
      onChange={setValue}
    >
      {options.map((label, i) => (
        <RadioGroup.Option
          key={i}
          value={i}
          className={({disabled}) =>
            clsx(
              disabled
                ? 'text-ink-300 aria-checked:bg-ink-300 aria-checked:text-ink-0 cursor-not-allowed'
                : 'text-ink-700 hover:bg-ink-50 aria-checked:bg-primary-100 aria-checked:text-primary-900 aria-checked:hover:bg-primary-50 cursor-pointer',
              'ring-primary-500 flex items-center rounded-md p-2 outline-none transition-all focus-visible:ring-2 sm:px-3'
            )
          }
        >
          {label}
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  )
}

// redo with checkbox semantics
export const MultiSelectAnswers = (props: {
  values: number[]
  setValue: (value: number[]) => void
  options: string[]
}) => {
  const {values, setValue, options} = props

  return (
    <Col
      className={
        'border-ink-300 text-ink-400 bg-canvas-0 inline-flex flex-col gap-2 rounded-md border p-1 text-sm shadow-sm main-font'
      }
    >
      {options.map((label, i) => (
        <button
          key={i}
          className={clsx(
            values.includes(i)
              ? 'text-primary-700 bg-primary-100 hover:bg-primary-50'
              : 'text-ink-700 hover:bg-ink-50',
            'ring-primary-500 flex cursor-pointer items-center rounded-md p-2 outline-none transition-all focus-visible:ring-2 disabled:cursor-not-allowed sm:px-3'
          )}
          onClick={() =>
            setValue(
              values.includes(i)
                ? values.filter((v) => v !== i)
                : [...values, i]
            )
          }
        >
          {label}
        </button>
      ))}
    </Col>
  )
}
