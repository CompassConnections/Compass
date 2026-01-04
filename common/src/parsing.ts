export const toKey = (str: string | number | boolean) => {
  return String(str).replace(/ /g, '_').toLowerCase()
}