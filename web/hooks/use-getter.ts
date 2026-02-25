import {useEffect} from 'react'

import {useEvent} from './use-event'
import {usePersistentInMemoryState} from './use-persistent-in-memory-state'

const promiseCache: Record<string, Promise<any> | undefined> = {}

export const useGetter = <P, R>(
  key: string,
  props: P | undefined,
  getter: (params: P) => Promise<R>,
) => {
  const propsString = JSON.stringify(props)

  const fullKey = `getter-${key}-${propsString}`
  const [data, setData] = usePersistentInMemoryState<R | undefined>(undefined, fullKey)

  const refresh = useEvent(async () => {
    if (props === undefined) return
    let data: any
    if (promiseCache[fullKey]) {
      data = await promiseCache[fullKey]
    } else {
      const promise = getter(props)
      promiseCache[fullKey] = promise
      data = await promise
      promiseCache[fullKey] = undefined
    }
    setData(data)
  })

  useEffect(() => {
    refresh()
  }, [propsString])

  return {data, refresh}
}
