import clsx from 'clsx'
import {Row} from 'common/supabase/utils'
import {User} from 'common/user'
import {debounce} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {CompatibilityAnswerBlock} from 'web/components/answers/compatibility-questions-display'
import {Col} from 'web/components/layout/col'
import {UncontrolledTabs} from 'web/components/layout/tabs'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Input} from 'web/components/widgets/input'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Title} from 'web/components/widgets/title'
import {LoadMoreUntilNotVisible} from 'web/components/widgets/visibility-observer'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {
  useCompatibilityQuestionsWithAnswerCount,
  useUserCompatibilityAnswers,
} from 'web/hooks/use-questions'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {Question} from 'web/lib/supabase/questions'

type QuestionWithAnswer = Question & {
  answer?: Row<'compatibility_answers'>
  answer_count: number
  score: number
}

export default function CompatibilityPage() {
  const user = useUser()
  const isMobile = useIsMobile()
  const sep = isMobile ? '\n' : ''
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const {compatibilityAnswers, refreshCompatibilityAnswers} = useUserCompatibilityAnswers(user?.id)
  const {compatibilityQuestions, refreshCompatibilityQuestions, isLoading} =
    useCompatibilityQuestionsWithAnswerCount(debouncedKeyword || undefined)
  const t = useT()

  // Debounce keyword changes
  const debouncedSetKeyword = useMemo(
    () => debounce((value: string) => setDebouncedKeyword(value), 500),
    [],
  )

  useEffect(() => {
    debouncedSetKeyword(keyword)
    // Cleanup debounce on unmount
    return () => debouncedSetKeyword.cancel()
  }, [keyword, debouncedSetKeyword])

  const questionsWithAnswers = useMemo(() => {
    if (!compatibilityQuestions) return []

    const answerMap = new Map(compatibilityAnswers?.map((a) => [a.question_id, a]) ?? [])

    return compatibilityQuestions
      .map((q) => ({
        ...q,
        answer: answerMap.get(q.id),
      }))
      .sort((a, b) => a.importance_score - b.importance_score) as QuestionWithAnswer[]
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
      Promise.all([refreshCompatibilityAnswers(), refreshCompatibilityQuestions()]).finally(() =>
        console.log('refreshed compatibility'),
      )
    }
  }, [user?.id])

  const refreshCompatibilityAll = () => {
    refreshCompatibilityAnswers()
    refreshCompatibilityQuestions()
  }

  return (
    <PageBase trackPageView={'compatibility'}>
      <SEO
        title={t('compatibility.seo.title', 'Compatibility')}
        description={t(
          'compatibility.seo.description',
          'View and manage your compatibility questions',
        )}
        url={`/compatibility`}
      />
      {user ? (
        <Col className="w-full p-4">
          <Title className="mb-4">{t('compatibility.title', 'Your Compatibility Questions')}</Title>
          <Input
            ref={searchInputRef}
            value={keyword}
            placeholder={t('compatibility.search_placeholder', 'Search questions and answers...')}
            className={'w-full max-w-xs mb-4'}
            onChange={(e) => {
              setKeyword(e.target.value)
            }}
          />
          <UncontrolledTabs
            trackingName={'compatibility page'}
            name={'compatibility-page'}
            tabs={[
              {
                title: `${t('compatibility.tabs.answered', 'Answered')} ${sep}(${answered.length})`,
                content: (
                  <QuestionList
                    questions={answered}
                    status="answered"
                    isLoading={isLoading}
                    user={user}
                    refreshCompatibilityAll={refreshCompatibilityAll}
                    keyword={keyword}
                  />
                ),
              },
              {
                title: `${t('compatibility.tabs.to_answer', 'To Answer')} ${sep}(${notAnswered.length})`,
                content: (
                  <QuestionList
                    questions={notAnswered}
                    status="not-answered"
                    isLoading={isLoading}
                    user={user}
                    refreshCompatibilityAll={refreshCompatibilityAll}
                    keyword={keyword}
                  />
                ),
              },
              {
                title: `${t('compatibility.tabs.skipped', 'Skipped')} ${sep}(${skipped.length})`,
                content: (
                  <QuestionList
                    questions={skipped}
                    status="skipped"
                    isLoading={isLoading}
                    user={user}
                    refreshCompatibilityAll={refreshCompatibilityAll}
                    keyword={keyword}
                  />
                ),
              },
            ]}
          />
        </Col>
      ) : (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-xl">
            {t(
              'compatibility.sign_in_prompt',
              'Please sign in to view your compatibility questions',
            )}
          </div>
        </div>
      )}
    </PageBase>
  )
}

function QuestionList({
  questions,
  status,
  isLoading,
  user,
  refreshCompatibilityAll,
  keyword,
}: {
  questions: QuestionWithAnswer[]
  status: 'answered' | 'not-answered' | 'skipped'
  isLoading: boolean
  user: User
  refreshCompatibilityAll: () => void
  keyword: string
}) {
  const t = useT()
  const BATCH_SIZE = 100
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)

  // Reset pagination when the questions list changes (e.g., switching tabs or refreshed data)
  useEffect(() => {
    console.log('resetting pagination')
    setVisibleCount(BATCH_SIZE)
  }, [questions])

  const loadMore = useCallback(async () => {
    console.log('start loadMore')
    if (visibleCount >= questions.length) return false
    console.log('loading more', visibleCount)
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, questions.length))
    console.log('end loadMore')
    return true
  }, [visibleCount, questions.length])

  if (isLoading && questions.length === 0) {
    return <CompassLoadingIndicator />
  }

  if (!isLoading && questions.length === 0) {
    return (
      <div className="text-ink-500 p-4">
        {keyword ? (
          t('compatibility.empty.no_results', 'No results for "{keyword}"', {
            keyword,
          })
        ) : (
          <>
            {status === 'answered' &&
              t('compatibility.empty.answered', "You haven't answered any questions yet.")}
            {status === 'not-answered' &&
              t('compatibility.empty.not_answered', 'All questions have been answered!')}
            {status === 'skipped' &&
              t('compatibility.empty.skipped', "You haven't skipped any questions.")}
          </>
        )}
      </div>
    )
  }

  const visibleQuestions = questions.slice(0, visibleCount)

  return (
    <div className="space-y-4 p-2">
      {visibleQuestions.map((q) => (
        <div
          key={q.id}
          className={clsx(
            'bg-canvas-0 border-canvas-100 rounded-lg border px-2 pt-2 shadow-sm transition-colors',
            isLoading && 'animate-pulse opacity-80',
          )}
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
      <LoadMoreUntilNotVisible loadMore={loadMore} />
    </div>
  )
}
