import {useUser} from 'web/hooks/use-user'
import {useEffect} from 'react'
import {Row} from 'common/supabase/utils'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {User} from 'common/user'
import {getProfileRow, Profile, ProfileRow} from 'common/love/lover'
import {db} from 'web/lib/supabase/db'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'

export const useProfile = () => {
  const user = useUser()
  const [lover, setProfile] = usePersistentLocalState<
    Row<'profiles'> | undefined | null
  >(undefined, `lover-${user?.id}`)

  const refreshProfile = () => {
    if (user) {
      console.log('Refreshing lover in useProfile for', user?.username, lover);
      getProfileRow(user.id, db).then((lover) => {
        if (!lover) setProfile(null)
        else setProfile(lover)
      })
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [user?.id])

  return user && lover ? {...lover, user} : lover === null ? null : undefined
}

export const useProfileByUser = (user: User | undefined) => {
  const userId = user?.id
  const [lover, setProfile] = usePersistentInMemoryState<
    Profile | undefined | null
  >(undefined, `lover-user-${userId}`)

  function refreshProfile() {
    if (userId) {
      console.log('Refreshing lover in useProfileByUser for', user?.username, lover);
      getProfileRow(userId, db)
        .then((lover) => {
          if (!lover) setProfile(null)
          else setProfile({...lover, user})
        })
        .catch(error => {
          console.log('Warning: lover not found', user?.username, error);
          setProfile(null)
          return
        });
      console.log('End Refreshing lover for', user?.username, lover);
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [userId])

  return {lover, refreshProfile}
}

export const useProfileByUserId = (userId: string | undefined) => {
  const [lover, setProfile] = usePersistentInMemoryState<
    ProfileRow | undefined | null
  >(undefined, `lover-${userId}`)

  useEffect(() => {
    console.log('Refreshing lover in useProfileByUserId for', userId, lover);
    if (userId)
      getProfileRow(userId, db).then((lover) => {
        if (!lover) setProfile(null)
        else setProfile(lover)
      })
  }, [userId])

  return lover
}
