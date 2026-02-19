export const toKey = (str: string | number | boolean) => {
  return String(str).replace(/ /g, '_').toLowerCase()
}

export function trimStrings<T extends Record<string, unknown | string>>(body: T): T {
  for (const key in body) {
    const value = body[key] as unknown | string
    if (typeof value === 'string') {
      body[key] = value.trim() as T[typeof key]
    }
  }
  return body
}
