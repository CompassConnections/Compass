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
    const {data} = await run(
      db.from('user_activity').select('*').eq('user_id', userId).limit(1).single(),
    )
    if (data) setUserActivity(data as unknown as UserActivity)
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [userId])

  return {data: userActivity, refresh}
}
