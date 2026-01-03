export const toKey = (str: string) => {
  return str.replace(/ /g, '_').toLowerCase()
}