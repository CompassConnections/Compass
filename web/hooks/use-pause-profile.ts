import {useState, useSyncExternalStore} from 'react'
import {useProfile} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {disableProfile} from 'web/lib/util/disable'

// What this session last set, shared by every control that pauses or resumes: the settings row, the
// offer inside the delete-account dialog and the notice on a paused profile can all be on screen
// together, and the cached own profile (`useProfile`) is not refetched after a write. Null until
// something here has written, at which point it wins over the cached row.
//
// It carries the id of the member who set it and only ever applies to that member. Without that, one
// person pausing and signing out left the next person to sign in on the same tab looking at a switch
// that said "paused" about a profile that was not.
let override: {userId: string; paused: boolean} | null = null
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Pausing a profile (`profiles.disabled`): nobody else can open it and it is out of search, while
 * conversations and everything written stay as they are, and the member can still use Compass.
 * Reversible at any time. The column and the API still say "disabled"; "pause" is the word members
 * see, because it is their own choice and a temporary one.
 */
export function usePauseProfile() {
  const profile = useProfile()
  const user = useUser()
  const stored = useSyncExternalStore(
    subscribe,
    () => override,
    () => null,
  )
  const current = stored && stored.userId === user?.id ? stored.paused : null
  const [busy, setBusy] = useState(false)

  const setPaused = async (paused: boolean) => {
    setBusy(true)
    try {
      await disableProfile(paused)
      if (user) override = {userId: user.id, paused}
      listeners.forEach((listener) => listener())
    } finally {
      setBusy(false)
    }
  }

  return {
    paused: current ?? !!profile?.disabled,
    setPaused,
    busy,
    /** False until the own profile has loaded, when the switch cannot yet say which way it is. */
    ready: profile !== undefined,
  }
}
