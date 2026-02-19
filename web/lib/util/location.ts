// web only. uses Intl https://caniuse.com/mdn-javascript_builtins_intl_displaynames

export function countryCodeToFlag(code?: string) {
  if (!code || !getCountryName(code)) return null

  const x = 0x1f1a5 + code.toUpperCase().charCodeAt(0)
  const y = 0x1f1a5 + code.toUpperCase().charCodeAt(1)

  return String.fromCodePoint(x, y)
}

export function getCountryName(code: string) {
  const country = countries.of(code)
  if (!country || country === code) return null
  return country
}

const countries = new Intl.DisplayNames(['en'], {type: 'region'})
