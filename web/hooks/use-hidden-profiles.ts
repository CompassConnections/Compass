import React, {createContext, useContext, useEffect, useMemo} from 'react'
import {useUser} from 'web/hooks/use-user'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {api} from "web/lib/api";

type HiddenUser = {
  id: string
  name: string
  username: string
  avatarUrl?: string | null
  createdTime?: string
}

type HiddenProfilesContextType = {
  hiddenProfiles: HiddenUser[] | undefined | null
  refreshHiddenProfiles: () => void
}

const HiddenProfilesContext = createContext<HiddenProfilesContextType | undefined>(undefined)

export function HiddenProfilesProvider({children}: { children: React.ReactNode }) {
  const user = useUser()
  const storageKey = useMemo(() => `hidden-ids-${user?.id ?? 'anon'}`, [user?.id])
  const [hiddenProfiles, setHiddenProfiles] = usePersistentLocalState<
    HiddenUser[] | undefined | null
  >(undefined, storageKey)

  const refreshHiddenProfiles = () => {
    if (!user) return
    api('get-hidden-profiles', {limit: 200, offset: 0})
      .then((res) => {
        setHiddenProfiles(res.hidden)
      })
      .catch((e) => {
        console.error('Failed to load hidden profiles', e)
      })
  }

  useEffect(() => {
    // Load on user change
    refreshHiddenProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const value = useMemo(() => ({hiddenProfiles, refreshHiddenProfiles}), [hiddenProfiles])
  return React.createElement(HiddenProfilesContext.Provider, {value}, children as any)
}

// Hook remains the same name but now uses the shared context. If provider is missing,
// fall back to a local instance to avoid crashes (useful for tests or isolated renders).
export const useHiddenProfiles = () => {
  const ctx = useContext(HiddenProfilesContext)
  if (ctx) return ctx

  // Fallback local instance (no cross-component sync)
  const user = useUser()
  const [hiddenProfiles, setHiddenProfiles] = usePersistentLocalState<
    HiddenUser[] | undefined | null
  >(undefined, `hidden-ids-${user?.id ?? 'anon'}`)

  const refreshHiddenProfiles = () => {
    if (!user) return
    api('get-hidden-profiles', {limit: 200, offset: 0})
      .then((res) => setHiddenProfiles(res.hidden))
      .catch((e) => console.error('Failed to load hidden profiles', e))
  }

  useEffect(() => {
    refreshHiddenProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return {hiddenProfiles, refreshHiddenProfiles}
}
