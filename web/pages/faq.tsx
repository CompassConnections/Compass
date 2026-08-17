import {defaultLocale, OG_DESCRIPTION, supportedLocales} from 'common/constants'
import fs from 'fs'
import Head from 'next/head'
import path from 'path'
import {FaqContent} from 'web/components/faq/faq-content'
import {JsonLd} from 'web/components/json-ld'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {allQuestions, FaqDoc, parseFaq, toPlainText} from 'web/lib/faq'
import {useLocale, useT} from 'web/lib/locale'

type Props = {
  /** Every locale's parsed FAQ, keyed by locale code. */
  docs: Record<string, FaqDoc>
}

/**
 * Read and parsed at build time rather than fetched at runtime.
 *
 * The old page fetched `/md/{locale}/faq.md` from a `useEffect` and rendered it client-side, which
 * meant the HTML a crawler received contained no questions at all — on the one page in the app that
 * is *made of* the thing Google shows rich results for. Parsing here puts the Q&A in the served
 * markup and makes the `FAQPage` JSON-LD below possible.
 *
 * All locales ship in the props (roughly 30KB of text across three) because locale here is a cookie
 * read by `I18nContext`, not a route segment — there is no per-locale URL to statically render
 * separately, so the client has to be able to switch without another round trip. This still works
 * under `output: 'export'` for the Android build, since `getStaticProps` runs at build time.
 */
export const getStaticProps = async () => {
  const dir = path.join(process.cwd(), 'public', 'md')
  const docs: Record<string, FaqDoc> = {}

  for (const locale of supportedLocales) {
    const file =
      locale === defaultLocale ? path.join(dir, 'faq.md') : path.join(dir, locale, 'faq.md')
    // A locale without its own translation simply falls back to English at render time rather than
    // failing the build — the same behaviour the old runtime fetch had.
    if (!fs.existsSync(file)) continue
    docs[locale] = parseFaq(fs.readFileSync(file, 'utf-8'))
  }

  if (!docs[defaultLocale]) throw new Error(`Missing ${path.join(dir, 'faq.md')}`)

  return {props: {docs}}
}

export default function Faq({docs}: Props) {
  const t = useT()
  const {locale} = useLocale()
  const doc = docs[locale] ?? docs[defaultLocale]

  return (
    <PageBase trackPageView="faq">
      <SEO
        title={t('faq.seo.title', 'FAQ')}
        description={t('faq.seo.description', OG_DESCRIPTION)}
        url="/faq"
      />
      {/* Structured data for rich results. Always the default-locale document: the pre-rendered HTML
          is English (locale is a cookie, resolved after hydration), so emitting the visitor's
          translated questions here would describe markup the crawler never saw. */}
      <Head>
        <JsonLd data={faqJsonLd(docs[defaultLocale])} />
      </Head>
      <FaqContent doc={doc} />
    </PageBase>
  )
}

// Serialisation and escaping are `JsonLd`'s job now, so this only has to build the object.
function faqJsonLd(doc: FaqDoc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allQuestions(doc).map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {'@type': 'Answer', text: toPlainText(q.answer)},
    })),
  }
}
