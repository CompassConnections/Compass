import {defaultLocale, supportedLocales} from 'common/constants'
import fs from 'fs'
import path from 'path'
import {DocPage} from 'web/components/doc/doc-page'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useLocale, useT} from 'web/lib/locale'
import {MarkdownDoc, parseDoc} from 'web/lib/markdown-doc'

type Props = {
  /** Every locale's parsed terms, keyed by locale code. */
  docs: Record<string, MarkdownDoc>
}

/**
 * Read and parsed at build time, exactly as `/privacy` is — see that page for why the markdown files
 * beat a wall of `t('terms.safety.f3', …)` keys for a document that has to be read end to end and
 * amended whenever the product changes.
 */
export const getStaticProps = async () => {
  const dir = path.join(process.cwd(), 'public', 'md')
  const docs: Record<string, MarkdownDoc> = {}

  for (const locale of supportedLocales) {
    const file =
      locale === defaultLocale ? path.join(dir, 'terms.md') : path.join(dir, locale, 'terms.md')
    // A locale without its own translation falls back to English at render time rather than failing
    // the build.
    if (!fs.existsSync(file)) continue
    docs[locale] = parseDoc(fs.readFileSync(file, 'utf-8'))
  }

  if (!docs[defaultLocale]) throw new Error(`Missing ${path.join(dir, 'terms.md')}`)

  return {props: {docs}}
}

export default function TermsPage({docs}: Props) {
  const t = useT()
  const {locale} = useLocale()
  const doc = docs[locale] ?? docs[defaultLocale]

  return (
    <PageBase trackPageView="terms" className="col-span-8">
      <SEO
        title={t('terms.seo.title', 'Terms & Conditions')}
        description={t('terms.seo.description', 'Terms & Conditions for Compass')}
        url="/terms"
      />
      <DocPage
        doc={doc}
        label={t('terms.label', 'Legal')}
        meta={t('terms.effective_date', 'Last updated: August 16, 2026')}
      />
    </PageBase>
  )
}
