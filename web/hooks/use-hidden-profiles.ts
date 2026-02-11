import {useUser} from 'web/hooks/use-user'
import {useEffect} from 'react'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {api} from "web/lib/api";

type HiddenUser = {
  id: string
  name: string
  username: string
  avatarUrl?: string | null
  createdTime?: string
}

export const useHiddenProfiles = () => {
  const user = useUser()
  const [hiddenProfiles, setHiddenProfiles] = usePersistentLocalState<
    HiddenUser[] | undefined | null
  >(undefined, `hidden-ids-${user?.id}`)

  const refreshHiddenProfiles = () => {
    if (user) {
      api('get-hidden-profiles', {limit: 200, offset: 0})
        .then((res) => {
          setHiddenProfiles(res.hidden)
        })
        .catch((e) => {
          console.error('Failed to load hidden profiles', e)
        })
    }
  }

  useEffect(() => {
    refreshHiddenProfiles()
  }, [user?.id])

  return {hiddenProfiles, refreshHiddenProfiles}
}
