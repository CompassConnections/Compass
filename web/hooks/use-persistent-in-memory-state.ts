import {safeJsonParse} from 'common/util/json'
import {useEffect} from 'react'
import {useEvent} from 'web/hooks/use-event'

import {useStateCheckEquality} from './use-state-check-equality'

const store: {[key: string]: any} = {}
export function isFunction<T>(value: T | ((prevState: T) => T)): value is (prevState: T) => T {
  return typeof value === 'function'
}
export const usePersistentInMemoryState = <T>(initialValue: T, key: string) => {
  const [state, setState] = useStateCheckEquality<T>(safeJsonParse(store[key]) ?? initialValue)

  useEffect(() => {
    const storedValue = safeJsonParse(store[key]) ?? initialValue
    setState(storedValue as T)
  }, [key])

  const saveState = useEvent((newState: T | ((prevState: T) => T)) => {
    setState((prevState) => {
      const updatedState = isFunction(newState) ? newState(prevState) : newState
      store[key] = JSON.stringify(updatedState)
      return updatedState
    })
  })

  return [state, saveState] as const
}

/**
 * Edits a cached entry from outside React, for the case where one route invalidates state that
 * another route owns — blocking someone from their profile page, say, while the browse grid holds a
 * result set that still contains them and would hand it straight back on remount.
 *
 * Returning `undefined` drops the entry, so the next mount starts from the hook's `initialValue`.
 * Components that are currently mounted are *not* re-rendered: the point of this is to fix up a
 * cache whose owner is unmounted, and adding a subscription would silently start syncing every
 * component that shares a key.
 */
export const updatePersistentInMemoryState = <T>(
  key: string,
  update: (prevState: T | undefined) => T | undefined,
) => {
  const updatedState = update((safeJsonParse(store[key]) ?? undefined) as T | undefined)
  if (updatedState === undefined) delete store[key]
  else store[key] = JSON.stringify(updatedState)
}
