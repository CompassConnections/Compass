import {debug} from 'common/logger'
import {
  getProfileRowWithFrontendSupabase,
  Profile,
  ProfileWithoutUser,
} from 'common/profiles/profile'
import {Row} from 'common/supabase/utils'
import {User} from 'common/user'
import {createContext, ReactNode, useContext, useEffect} from 'react'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {useUser} from 'web/hooks/use-user'
import {db} from 'web/lib/supabase/db'

type OwnProfile = (Row<'profiles'> & {user: User}) | null | undefined

const useOwnProfile = (): OwnProfile => {
  const user = useUser()
  const [profile, setProfile] = usePersistentLocalState<Row<'profiles'> | undefined | null>(
    undefined,
    `profile-${user?.id}`,
  )

  const refreshProfile = () => {
    if (!user?.id) return
    debug('Refreshing own profile for', user.username)
    getProfileRowWithFrontendSupabase(user.id, db).then((p) => {
      setProfile(p ?? null)
    })
  }

  useEffect(() => {
    refreshProfile()
  }, [user?.id])

  return user && profile ? {...profile, user} : profile === null ? null : undefined
}

const MISSING = Symbol('missing')

const ProfileContext = createContext<OwnProfile | typeof MISSING>(MISSING)

export const useProfile = () => {
  const ctx = useContext(ProfileContext)
  if (ctx === MISSING) throw new Error('useProfile must be used within a ProfileProvider')
  return ctx as OwnProfile
}

export const ProfileProvider = ({children}: {children: ReactNode}) => {
  const profile = useOwnProfile()
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
}

export const useProfileByUser = (user: User | undefined) => {
  const userId = user?.id
  const [profile, setProfile] = usePersistentInMemoryState<Profile | undefined | null>(
    undefined,
    `profile-user-${userId}`,
  )

  function refreshProfile() {
    if (userId) {
      // console.debug('Refreshing profile in useProfileByUser for', user?.username, profile);
      getProfileRowWithFrontendSupabase(userId, db)
        .then((profile) => {
          if (!profile) setProfile(null)
          else setProfile({...profile, user})
        })
        .catch((error) => {
          debug('Warning: profile not found', user?.username, error)
          setProfile(null)
          return
        })
      debug('End Refreshing profile for', user?.username, profile)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [userId])

  return {profile, refreshProfile}
}

export const useProfileByUserId = (userId: string | undefined) => {
  const [profile, setProfile] = usePersistentInMemoryState<ProfileWithoutUser | undefined | null>(
    undefined,
    `profile-${userId}`,
  )

  useEffect(() => {
    // console.debug('Refreshing profile in useProfileByUserId for', userId, profile);
    if (userId)
      getProfileRowWithFrontendSupabase(userId, db).then((profile) => {
        if (!profile) setProfile(null)
        else setProfile(profile)
      })
  }, [userId])

  return profile
}
