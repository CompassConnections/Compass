import {defaultLocale, supportedLocales} from 'common/constants'
import fs from 'fs'
import path from 'path'
import {DocPage} from 'web/components/doc/doc-page'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useLocale, useT} from 'web/lib/locale'
import {MarkdownDoc, parseDoc} from 'web/lib/markdown-doc'

type Props = {
  /** Every locale's parsed safety guide, keyed by locale code. */
  docs: Record<string, MarkdownDoc>
}

/**
 * Read and parsed at build time, exactly as `/privacy` and `/terms` are — see `/privacy` for why the
 * markdown files beat a wall of `t('safety.money.p3', …)` keys for a document that has to be read end
 * to end and rewritten whenever the scams change. That last part matters more here than on a policy
 * page: the patterns in this guide have a shelf life, and updating one should be editing a paragraph.
 *
 * The section anchors are what the in-product nudges point at (`/safety#the-off-platform-push` from
 * the conversation banner, `/safety#if-something-has-gone-wrong` from the report flow), so renaming a
 * `##` heading here breaks those links — `slugify` derives the id from the heading text.
 */
export const getStaticProps = async () => {
  const dir = path.join(process.cwd(), 'public', 'md')
  const docs: Record<string, MarkdownDoc> = {}

  for (const locale of supportedLocales) {
    const file =
      locale === defaultLocale ? path.join(dir, 'safety.md') : path.join(dir, locale, 'safety.md')
    // A locale without its own translation falls back to English at render time rather than failing
    // the build.
    if (!fs.existsSync(file)) continue
    docs[locale] = parseDoc(fs.readFileSync(file, 'utf-8'))
  }

  if (!docs[defaultLocale]) throw new Error(`Missing ${path.join(dir, 'safety.md')}`)

  return {props: {docs}}
}

export default function SafetyPage({docs}: Props) {
  const t = useT()
  const {locale} = useLocale()
  const doc = docs[locale] ?? docs[defaultLocale]

  return (
    <PageBase trackPageView="safety" className="col-span-8">
      <SEO
        title={t('safety.seo.title', 'Safety')}
        description={t(
          'safety.seo.description',
          'How to spot romance scams and fake profiles, check that someone is real, and meet safely.',
        )}
        url="/safety"
      />
      <DocPage
        doc={doc}
        label={t('safety.label', 'Safety')}
        meta={t('safety.updated', 'Last updated: September 2, 2026')}
      />
    </PageBase>
  )
}
