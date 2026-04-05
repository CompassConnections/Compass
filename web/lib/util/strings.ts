/**
 * Returns the possessive form of a name.
 * Adds 's unless the name already ends with s, in which case just adds '.
 */
export const possessive = (name: string) =>
  name.endsWith('s') ? `${name}'` : `${name}'s`
