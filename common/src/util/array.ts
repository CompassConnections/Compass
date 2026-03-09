import {compact, flattenDeep, isEqual} from 'lodash'

export const arrify = <T>(maybeArr: T | T[]) => (Array.isArray(maybeArr) ? maybeArr : [maybeArr])

export function filterDefined<T>(array: (T | null | undefined)[]) {
  return array.filter((item) => item !== null && item !== undefined) as T[]
}

type Falsey = false | undefined | null | 0 | ''
type FalseyValueArray<T> = T | Falsey | FalseyValueArray<T>[]

export function buildArray<T>(...params: FalseyValueArray<T>[]) {
  return compact(flattenDeep(params)) as T[]
}

export function groupConsecutive<T, U>(xs: T[], key: (x: T) => U) {
  if (!xs.length) {
    return []
  }
  const result = []
  let curr = {key: key(xs[0]), items: [xs[0]]}
  for (const x of xs.slice(1)) {
    const k = key(x)
    if (!isEqual(k, curr.key)) {
      result.push(curr)
      curr = {key: k, items: [x]}
    } else {
      curr.items.push(x)
    }
  }
  result.push(curr)
  return result
}

export function undefineEmpty<T>(array: T[]): T[] | undefined {
  // Undefine a list if empty ([])
  return fallbackIfEmpty(array, undefined)
}

export function nullifyEmpty<T>(array: T[]): T[] | null {
  // Nullify a list if empty ([])
  return fallbackIfEmpty(array, null)
}

export function fallbackIfEmpty<T>(array: T[], fallback: any) {
  // Fallback a list if empty ([])
  if (!Array.isArray(array)) return fallback
  return array.length > 0 ? array : fallback
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array] // copy to avoid mutating the original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
