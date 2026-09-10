import {ArrowRightIcon} from '@heroicons/react/24/outline'
import {CheckBadgeIcon} from '@heroicons/react/24/solid'
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

import {
  ANSWER_MODAL_PANEL_CLASS,
  AnswerCompatibilityQuestionContent,
} from './answer-compatibility-question-content'

/**
 * The questions everyone is asked first.
 *
 * `importance_score` carries two things at once. Non-zero marks a prompt as core — 0 is everything
 * outside the core set. (That polarity used to be inverted, 0 meaning core, so a comparison against
 * 0 anywhere in this area is worth a second look.) Among the core prompts the number is also the
 * serving priority, highest first: the prompt with the largest score opens the run, and the scores
 * descend as the questions get more vulnerable — the escalation the set is meant to have. See "Order
 * the set by escalation" in docs/compatibility-questions.md.
 */
const isCoreQuestion = (question: QuestionWithStats) => question.importance_score > 0

/** Highest score first. Ties keep the order they arrived in, the same rule applied server-side. */
const byCoreOrder = (a: QuestionWithStats, b: QuestionWithStats) =>
  b.importance_score - a.importance_score

export function AnswerCompatibilityQuestionButton(props: {
  user: User | null | undefined
  otherQuestions: QuestionWithStats[]
  refreshCompatibilityAll: () => void
  fromSignup?: boolean
  size?: 'sm' | 'md'
  /**
   * One prompt opened from a profile row, rather than the member's whole unanswered set. It is the
   * same dialog, but it is not a run through the core questions, so finishing it must not claim they
   * got through them — it just closes.
   */
  singlePrompt?: boolean
}) {
  const {
    user,
    otherQuestions,
    refreshCompatibilityAll,
    fromSignup,
    size = 'md',
    singlePrompt,
  } = props
  const [open, setOpen] = useState(fromSignup ?? false)
  const t = useT()
  const {isCore, questionsToAnswer} = useMemo(() => {
    const isCore = otherQuestions.some(isCoreQuestion)
    return {
      isCore,
      questionsToAnswer: isCore ? otherQuestions.filter(isCoreQuestion) : otherQuestions,
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
        // The whole unanswered set, not just the core subset: finishing the core questions offers to
        // keep going, and the dialog can only widen its own pool if it holds the rest already.
        otherQuestions={otherQuestions}
        startWithCore={isCore && !singlePrompt}
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
 * Shown when the core run empties, in place of the dialog simply vanishing.
 *
 * The close was the whole problem: from the member's side, answering the last core question and
 * having the dialog disappear is indistinguishable from "there are no more questions", so people
 * finished onboarding believing they were done with the set. This names what they finished, and puts
 * the rest of the corpus behind a button that keeps them in the flow they are already in.
 */
function CoreQuestionsCompleteScreen(props: {
  remaining: number
  onAnswerMore: () => void
  onDone: () => void
}) {
  const {remaining, onAnswerMore, onDone} = props
  const t = useT()

  return (
    <Col className={clsx(SCROLLABLE_MODAL_CLASS, 'mx-auto max-w-2xl px-6 text-center')}>
      <CheckBadgeIcon className="text-primary-500 mx-auto mb-4 h-14 w-14" />
      <h1 className="text-ink-900 mb-4 text-3xl font-bold">
        {t('compatibility.core_done.title', "That's the core questions done")}
      </h1>
      {/*<p className="text-ink-700 mb-8 text-lg leading-relaxed">*/}
      {/*  {t(*/}
      {/*    'compatibility.core_done.body',*/}
      {/*    'Those are the ones everyone answers, so they are what your first matches are built from.',*/}
      {/*  )}*/}
      {/*</p>*/}

      {remaining > 0 && (
        <div className="bg-primary-50 border-primary-200 mb-8 rounded-lg border p-4">
          <p className="text-primary-800 font-medium">
            {t(
              'compatibility.core_done.more_available',
              'There are {count} more questions. Every one you answer sharpens who you match with. It also gives people something to talk to you about.',
              {count: String(remaining)},
            )}
          </p>
        </div>
      )}

      <Col className="gap-4">
        {remaining > 0 && (
          <Button
            onClick={onAnswerMore}
            size="xl"
            color="cta"
            className="group mx-auto w-full max-w-xs gap-2 py-3.5 text-lg"
          >
            {t('compatibility.core_done.answer_more', 'Keep answering')}
            <ArrowRightIcon
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              strokeWidth={2.5}
            />
          </Button>
        )}
        <button onClick={onDone} className="text-ink-500 hover:text-ink-700 text-sm underline">
          {t('compatibility.core_done.done', 'Done for now')}
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
  /** Run the core questions first, then offer the rest, rather than serving one pool. */
  startWithCore?: boolean
}) {
  const {open, setOpen, user, otherQuestions, refreshCompatibilityAll, onClose, fromSignup} = props
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(fromSignup ?? false)
  const [sort, setSort] = useState<CompatibilitySort>('random')
  // Set when the core run empties. Answering the last core question used to just close the dialog,
  // which reads as "that was all of them" — the reason someone finishes onboarding and never comes
  // back. The screen says what they finished and offers the rest.
  const [showCoreDone, setShowCoreDone] = useState(false)
  // Flipped by taking that offer: the pool widens from the core subset to everything unanswered.
  const [pastCore, setPastCore] = useState(false)

  const inCoreRun = !!props.startWithCore && !pastCore

  useEffect(() => {
    refreshCompatibilityAll()
    setQuestionIndex(0)
  }, [sort])

  const questionPool = useMemo(
    () => (inCoreRun ? otherQuestions.filter(isCoreQuestion) : otherQuestions),
    [otherQuestions, inCoreRun],
  )

  const remainingBeyondCore = useMemo(
    () => otherQuestions.filter((q) => !isCoreQuestion(q)).length,
    [otherQuestions],
  )

  const sortedQuestions = useMemo(() => {
    debug('Refreshing sorted questions')
    // The core run is a guided sequence, not a pile to browse: it escalates, so it is ordered, and
    // the sort control is hidden for it (below). Random is right for everything after — those are
    // interchangeable in stakes, and shuffling keeps a long tail from always starting the same way.
    if (inCoreRun) return [...questionPool].sort(byCoreOrder)
    return [...questionPool].sort((a, b) => {
      return compareBySort(a, b, sort)
    }) as QuestionWithStats[]
  }, [questionPool, inCoreRun, sort])

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
  // the group; close instead of leaving an empty panel — or, on a core run, say so first. Guarded on
  // `showOnboarding` so it cannot fire on the intro screen, which is shown before the questions have
  // loaded.
  useEffect(() => {
    if (!open || showOnboarding || showCoreDone || sortedQuestions.length > 0) return
    if (inCoreRun) setShowCoreDone(true)
    else setOpen(false)
  }, [open, showOnboarding, showCoreDone, inCoreRun, sortedQuestions.length])

  // The submit path gets there first in practice — the list only shrinks once the refetch lands, so
  // waiting for it would flash the last question again before the screen appears.
  const finishRun = () => {
    if (inCoreRun) setShowCoreDone(true)
    else setOpen(false)
  }

  const handleAnswerMore = () => {
    setPastCore(true)
    setShowCoreDone(false)
    setQuestionIndex(0)
  }

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
      // The answer screen is two aligned columns now (your answer / what you'd accept), which want
      // more room than the default `md` panel gave them.
      size="lg"
      onClose={() => {
        refreshCompatibilityAll()
        setQuestionIndex(0)
        setShowOnboarding(fromSignup ?? false)
        setShowCoreDone(false)
        setPastCore(false)
        onClose?.()
      }}
    >
      <Col
        className={clsx(
          MODAL_CLASS,
          // Size to content on desktop, capped at the viewport so it scrolls if the copy grows. The
          // fixed height MODAL_CLASS sets was leaving a large empty block under the "Do this later"
          // link on the onboarding screen, and just as much under a two-option question — the panel
          // was built for the longest question in the set and every shorter one paid for it.
          ANSWER_MODAL_PANEL_CLASS,
          (showOnboarding || showCoreDone) && 'pb-6',
        )}
      >
        {showOnboarding ? (
          <CompatibilityOnboardingScreen
            onNext={handleStartQuestions}
            onSkip={handleSkipOnboarding}
          />
        ) : showCoreDone ? (
          <CoreQuestionsCompleteScreen
            remaining={remainingBeyondCore}
            onAnswerMore={handleAnswerMore}
            onDone={() => setOpen(false)}
          />
        ) : question ? (
          <AnswerCompatibilityQuestionContent
            key={question.id}
            index={questionCursor}
            total={sortedQuestions.length}
            question={question}
            user={user}
            onSubmit={finishRun}
            isLastQuestion={questionCursor === sortedQuestions.length - 1}
            onNext={() => {
              if (questionCursor === sortedQuestions.length - 1) {
                finishRun()
              } else {
                setQuestionIndex(questionCursor + 1)
              }
            }}
            sort={inCoreRun ? undefined : sort}
            setSort={inCoreRun ? undefined : setSort}
          />
        ) : null}
      </Col>
    </Modal>
  )
}
