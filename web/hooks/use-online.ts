import { useEffect } from 'react'
import { useLover } from 'web/hooks/use-lover'
import { useIsAuthorized } from 'web/hooks/use-user'
import { run } from 'common/supabase/utils'
import { db } from 'web/lib/supabase/db'
export const useOnline = () => {
  const lover = useLover()
  const isAuthed = useIsAuthorized()
  useEffect(() => {
    if (!lover || !isAuthed) return
    run(
      db
        .from('lovers')
        .update({ last_online_time: new Date().toISOString() })
        .eq('id', lover.id)
    )
  }, [])
}
