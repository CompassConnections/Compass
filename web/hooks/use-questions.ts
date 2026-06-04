import {QuestionWithStats} from 'common/api/types'
import {debug} from 'common/logger'
import {Row} from 'common/supabase/utils'
import {partition, sortBy} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {api} from 'web/lib/api'
import {useLocale} from 'web/lib/locale'
import {
  getAllQuestions,
  getFreeResponseQuestions,
  getFRQuestionsWithAnswerCount,
  getUserAnswers,
  getUserCompatibilityAnswers,
} from 'web/lib/supabase/questions'

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Row<'compatibility_prompts'>[]>([])
  useEffect(() => {
    getAllQuestions().then(setQuestions)
  }, [])
  return questions
}

export const useFreeResponseQuestions = () => {
  const [questions, setQuestions] = useState<Row<'compatibility_prompts'>[]>([])
  useEffect(() => {
    getFreeResponseQuestions().then(setQuestions)
  }, [])
  return questions
}

export const useUserAnswers = (userId: string | undefined) => {
  const [answers, setAnswers] = usePersistentInMemoryState<Row<'compatibility_answers_free'>[]>(
    [],
    `answers-${userId}`,
  )

  useEffect(() => {
    if (userId) {
      getUserAnswers(userId).then(setAnswers)
    }
  }, [userId])

  async function refreshAnswers() {
    if (!userId) return
    getUserAnswers(userId).then(setAnswers)
  }

  return {refreshAnswers, answers}
}

export const useUserCompatibilityAnswers = (userId: string | undefined) => {
  const [compatibilityAnswers, setCompatibilityAnswers] = usePersistentInMemoryState<
    Row<'compatibility_answers'>[]
  >([], `compatibility-answers-${userId}`)

  useEffect(() => {
    if (userId) {
      getUserCompatibilityAnswers(userId).then((answers) => {
        const sortedAnswers = sortBy(
          answers,
          (a) => -a.importance,
          (a) => (a.explanation ? 0 : 1),
        )
        setCompatibilityAnswers(sortedAnswers)
      })
    }
  }, [userId])

  async function refreshCompatibilityAnswers() {
    if (!userId) return
    getUserCompatibilityAnswers(userId).then(setCompatibilityAnswers)
  }

  return {refreshCompatibilityAnswers, compatibilityAnswers}
}

export const useFRQuestionsWithAnswerCount = () => {
  const [FRquestionsWithCount, setFRQuestionsWithCount] = usePersistentInMemoryState<any>(
    [],
    `fr-questions-with-count`,
  )

  useEffect(() => {
    getFRQuestionsWithAnswerCount().then((questions) => {
      setFRQuestionsWithCount(questions)
    })
  }, [])

  return FRquestionsWithCount as QuestionWithStats[]
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
