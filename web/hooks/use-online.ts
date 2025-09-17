import { useEffect } from 'react'
import { useProfile } from 'web/hooks/use-profile'
import { useIsAuthorized } from 'web/hooks/use-user'
import { run } from 'common/supabase/utils'
import { db } from 'web/lib/supabase/db'
export const useOnline = () => {
  const profile = useProfile()
  const isAuthed = useIsAuthorized()
  useEffect(() => {
    if (!profile || !isAuthed) return
    run(
      db
        .from('profiles')
        .update({ last_online_time: new Date().toISOString() })
        .eq('id', profile.id)
    )
  }, [])
}
