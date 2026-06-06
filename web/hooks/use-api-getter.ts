import {APIParams, APIPath, APIResponse} from 'common/api/schema'
import {APIError} from 'common/api/utils'
import {debug} from 'common/logger'
import {useEffect} from 'react'
import {api} from 'web/lib/api'

import {useEvent} from './use-event'
import {usePersistentInMemoryState} from './use-persistent-in-memory-state'

const promiseCache: Record<string, Promise<any> | undefined> = {}

export const useAPIGetter = <P extends APIPath>(
  path: P,
  props: APIParams<P> | undefined,
  ignoreDependencies?: string[],
) => {
  const propsStringToTriggerRefresh = JSON.stringify(
    deepCopyWithoutKeys(props, ignoreDependencies || []),
  )

  // Key caching and in-flight dedup on the dependency-filtered props so that
  // instances differing only in ignored deps (e.g. a volatile `lastUpdatedTime`)
  // share one cache bucket and one in-flight request instead of each firing
  // their own. The request itself still sends the full current `props`.
  const [data, setData] = usePersistentInMemoryState<APIResponse<P> | undefined>(
    undefined,
    `${path}-${propsStringToTriggerRefresh}`,
  )

  const key = `${path}-${propsStringToTriggerRefresh}-error`
  const [error, setError] = usePersistentInMemoryState<APIError | undefined>(undefined, key)

  const refresh = useEvent(async () => {
    if (!props) return

    const cachedPromise = promiseCache[key]
    if (cachedPromise) {
      await cachedPromise.then(setData).catch(setError)
    } else {
      debug('useAPIGetter use refresh')
      const promise = api(path, props)
      promiseCache[key] = promise
      await promise.then(setData).catch(setError)
      promiseCache[key] = undefined
    }
  })

  useEffect(() => {
    refresh()
  }, [propsStringToTriggerRefresh])

  return {data, error, refresh}
}

function deepCopyWithoutKeys(obj: any, keysToRemove: string[]): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => deepCopyWithoutKeys(item, keysToRemove))
  }

  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {}
    for (const key in obj) {
      if (!keysToRemove.includes(key)) {
        newObj[key] = deepCopyWithoutKeys(obj[key], keysToRemove)
      }
    }
    return newObj
  }

  return obj
}
