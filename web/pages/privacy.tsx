import {defaultLocale, supportedLocales} from 'common/constants'
import fs from 'fs'
import path from 'path'
import {DocPage} from 'web/components/doc/doc-page'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useLocale, useT} from 'web/lib/locale'
import {MarkdownDoc, parseDoc} from 'web/lib/markdown-doc'

type Props = {
  /** Every locale's parsed policy, keyed by locale code. */
  docs: Record<string, MarkdownDoc>
}

/**
 * Read and parsed at build time, the same way `/faq` is.
 *
 * The policy used to be ~60 lines of JSX with every sentence behind a `t('privacy.storage.text', …)`
 * key, which made the two things a privacy policy needs most — being read end to end, and being
 * *changed* when the stack changes — both awkward. It is now `public/md/privacy.md`, with the
 * translations as sibling markdown files, so updating a clause is editing a paragraph rather than
 * threading a new key through three JSON files.
 *
 * All locales ship in the props because locale here is a cookie read after hydration, not a route
 * segment — there is no per-locale URL to render separately, so the client has to be able to switch
 * without another round trip. This still works under `output: 'export'` for the Android build, since
 * `getStaticProps` runs at build time.
 */
export const getStaticProps = async () => {
  const dir = path.join(process.cwd(), 'public', 'md')
  const docs: Record<string, MarkdownDoc> = {}

  for (const locale of supportedLocales) {
    const file =
      locale === defaultLocale ? path.join(dir, 'privacy.md') : path.join(dir, locale, 'privacy.md')
    // A locale without its own translation falls back to English at render time rather than failing
    // the build — the same behaviour the FAQ has.
    if (!fs.existsSync(file)) continue
    docs[locale] = parseDoc(fs.readFileSync(file, 'utf-8'))
  }

  if (!docs[defaultLocale]) throw new Error(`Missing ${path.join(dir, 'privacy.md')}`)

  return {props: {docs}}
}

export default function PrivacyPage({docs}: Props) {
  const t = useT()
  const {locale} = useLocale()
  const doc = docs[locale] ?? docs[defaultLocale]

  return (
    <PageBase trackPageView="privacy" className="col-span-8">
      <SEO
        title={t('privacy.seo.title', 'Privacy')}
        description={t('privacy.seo.description', 'Privacy Policy for Compass')}
        url="/privacy"
      />
      <DocPage
        doc={doc}
        label={t('privacy.label', 'Legal')}
        meta={t('privacy.effective_date', 'Last updated: August 16, 2026')}
      />
    </PageBase>
  )
}
