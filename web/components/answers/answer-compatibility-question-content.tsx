import { RadioGroup } from '@headlessui/react'
import { UserIcon } from '@heroicons/react/solid'
import clsx from 'clsx'
import { Row as rowFor, run } from 'common/supabase/utils'
import { User } from 'common/user'
import { shortenNumber } from 'common/util/format'
import { sortBy } from 'lodash'
import { useState } from 'react'
import { Button } from 'web/components/buttons/button'
import { Col } from 'web/components/layout/col'
import { SCROLLABLE_MODAL_CLASS } from 'web/components/layout/modal'
import { Row } from 'web/components/layout/row'
import { ExpandingInput } from 'web/components/widgets/expanding-input'
import { RadioToggleGroup } from 'web/components/widgets/radio-toggle-group'
import { Tooltip } from 'web/components/widgets/tooltip'
import { QuestionWithCountType } from 'web/hooks/use-questions'
import { track } from 'web/lib/service/analytics'
import { db } from 'web/lib/supabase/db'
import { filterKeys } from '../questions-form'
import toast from "react-hot-toast";

export type CompatibilityAnswerSubmitType = Omit<
  rowFor<'love_compatibility_answers'>,
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
  0: `bg-stone-400 ring-stone-400 dark:bg-stone-500 dark:ring-stone-500`,
  1: `bg-teal-200 ring-teal-200 dark:bg-teal-100 dark:ring-teal-100 `,
  2: `bg-teal-300 ring-teal-300 dark:bg-teal-200 dark:ring-teal-200 `,
  3: `bg-teal-400 ring-teal-400`,
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
    await run(
      db.from('love_compatibility_answers').upsert(input, {
        onConflict: 'question_id,creator_id',
      })
    );

    // Track only if upsert succeeds
    track('answer compatibility question', {
      ...newAnswer,
    });
  } catch (error) {
    console.error('Failed to upsert love_compatibility_answers:', error);
    toast.error('Error submitting. Try again?')
  }

}

function getEmptyAnswer(userId: string, questionId: number) {
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
  answer?: rowFor<'love_compatibility_answers'> | null
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
              text={`${shortenedPopularity} people have answered this question`}
            >
              {shortenedPopularity}
            </Tooltip>
            <UserIcon className="h-4 w-4" />
          </Row>
        )}
      </Col>
      <Col
        className={clsx(
          SCROLLABLE_MODAL_CLASS,
          'h-[30rem] w-full gap-4 sm:h-[30rem]'
        )}
      >
        <Col className="gap-2">
          <span className="text-ink-500 text-sm">Your answer</span>
          <SelectAnswer
            value={answer.multiple_choice}
            setValue={(choice) =>
              setAnswer({ ...answer, multiple_choice: choice })
            }
            options={optionOrder}
          />
        </Col>
        <Col className="gap-2">
          <span className="text-ink-500 text-sm">Answers you'll accept</span>
          <MultiSelectAnswers
            values={answer.pref_choices ?? []}
            setValue={(choice) =>
              setAnswer({ ...answer, pref_choices: choice })
            }
            options={optionOrder}
          />
        </Col>
        <Col className="gap-2">
          <span className="text-ink-500 text-sm">Importance</span>
          <RadioToggleGroup
            currentChoice={answer.importance ?? -1}
            choicesMap={IMPORTANCE_CHOICES}
            setChoice={(choice: number) =>
              setAnswer({ ...answer, importance: choice })
            }
            indexColors={IMPORTANCE_RADIO_COLORS}
          />
        </Col>
        <Col className="-mt-6 gap-2">
          <span className="text-ink-500 text-sm">
            Your thoughts (optional, but recommended)
          </span>
          <ExpandingInput
            className={'w-full'}
            rows={3}
            value={answer.explanation ?? ''}
            onChange={(e) =>
              setAnswer({ ...answer, explanation: e.target.value })
            }
          />
        </Col>
      </Col>
      <Row className="w-full justify-between gap-4">
        {noSkip ? (
          <div />
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
            Skip
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
          {isLastQuestion ? 'Finish' : 'Next'}
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
  const { value, setValue, options } = props
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
          className={({ disabled }) =>
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

// TODO: redo with checkbox semantics
export const MultiSelectAnswers = (props: {
  values: number[]
  setValue: (value: number[]) => void
  options: string[]
}) => {
  const { values, setValue, options } = props

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
