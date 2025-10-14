import { useEffect } from 'react'
import { db } from 'web/lib/supabase/db'
import { run } from 'common/supabase/utils'
import { usePersistentInMemoryState } from 'web/hooks/use-persistent-in-memory-state'
import { UserActivity } from 'common/user'

export function useUserActivity(userId: string | undefined) {
  const [userActivity, setUserActivity] = usePersistentInMemoryState<
    UserActivity | undefined
  >(undefined, `user-activity-${userId ?? 'none'}`)

  const refresh = async () => {
    if (!userId) return
    const { data } = await run(
      db.from('user_activity')
        .select('*')
        .eq('user_id', userId).limit(1).single()
    )
    if (data) setUserActivity(data as unknown as UserActivity)
  }

  useEffect(() => {
    refresh().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { data: userActivity, refresh }
}
