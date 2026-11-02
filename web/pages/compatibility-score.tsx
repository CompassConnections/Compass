import {defaultLocale, supportedLocales} from 'common/constants'
import fs from 'fs'
import path from 'path'
import {DocPage} from 'web/components/doc/doc-page'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useLocale, useT} from 'web/lib/locale'
import {MarkdownDoc, parseDoc} from 'web/lib/markdown-doc'

type Props = {
  /** Every locale's parsed page, keyed by locale code. */
  docs: Record<string, MarkdownDoc>
}

/**
 * How the compatibility score is computed, for members: the dealbreakers, every factor with its
 * weight, the prompt score, and what is deliberately left out. The member-facing rendering of
 * `docs/compatibility-score.md`; the code is `common/src/profiles/compatibility-factors.ts`. Linked
 * from the breakdown modal, the rail block, the FAQ, onboarding, the home page and the footer.
 * Markdown parsed at build time, like `/values`.
 */
export const getStaticProps = async () => {
  const dir = path.join(process.cwd(), 'public', 'md')
  const docs: Record<string, MarkdownDoc> = {}

  for (const locale of supportedLocales) {
    const file =
      locale === defaultLocale
        ? path.join(dir, 'compatibility-score.md')
        : path.join(dir, locale, 'compatibility-score.md')
    // A locale without its own translation falls back to English at render time rather than failing
    // the build.
    if (!fs.existsSync(file)) continue
    docs[locale] = parseDoc(fs.readFileSync(file, 'utf-8'))
  }

  if (!docs[defaultLocale]) throw new Error(`Missing ${path.join(dir, 'compatibility-score.md')}`)

  return {props: {docs}}
}

export default function CompatibilityScorePage({docs}: Props) {
  const t = useT()
  const {locale} = useLocale()
  const doc = docs[locale] ?? docs[defaultLocale]

  return (
    <PageBase trackPageView="compatibility-score" className="col-span-8">
      <SEO
        title={t('compatibility_score.seo.title', 'How the compatibility score works')}
        description={t(
          'compatibility_score.seo.description',
          'Every factor behind a Compass compatibility score, with its weight: the dealbreakers, the prompt answers, and what your profiles add.',
        )}
        url="/compatibility-score"
      />
      <DocPage
        doc={doc}
        label={t('compatibility_score.label', 'Transparency')}
        meta={t('compatibility_score.updated', 'Last updated: October 31, 2026')}
      />
    </PageBase>
  )
}
