import {useT} from 'web/lib/locale'
import {useLocale} from 'web/lib/locale'

export function EnglishOnlyWarning() {
  const t = useT()
  const {locale} = useLocale()

  if (locale === 'en') {
    return null
  }

  return (
    <p className="text-sm guidance">
      {t('news.note', 'Note: Unfortunately, this page is only available in English.')}
    </p>
  )
}
