import {FINANCIALS} from 'common/constants'
import {mapValues} from 'lodash'
import {MarkdownPageLoader} from 'web/components/MarkdownPageLoader'
import {useLocale} from 'web/lib/locale'

export default function Page() {
  const {locale} = useLocale()
  // Locale-formatted so the French and German pages keep their decimal comma (718,13 $).
  const format = new Intl.NumberFormat(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2})
  const vars = mapValues(FINANCIALS.exact, (v) => format.format(v))
  return <MarkdownPageLoader filename="financials" vars={vars} />
}
