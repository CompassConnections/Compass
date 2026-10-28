import {QuestionWithStats} from 'common/api/types'
import {debug} from 'common/logger'
import {Row} from 'common/supabase/utils'
import {partition, sortBy} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useIsAuthorized} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useLocale} from 'web/lib/locale'
import {getAllQuestions} from 'web/lib/supabase/questions'

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Row<'compatibility_prompts'>[]>([])
  useEffect(() => {
    getAllQuestions().then(setQuestions)
  }, [])
  return questions
}

export const useUserCompatibilityAnswers = (userId: string | undefined) => {
  // `get-profile-answers` needs a signed-in caller, so there is nothing to ask until the auth state
  // has settled and says there is one. Asking earlier would have `api()` log an error and poll for a
  // user who, on a signed-out profile view, never arrives. The endpoint decides what this viewer may
  // see of someone else's answers; a profile they may not see comes back empty.
  const authorized = useIsAuthorized()
  const {data, refresh} = useAPIGetter(
    'get-profile-answers',
    authorized && userId ? {userId} : undefined,
  )

  const compatibilityAnswers = useMemo(
    () =>
      sortBy(
        data?.answers ?? [],
        (a) => -a.importance,
        (a) => (a.explanation ? 0 : 1),
      ),
    [data],
  )

  return {refreshCompatibilityAnswers: refresh, compatibilityAnswers}
}

export const useCompatibilityQuestionsWithAnswerCount = () => {
  const {locale} = useLocale()
  const firebaseUser = useFirebaseUser()
  const [compatibilityQuestions, setCompatibilityQuestions] = usePersistentInMemoryState<
    QuestionWithStats[]
  >([], `compatibility-questions-with-count`)
  const [isLoading, setIsLoading] = useState(true)

  async function refreshCompatibilityQuestions() {
    if (!firebaseUser) return
    setIsLoading(true)
    return api('get-compatibility-questions', {locale}).then((res) => {
      setCompatibilityQuestions(res.questions)
      setIsLoading(false)
    })
  }

  useEffect(() => {
    refreshCompatibilityQuestions()
  }, [firebaseUser, locale])

  return {
    refreshCompatibilityQuestions,
    compatibilityQuestions,
    isLoading,
  }
}

export function separateQuestionsArray(
  questions: QuestionWithStats[],
  skippedAnswerQuestionIds: Set<number>,
  answeredQuestionIds: Set<number>,
) {
  debug('Refreshing questions array')
  const skippedQuestions: QuestionWithStats[] = []
  const answeredQuestions: QuestionWithStats[] = []
  const otherQuestions: QuestionWithStats[] = []

  questions.forEach((q) => {
    if (skippedAnswerQuestionIds.has(q.id)) {
      skippedQuestions.push(q)
    } else if (answeredQuestionIds.has(q.id)) {
      answeredQuestions.push(q)
    } else {
      otherQuestions.push(q)
    }
  })

  return {skippedQuestions, answeredQuestions, otherQuestions}
}

// Single source of truth for a user's compatibility answers split into
// answered / skipped / other groups. Both the display component and the
// profile-card visibility check read this (shared in-memory cache, no refetch).
export const useCompatibilityQuestionGroups = (userId: string | undefined) => {
  const {refreshCompatibilityAnswers, compatibilityAnswers} = useUserCompatibilityAnswers(userId)
  const {refreshCompatibilityQuestions, compatibilityQuestions} =
    useCompatibilityQuestionsWithAnswerCount()

  const groups = useMemo(() => {
    debug('Refreshing questions')
    const [skippedAnswers, answers] = partition(
      compatibilityAnswers,
      (answer) => answer.importance == -1,
    )
    return {
      answers,
      ...separateQuestionsArray(
        compatibilityQuestions,
        new Set(skippedAnswers.map((answer) => answer.question_id)),
        new Set(answers.map((answer) => answer.question_id)),
      ),
    }
  }, [compatibilityAnswers, compatibilityQuestions])

  return {
    ...groups,
    compatibilityQuestions,
    refreshCompatibilityAnswers,
    refreshCompatibilityQuestions,
  }
}
