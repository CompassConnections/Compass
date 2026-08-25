import {ArrowRightIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {QuestionWithStats} from 'common/api/types'
import {debug} from 'common/logger'
import {User} from 'common/user'
import Link from 'next/link'
import router from 'next/router'
import {useEffect, useMemo, useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {compareBySort, CompatibilitySort} from 'web/components/compatibility/sort-widget'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {useT} from 'web/lib/locale'

import {AnswerCompatibilityQuestionContent} from './answer-compatibility-question-content'

export function AnswerCompatibilityQuestionButton(props: {
  user: User | null | undefined
  otherQuestions: QuestionWithStats[]
  refreshCompatibilityAll: () => void
  fromSignup?: boolean
  size?: 'sm' | 'md'
}) {
  const {user, otherQuestions, refreshCompatibilityAll, fromSignup, size = 'md'} = props
  const [open, setOpen] = useState(fromSignup ?? false)
  const t = useT()
  const {isCore, questionsToAnswer} = useMemo(() => {
    const isCore = otherQuestions.some((q) => q.importance_score === 0)
    return {
      isCore,
      questionsToAnswer: isCore
        ? otherQuestions.filter((q) => q.importance_score === 0)
        : otherQuestions,
    }
  }, [otherQuestions])
  if (!user) return null
  if (!fromSignup && questionsToAnswer.length === 0) return null
  return (
    <>
      {size === 'md' ? (
        <Button
          onClick={() => setOpen(true)}
          color="none"
          className={
            'px-3 py-2 rounded-md border border-primary-600 text-primary-800 hover:bg-primary-50'
          }
        >
          {t('answers.answer.cta', 'Answer{core} Questions', {
            core: isCore ? ' Core' : '',
          })}{' '}
          <span className="text-primary-600 ml-2">+{questionsToAnswer.length}</span>
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          // Matches the outlined importance/compatibility pills it sits beside in a prompt. It was the
          // only solid one of the three, which read as the loudest thing in a block it is not about.
          className="font-dm-sans border-canvas-300 text-ink-600 hover:border-primary-400 hover:bg-primary-50 h-fit whitespace-nowrap rounded-full border px-2.5 py-1 uppercase transition-colors"
          style={{fontSize: '10px', letterSpacing: '0.12em'}}
        >
          {t('answers.answer.answer_yourself', 'Answer yourself')}
        </button>
      )}
      <AnswerCompatibilityQuestionModal
        open={open}
        setOpen={setOpen}
        user={user}
        otherQuestions={questionsToAnswer}
        fromSignup={fromSignup}
        refreshCompatibilityAll={refreshCompatibilityAll}
        onClose={() => {
          if (fromSignup) router.push('/onboarding/soft-gate')
        }}
      />
    </>
  )
}

export function CompatibilityPageButton() {
  const t = useT()
  return (
    <Link
      href="/compatibility"
      className="px-3 py-2 rounded-md border border-primary-600 text-primary-800 hover:bg-primary-50 flex items-center justify-center text-center text-sm"
    >
      {t('answers.answer.view_list', 'View List of Questions')}
    </Link>
  )
}

export function AnswerSkippedCompatibilityQuestionsButton(props: {
  user: User | null | undefined
  skippedQuestions: QuestionWithStats[]
  refreshCompatibilityAll: () => void
  fromSignup?: boolean
}) {
  const {user, skippedQuestions, refreshCompatibilityAll, fromSignup} = props
  const [open, setOpen] = useState(false)
  const t = useT()
  if (!user) return null
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-ink-500 text-sm hover:underline">
        {t('answers.answer.answer_skipped', 'Answer {n} skipped questions', {
          n: String(skippedQuestions.length),
        })}{' '}
      </button>
      <AnswerCompatibilityQuestionModal
        open={open}
        setOpen={setOpen}
        user={user}
        otherQuestions={skippedQuestions}
        fromSignup={fromSignup}
        refreshCompatibilityAll={refreshCompatibilityAll}
      />
    </>
  )
}

function CompatibilityOnboardingScreen({onNext, onSkip}: {onNext: () => void; onSkip: () => void}) {
  const t = useT()

  return (
    <Col className={clsx(SCROLLABLE_MODAL_CLASS, 'max-w-2xl mx-auto text-center px-6')}>
      <h1 className="text-4xl font-bold text-ink-900 mb-6">
        {t('compatibility.onboarding.title', "See who you'll align with")}
      </h1>

      <div className="text-lg text-ink-700 leading-relaxed mb-8 space-y-4">
        <p>
          {t(
            'compatibility.onboarding.body1',
            'Answer a few short questions to calculate compatibility based on values and preferences.',
          )}
        </p>
        {/*<p>*/}
        {/*  {t(*/}
        {/*    'compatibility.onboarding.body2',*/}
        {/*    'Your answers directly affect who matches with you and how strongly.',*/}
        {/*  )}*/}
        {/*</p>*/}
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-8">
        <p className="text-primary-800 font-medium">
          {t(
            'compatibility.onboarding.impact',
            'Most people who answer at least 5 questions see far more relevant people.',
          )}
        </p>
      </div>

      <Col className="gap-4">
        {/* Same fix as the /onboarding screens: this was falling through to `Button`'s default
            `gray-outline`, so the screen's only real action was a hairline pill quieter than the
            "Do this later" link under it. `cta` matches the forward action in the signup flow. */}
        <Button
          onClick={onNext}
          size="xl"
          color="cta"
          className="group w-full max-w-xs mx-auto gap-2 py-3.5 text-lg"
        >
          {t('compatibility.onboarding.start', 'Start answering')}
          <ArrowRightIcon
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
            strokeWidth={2.5}
          />
        </Button>
        <button onClick={onSkip} className="text-sm text-ink-500 hover:text-ink-700 underline">
          {t('compatibility.onboarding.later', 'Do this later')}
        </button>
      </Col>
    </Col>
  )
}

/**
 * Which entry of the question list the modal should be showing, given the index it is holding.
 *
 * The list is refetched while the modal is open and only ever shrinks (answering a question moves
 * it out of the "unanswered" group), so a held index can end up past the end. Clamp to the last
 * remaining question rather than running off the array — the person still has questions to answer,
 * so dropping them out of the flow would be wrong. Returns `-1` for an empty list, which indexes to
 * `undefined` and is handled by the caller.
 */
export const clampQuestionIndex = (questionIndex: number, questionCount: number) =>
  Math.min(Math.max(questionIndex, 0), questionCount - 1)

function AnswerCompatibilityQuestionModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  user: User
  otherQuestions: QuestionWithStats[]
  refreshCompatibilityAll: () => void
  onClose?: () => void
  fromSignup?: boolean
}) {
  const {open, setOpen, user, otherQuestions, refreshCompatibilityAll, onClose, fromSignup} = props
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(fromSignup ?? false)
  const [sort, setSort] = useState<CompatibilitySort>('random')

  useEffect(() => {
    refreshCompatibilityAll()
    setQuestionIndex(0)
  }, [sort])

  const sortedQuestions = useMemo(() => {
    debug('Refreshing sorted questions')
    return [...otherQuestions].sort((a, b) => {
      return compareBySort(a, b, sort)
    }) as QuestionWithStats[]
  }, [otherQuestions, sort])

  // `otherQuestions` is the "not answered yet" group, recomputed from whatever
  // `refreshCompatibilityAll` last fetched — and this modal fires that refresh itself, from its own
  // close handler. Every answer submitted here drops a question out of that group, so the array
  // shrinks underneath a `questionIndex` that only counts up, and on the way out the two cross.
  // Reading the question straight out of the array then yielded `undefined`, and `.id` on it threw
  // during render: an error inside render escapes to the page's error boundary, so this took the
  // whole screen down rather than just the dialog. That is how it surfaced — the onboarding E2E
  // flow failed asserting on the profile *behind* the modal, with no sign the questions were at
  // fault.
  const questionCursor = clampQuestionIndex(questionIndex, sortedQuestions.length)
  const question: QuestionWithStats | undefined = sortedQuestions[questionCursor]

  // Nothing left to answer while the dialog is open past the intro means the last submit emptied
  // the group; close instead of leaving an empty panel. Guarded on `showOnboarding` so it cannot
  // fire on the intro screen, which is shown before the questions have loaded.
  useEffect(() => {
    if (open && !showOnboarding && sortedQuestions.length === 0) setOpen(false)
  }, [open, showOnboarding, sortedQuestions.length])

  const handleStartQuestions = () => {
    if (otherQuestions.length === 0) {
      toast.error('No questions to answer')
      setOpen(false)
      return
    }
    setShowOnboarding(false)
  }

  const handleSkipOnboarding = () => {
    setShowOnboarding(false)
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      onClose={() => {
        refreshCompatibilityAll()
        setQuestionIndex(0)
        setShowOnboarding(fromSignup ?? false)
        onClose?.()
      }}
    >
      <Col
        className={clsx(
          MODAL_CLASS,
          // The question screens want the full fixed height, but the onboarding screen is short and
          // was leaving a large empty block under the "Do this later" link. Let it size to content,
          // still capped at the viewport so it scrolls if the copy grows.
          showOnboarding && '!h-auto max-h-[calc(100dvh-var(--hloss)-120px)] pb-6',
        )}
      >
        {showOnboarding ? (
          <CompatibilityOnboardingScreen
            onNext={handleStartQuestions}
            onSkip={handleSkipOnboarding}
          />
        ) : question ? (
          <AnswerCompatibilityQuestionContent
            key={question.id}
            index={questionCursor}
            total={sortedQuestions.length}
            question={question}
            user={user}
            onSubmit={() => {
              setOpen(false)
            }}
            isLastQuestion={questionCursor === sortedQuestions.length - 1}
            onNext={() => {
              if (questionCursor === sortedQuestions.length - 1) {
                setOpen(false)
              } else {
                setQuestionIndex(questionCursor + 1)
              }
            }}
            sort={sort}
            setSort={setSort}
          />
        ) : null}
      </Col>
    </Modal>
  )
}
