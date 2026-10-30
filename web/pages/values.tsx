import {defaultLocale, supportedLocales} from 'common/constants'
import fs from 'fs'
import path from 'path'
import {DocPage} from 'web/components/doc/doc-page'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useLocale, useT} from 'web/lib/locale'
import {MarkdownDoc, parseDoc} from 'web/lib/markdown-doc'

type Props = {
  /** Every locale's parsed values page, keyed by locale code. */
  docs: Record<string, MarkdownDoc>
}

/**
 * What Compass stands for, gathered from the about page, the FAQ, the constitution and the terms
 * into one page that refusals and moderation notices can point at ("does this seem unaligned with
 * our values?"). Markdown parsed at build time, like `/safety` — see `/privacy` for why.
 *
 * The last section restates the house rules from `web/components/house-rules.tsx` in the same
 * words; change one, change the other.
 */
export const getStaticProps = async () => {
  const dir = path.join(process.cwd(), 'public', 'md')
  const docs: Record<string, MarkdownDoc> = {}

  for (const locale of supportedLocales) {
    const file =
      locale === defaultLocale ? path.join(dir, 'values.md') : path.join(dir, locale, 'values.md')
    // A locale without its own translation falls back to English at render time rather than failing
    // the build.
    if (!fs.existsSync(file)) continue
    docs[locale] = parseDoc(fs.readFileSync(file, 'utf-8'))
  }

  if (!docs[defaultLocale]) throw new Error(`Missing ${path.join(dir, 'values.md')}`)

  return {props: {docs}}
}

export default function ValuesPage({docs}: Props) {
  const t = useT()
  const {locale} = useLocale()
  const doc = docs[locale] ?? docs[defaultLocale]

  return (
    <PageBase trackPageView="values" className="col-span-8">
      <SEO
        title={t('values.seo.title', 'Our values')}
        description={t(
          'values.seo.description',
          'What Compass stands for, and the rules we strongly enforce to keep connections deep and safe.',
        )}
        url="/values"
      />
      <DocPage
        doc={doc}
        label={t('values.label', 'Values')}
        meta={t('values.updated', 'Last updated: October 30, 2026')}
      />
    </PageBase>
  )
}
