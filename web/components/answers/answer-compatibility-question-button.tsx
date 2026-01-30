import {User} from 'common/user'
import {QuestionWithCountType} from 'web/hooks/use-questions'
import {useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {AnswerCompatibilityQuestionContent} from './answer-compatibility-question-content'
import router from "next/router";
import Link from "next/link";
import {useT} from 'web/lib/locale'
import clsx from "clsx";

export function AnswerCompatibilityQuestionButton(props: {
  user: User | null | undefined
  otherQuestions: QuestionWithCountType[]
  refreshCompatibilityAll: () => void
  fromSignup?: boolean
  size?: 'sm' | 'md'
}) {
  const {
    user,
    otherQuestions,
    refreshCompatibilityAll,
    fromSignup,
    size = 'md',
  } = props
  const [open, setOpen] = useState(fromSignup ?? false)
  const t = useT()
  if (!user) return null
  if (otherQuestions.length === 0) return null
  const isCore = otherQuestions.some((q) => q.importance_score === 0)
  const questionsToAnswer = isCore ? otherQuestions.filter((q) => q.importance_score === 0) : otherQuestions
  return (
    <>
      {size === 'md' ? (
        <Button onClick={() => setOpen(true)} color="none" className={'px-3 py-2 rounded-md border border-primary-600 text-ink-700 hover:bg-primary-50 hover:text-ink-900'}>
          {t('answers.answer.cta', 'Answer{core} Questions', { core: isCore ? ' Core' : '' })}{' '}
          <span className="text-primary-600 ml-2">
            +{questionsToAnswer.length}
          </span>
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-ink-100 dark:bg-ink-300 text-ink-1000 hover:bg-ink-200 hover:dark:bg-ink-400 w-28 rounded-full px-2 py-0.5 text-xs transition-colors"
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
      className="px-3 py-2 rounded-md border border-primary-600 text-ink-700 hover:bg-primary-50 flex items-center justify-center text-center"
    >{t('answers.answer.view_list', 'View List of Questions')}</Link>
  )
}

export function AnswerSkippedCompatibilityQuestionsButton(props: {
  user: User | null | undefined
  skippedQuestions: QuestionWithCountType[]
  refreshCompatibilityAll: () => void
  fromSignup?: boolean
}) {
  const {user, skippedQuestions, refreshCompatibilityAll, fromSignup} = props
  const [open, setOpen] = useState(false)
  const t = useT()
  if (!user) return null
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-ink-500 text-sm hover:underline"
      >
        {t('answers.answer.answer_skipped', 'Answer {n} skipped questions', { n: String(skippedQuestions.length) })}{' '}
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

function CompatibilityOnboardingScreen({onNext, onSkip}: { onNext: () => void; onSkip: () => void }) {
  const t = useT()

  return (
    <Col className={clsx(SCROLLABLE_MODAL_CLASS, "max-w-2xl mx-auto text-center px-6")}>
      <h1 className="text-4xl font-bold text-ink-900 mb-6">
        {t('compatibility.onboarding.title', 'See who you\'ll actually align with')}
      </h1>

      <div className="text-lg text-ink-700 leading-relaxed mb-8 space-y-4">
        <p>
          {t('compatibility.onboarding.body1', 'Answer a few short questions to calculate compatibility based on values and preferences — not photos or swipes.')}
        </p>
        <p>
          {t('compatibility.onboarding.body2', 'Your answers directly affect who matches with you and how strongly.')}
        </p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-8">
        <p className="text-primary-800 font-medium">
          {t('compatibility.onboarding.impact', 'Most people who answer at least 5 questions see far more relevant matches.')}
        </p>
      </div>

      <Col className="gap-4">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full max-w-xs mx-auto"
        >
          {t('compatibility.onboarding.start', 'Start answering')}
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-ink-500 hover:text-ink-700 underline"
        >
          {t('compatibility.onboarding.later', 'Do this later')}
        </button>
      </Col>
    </Col>
  )
}

function AnswerCompatibilityQuestionModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  user: User
  otherQuestions: QuestionWithCountType[]
  refreshCompatibilityAll: () => void
  onClose?: () => void
  fromSignup?: boolean
}) {
  const {open, setOpen, user, otherQuestions, refreshCompatibilityAll, onClose, fromSignup} = props
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(fromSignup ?? false)

  const handleStartQuestions = () => {
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
      <Col className={MODAL_CLASS}>
        {showOnboarding ? (
          <CompatibilityOnboardingScreen
            onNext={handleStartQuestions}
            onSkip={handleSkipOnboarding}
          />
        ) : (
          <AnswerCompatibilityQuestionContent
            key={otherQuestions[questionIndex].id}
            index={questionIndex}
            total={otherQuestions.length}
            compatibilityQuestion={otherQuestions[questionIndex]}
            user={user}
            onSubmit={() => {
              setOpen(false)
            }}
            isLastQuestion={questionIndex === otherQuestions.length - 1}
            onNext={() => {
              if (questionIndex === otherQuestions.length - 1) {
                setOpen(false)
              } else {
                setQuestionIndex(questionIndex + 1)
              }
            }}
          />
        )}
      </Col>
    </Modal>
  )
}
