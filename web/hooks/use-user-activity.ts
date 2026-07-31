import {run} from 'common/supabase/utils'
import {UserActivity} from 'common/user'
import {useEffect} from 'react'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {db} from 'web/lib/supabase/db'

export function useUserActivity(userId: string | undefined) {
  const [userActivity, setUserActivity] = usePersistentInMemoryState<UserActivity | undefined>(
    undefined,
    `user-activity-${userId ?? 'none'}`,
  )

  const refresh = async () => {
    if (!userId) return
    // Direct SELECT on user_activity is revoked from the anon/authenticated roles; read the single row
    // through the capped get_user_activity() SECURITY DEFINER function.
    const {data} = await run(db.rpc('get_user_activity' as any, {uid: userId}))
    const activity = (data as any[])?.[0]
    if (activity) setUserActivity(activity as unknown as UserActivity)
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [userId])

  return {data: userActivity, refresh}
}
