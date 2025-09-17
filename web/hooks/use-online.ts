import { useEffect } from 'react'
import { useProfile } from 'web/hooks/use-lover'
import { useIsAuthorized } from 'web/hooks/use-user'
import { run } from 'common/supabase/utils'
import { db } from 'web/lib/supabase/db'
export const useOnline = () => {
  const lover = useProfile()
  const isAuthed = useIsAuthorized()
  useEffect(() => {
    if (!lover || !isAuthed) return
    run(
      db
        .from('profiles')
        .update({ last_online_time: new Date().toISOString() })
        .eq('id', lover.id)
    )
  }, [])
}
