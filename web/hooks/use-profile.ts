import {useUser} from 'web/hooks/use-user'
import {useEffect} from 'react'
import {Row} from 'common/supabase/utils'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {User} from 'common/user'
import {getProfileRow, Profile, ProfileRow} from 'common/love/profile'
import {db} from 'web/lib/supabase/db'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'

export const useProfile = () => {
  const user = useUser()
  const [profile, setProfile] = usePersistentLocalState<
    Row<'profiles'> | undefined | null
  >(undefined, `profile-${user?.id}`)

  const refreshProfile = () => {
    if (user) {
      console.debug('Refreshing profile in useProfile for', user?.username, profile);
      getProfileRow(user.id, db).then((profile) => {
        if (!profile) setProfile(null)
        else setProfile(profile)
      })
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [user?.id])

  return user && profile ? {...profile, user} : profile === null ? null : undefined
}

export const useProfileByUser = (user: User | undefined) => {
  const userId = user?.id
  const [profile, setProfile] = usePersistentInMemoryState<
    Profile | undefined | null
  >(undefined, `profile-user-${userId}`)

  function refreshProfile() {
    if (userId) {
      console.debug('Refreshing profile in useProfileByUser for', user?.username, profile);
      getProfileRow(userId, db)
        .then((profile) => {
          if (!profile) setProfile(null)
          else setProfile({...profile, user})
        })
        .catch(error => {
          console.debug('Warning: profile not found', user?.username, error);
          setProfile(null)
          return
        });
      console.debug('End Refreshing profile for', user?.username, profile);
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [userId])

  return {profile, refreshProfile}
}

export const useProfileByUserId = (userId: string | undefined) => {
  const [profile, setProfile] = usePersistentInMemoryState<
    ProfileRow | undefined | null
  >(undefined, `profile-${userId}`)

  useEffect(() => {
    console.debug('Refreshing profile in useProfileByUserId for', userId, profile);
    if (userId)
      getProfileRow(userId, db).then((profile) => {
        if (!profile) setProfile(null)
        else setProfile(profile)
      })
  }, [userId])

  return profile
}
