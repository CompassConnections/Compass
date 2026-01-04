import {User} from 'common/user'
import {QuestionWithCountType} from 'web/hooks/use-questions'
import {useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {AnswerCompatibilityQuestionContent} from './answer-compatibility-question-content'
import router from "next/router";
import Link from "next/link";
import {useT} from 'web/lib/locale'

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
        refreshCompatibilityAll={refreshCompatibilityAll}
        onClose={() => {
          if (fromSignup) router.push('/')
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
}) {
  const {user, skippedQuestions, refreshCompatibilityAll} = props
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
        refreshCompatibilityAll={refreshCompatibilityAll}
      />
    </>
  )
}

function AnswerCompatibilityQuestionModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  user: User
  otherQuestions: QuestionWithCountType[]
  refreshCompatibilityAll: () => void
  onClose?: () => void
}) {
  const {open, setOpen, user, otherQuestions, refreshCompatibilityAll, onClose} = props
  const [questionIndex, setQuestionIndex] = useState(0)
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      onClose={() => {
        refreshCompatibilityAll()
        setQuestionIndex(0)
        onClose?.()
      }}
    >
      <Col className={MODAL_CLASS}>
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
      </Col>
    </Modal>
  )
}
