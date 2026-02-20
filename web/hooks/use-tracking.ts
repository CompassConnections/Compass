import {useEffect} from 'react'
import {track} from 'web/lib/service/analytics'
import {inIframe} from './use-is-iframe'
import {useIsAuthorized, useUser} from './use-user'

export const useTracking = (
  eventName: string,
  eventProperties?: any,
  excludeIframe?: boolean,
  extraDeps?: any[],
) => {
  const isAuthed = useIsAuthorized()
  const user = useUser()
  useEffect(() => {
    if (isAuthed === undefined) return
    if (excludeIframe && inIframe()) return
    track(eventName, {...eventProperties, userId: user?.id})
  }, [isAuthed, eventName, excludeIframe, ...(extraDeps ?? [])])
}
