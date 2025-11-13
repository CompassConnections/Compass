import {useUser} from 'web/hooks/use-user'
import {useCompatibilityQuestionsWithAnswerCount, useUserCompatibilityAnswers} from 'web/hooks/use-questions'
import {useEffect, useMemo, useState} from 'react'
import {Row} from 'common/supabase/utils'
import {Question} from 'web/lib/supabase/questions'
import {Col} from 'web/components/layout/col'
import {Title} from 'web/components/widgets/title'
import {PageBase} from "web/components/page-base";
import {UncontrolledTabs} from "web/components/layout/tabs";
import {CompatibilityAnswerBlock} from "web/components/answers/compatibility-questions-display";
import {User} from "common/user";
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import {useIsMobile} from "web/hooks/use-is-mobile";

type QuestionWithAnswer = Question & {
  answer?: Row<'compatibility_answers'>
  answer_count: number
  score: number
}

export default function CompatibilityPage() {
  const user = useUser()
  const isMobile = useIsMobile()
  const sep = isMobile ? '\n' : ''
  const {compatibilityAnswers, refreshCompatibilityAnswers} =
    useUserCompatibilityAnswers(user?.id)
  const {compatibilityQuestions, refreshCompatibilityQuestions} =
    useCompatibilityQuestionsWithAnswerCount()
  const [isLoading, setIsLoading] = useState(true)

  const questionsWithAnswers = useMemo(() => {
    if (!compatibilityQuestions) return []

    const answerMap = new Map(
      compatibilityAnswers?.map((a) => [a.question_id, a]) ?? []
    )

    return compatibilityQuestions.map((q) => ({
      ...q,
      answer: answerMap.get(q.id),
    })).sort(
      (a, b) => a.importance_score - b.importance_score
    ) as QuestionWithAnswer[]
  }, [compatibilityQuestions, compatibilityAnswers])

  const {answered, notAnswered, skipped} = useMemo(() => {
    const answered: QuestionWithAnswer[] = []
    const notAnswered: QuestionWithAnswer[] = []
    const skipped: QuestionWithAnswer[] = []

    questionsWithAnswers.forEach((q) => {
      if (q.answer) {
        if (q.answer.multiple_choice === -1) {
          skipped.push(q)
        } else {
          answered.push(q)
        }
      } else {
        notAnswered.push(q)
      }
    })

    return {answered, notAnswered, skipped}
  }, [questionsWithAnswers])

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        refreshCompatibilityAnswers(),
        refreshCompatibilityQuestions(),
      ]).finally(() => setIsLoading(false))
    }
  }, [user?.id])

  const refreshCompatibilityAll = () => {
    refreshCompatibilityAnswers()
    refreshCompatibilityQuestions()
  }

  if (!user) {
    return (
      <PageBase trackPageView={'compatibility'}>
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-xl">Please sign in to view your compatibility questions</div>
        </div>
      </PageBase>
    )
  }

  return (
    <PageBase trackPageView={'compatibility'}>
      <Col className="w-full p-4">
        <Title className="mb-4">Your Compatibility Questions</Title>
        <UncontrolledTabs
          trackingName={'compatibility page'}
          tabs={[
            {
              title: `Answered ${sep}(${answered.length})`,
              content: (
                <QuestionList
                  questions={answered}
                  status="answered"
                  isLoading={isLoading}
                  user={user}
                  refreshCompatibilityAll={refreshCompatibilityAll}
                />
              ),
            },
            {
              title: `To Answer ${sep}(${notAnswered.length})`,
              content: (
                <QuestionList
                  questions={notAnswered}
                  status="not-answered"
                  isLoading={isLoading}
                  user={user}
                  refreshCompatibilityAll={refreshCompatibilityAll}
                />
              ),
            },
            {
              title: `Skipped ${sep}(${skipped.length})`,
              content: (
                <QuestionList
                  questions={skipped}
                  status="skipped"
                  isLoading={isLoading}
                  user={user}
                  refreshCompatibilityAll={refreshCompatibilityAll}
                />
              ),
            },
          ]}
        />
      </Col>
    </PageBase>
  )
}

function QuestionList({
                        questions,
                        status,
                        isLoading,
                        user,
                        refreshCompatibilityAll,
                      }: {
  questions: QuestionWithAnswer[]
  status: 'answered' | 'not-answered' | 'skipped'
  isLoading: boolean
  user: User
  refreshCompatibilityAll: () => void
}) {
  if (isLoading) {
    return <CompassLoadingIndicator/>
  }

  if (questions.length === 0) {
    return (
      <div className="text-ink-500 p-4">
        {status === 'answered' && 'You haven\'t answered any questions yet.'}
        {status === 'not-answered' && 'All questions have been answered!'}
        {status === 'skipped' && 'You haven\'t skipped any questions.'}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-2">
      {questions.map((q) => (
        <div
          key={q.id}
          className="bg-canvas-0 border-canvas-100 rounded-lg border px-2 pt-2 shadow-sm transition-colors"
        >
          <CompatibilityAnswerBlock
            key={q.answer?.question_id}
            question={q}
            answer={q.answer}
            yourQuestions={questions}
            user={user}
            isCurrentUser={true}
            refreshCompatibilityAll={refreshCompatibilityAll}
          />
        </div>
      ))}
    </div>
  )
}
