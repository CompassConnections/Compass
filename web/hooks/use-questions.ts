import { sortBy } from 'lodash'
import { useEffect, useState } from 'react'
import { Row } from 'common/supabase/utils'
import {
  getAllQuestions,
  getFRQuestionsWithAnswerCount,
  getFreeResponseQuestions,
  getUserAnswers,
  getUserCompatibilityAnswers,
} from 'web/lib/supabase/questions'
import { usePersistentInMemoryState } from 'web/hooks/use-persistent-in-memory-state'
import { api } from 'web/lib/api'

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
  const [answers, setAnswers] = usePersistentInMemoryState<
    Row<'compatibility_answers_free'>[]
  >([], `answers-${userId}`)

  useEffect(() => {
    if (userId) {
      getUserAnswers(userId).then(setAnswers)
    }
  }, [userId])

  async function refreshAnswers() {
    if (!userId) return
    getUserAnswers(userId).then(setAnswers)
  }

  return { refreshAnswers, answers }
}

export const useUserCompatibilityAnswers = (userId: string | undefined) => {
  const [compatibilityAnswers, setCompatibilityAnswers] =
    usePersistentInMemoryState<Row<'compatibility_answers'>[]>(
      [],
      `compatibility-answers-${userId}`
    )

  useEffect(() => {
    if (userId) {
      getUserCompatibilityAnswers(userId).then((answers) => {
        const sortedAnswers = sortBy(
          answers,
          (a) => -a.importance,
          (a) => (a.explanation ? 0 : 1)
        )
        setCompatibilityAnswers(sortedAnswers)
      })
    }
  }, [userId])

  async function refreshCompatibilityAnswers() {
    if (!userId) return
    getUserCompatibilityAnswers(userId).then(setCompatibilityAnswers)
  }

  return { refreshCompatibilityAnswers, compatibilityAnswers }
}

export type QuestionWithCountType = Row<'compatibility_prompts'> & {
  answer_count: number
  score: number
}

export const useFRQuestionsWithAnswerCount = () => {
  const [FRquestionsWithCount, setFRQuestionsWithCount] =
    usePersistentInMemoryState<any>([], `fr-questions-with-count`)

  useEffect(() => {
    getFRQuestionsWithAnswerCount().then((questions) => {
      setFRQuestionsWithCount(questions)
    })
  }, [])

  return FRquestionsWithCount as QuestionWithCountType[]
}

export const useCompatibilityQuestionsWithAnswerCount = () => {
  const [compatibilityQuestions, setCompatibilityQuestions] =
    usePersistentInMemoryState<QuestionWithCountType[]>(
      [],
      `compatibility-questions-with-count`
    )

  async function refreshCompatibilityQuestions() {
    return api('get-compatibility-questions', {}).then((res) => {
      setCompatibilityQuestions(res.questions)
    })
  }

  useEffect(() => {
    refreshCompatibilityQuestions()
  }, [])

  return {
    refreshCompatibilityQuestions,
    compatibilityQuestions,
  }
}
