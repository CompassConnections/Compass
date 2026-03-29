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

export const isUrl = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false

  // Remove leading/trailing whitespace
  const trimmedText = text.trim()

  // If it already starts with a protocol, test as-is
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmedText)) {
    try {
      new URL(trimmedText)
      return true
    } catch {
      return false
    }
  }

  // Try adding https:// prefix for common domain patterns
  if (
    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmedText) ||
    /^www\.[a-zA-Z0-9.-]+/.test(trimmedText)
  ) {
    try {
      new URL(`https://${trimmedText}`)
      return true
    } catch {
      return false
    }
  }

  return false
}
