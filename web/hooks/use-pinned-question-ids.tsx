import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react'
import {api} from 'web/lib/api'

const PinnedQuestionIdsContext = createContext<{
  pinnedQuestionIds: number[] | undefined
  setPinnedQuestionIds: (ids: number[]) => void
  refreshPinnedQuestionIds: () => void
} | null>(null)

export function PinnedQuestionIdsProvider({children}: {children: ReactNode}) {
  const [pinnedQuestionIds, setPinnedQuestionIds] = useState<number[] | undefined>(undefined)

  const refreshPinnedQuestionIds = useCallback(() => {
    api('get-pinned-compatibility-questions').then((res) => {
      setPinnedQuestionIds(res.pinnedQuestionIds ?? [])
    })
  }, [])

  useEffect(() => {
    refreshPinnedQuestionIds()
  }, [])

  return (
    <PinnedQuestionIdsContext.Provider
      value={{pinnedQuestionIds, setPinnedQuestionIds, refreshPinnedQuestionIds}}
    >
      {children}
    </PinnedQuestionIdsContext.Provider>
  )
}

export function usePinnedQuestionIds() {
  const ctx = useContext(PinnedQuestionIdsContext)
  if (!ctx) throw new Error('usePinnedQuestionIds must be used within PinnedQuestionIdsProvider')
  return ctx
}
