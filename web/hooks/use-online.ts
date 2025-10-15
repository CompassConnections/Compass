import {useEffect} from 'react'
import {useProfile} from 'web/hooks/use-profile'
import {useIsAuthorized} from 'web/hooks/use-user'
import {api} from 'web/lib/api'

export const useOnline = () => {
  const profile = useProfile()
  const isAuthed = useIsAuthorized()
  useEffect(() => {
    if (!profile || !isAuthed) return
    void (async () => {
      const date = new Date().toISOString()
      // const result = await run(
      //   db
      //     .from('profiles')
      //     .update({ last_online_time: date })
      //     .eq('id', profile.id)
      // )
      api('set-last-online-time')
      // console.log('set last online time for', profile.id, date)
    })()
  }, [profile?.id, isAuthed])
}
