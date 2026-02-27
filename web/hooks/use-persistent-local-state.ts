import {safeJsonParse} from 'common/util/json'
import {useEffect} from 'react'
import {useEvent} from 'web/hooks/use-event'
import {useIsClient} from 'web/hooks/use-is-client'
import {isFunction} from 'web/hooks/use-persistent-in-memory-state'
import {useStateCheckEquality} from 'web/hooks/use-state-check-equality'
import {safeLocalStorage} from 'web/lib/util/local'

type StoredEnvelope<T> = {
  value: T
  expiresAt: number | null // null = never expires
}

const wrapValue = <T>(value: T, ttlMs: number | null): StoredEnvelope<T> => ({
  value,
  expiresAt: ttlMs != null ? Date.now() + ttlMs : null,
})

const unwrapValue = <T>(envelope: unknown, fallback: T): {value: T; expired: boolean} => {
  if (envelope == null || typeof envelope !== 'object' || !('value' in envelope)) {
    return {value: fallback, expired: false}
  }

  const {value, expiresAt} = envelope as StoredEnvelope<T>

  if (expiresAt != null && Date.now() > expiresAt) {
    return {value: fallback, expired: true}
  }

  return {value, expired: false}
}

export const usePersistentLocalState = <T>(
  initialValue: T,
  key: string,
  ttl: number | null = null,
) => {
  // Note: use a version (like "-v1") in the key to increment after backwards-incompatible changes
  const isClient = useIsClient()

  const readFromStorage = (): T => {
    const raw = safeLocalStorage?.getItem(key)
    const parsed = safeJsonParse(raw)
    const {value, expired} = unwrapValue<T>(parsed, initialValue)
    if (expired) safeLocalStorage?.removeItem(key)
    return value
  }

  const [state, setState] = useStateCheckEquality<T>(isClient ? readFromStorage() : initialValue)

  const saveState = useEvent((newState: T | ((prevState: T) => T)) => {
    setState((prevState: T) => {
      const updatedState = isFunction(newState) ? newState(prevState) : newState
      safeLocalStorage?.setItem(key, JSON.stringify(wrapValue(updatedState, ttl)))
      return updatedState
    })
  })

  useEffect(() => {
    if (safeLocalStorage) {
      const raw = safeLocalStorage.getItem(key)
      const parsed = safeJsonParse(raw)
      const {value, expired} = unwrapValue<T>(parsed, initialValue)
      if (expired || (parsed === null && initialValue === undefined)) return
      saveState(value as T)
    }
  }, [key])

  return [state, saveState] as const
}
