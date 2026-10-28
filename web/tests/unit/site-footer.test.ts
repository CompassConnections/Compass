import {existsSync} from 'fs'
import {uniq} from 'lodash'
import {join} from 'path'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {
  FOOTER_COLUMNS,
  FOOTER_SOCIALS,
  isExternalHref,
  SiteFooter,
} from 'web/components/site-footer'

/**
 * The footer links to the long tail of pages that nothing else on the site links to — financials,
 * constitution, delete-account — which is exactly where a page can be renamed or removed without
 * anything visibly breaking. So the thing worth pinning is that every internal href still has a
 * page behind it, and that the markup the server sends carries the links at all.
 */

const PAGES_DIR = join(__dirname, '..', '..', 'pages')

const pageExists = (href: string) => {
  const route = href === '/' ? 'index' : href.replace(/^\//, '')
  return (
    existsSync(join(PAGES_DIR, `${route}.tsx`)) || existsSync(join(PAGES_DIR, route, 'index.tsx'))
  )
}

describe('SiteFooter links', () => {
  const internal = FOOTER_COLUMNS.flatMap((c) => c.links)
    .map((l) => l.href)
    .filter((href) => !isExternalHref(href))

  it('points every internal link at a page that exists', () => {
    const missing = internal.filter((href) => !pageExists(href))
    expect(missing).toEqual([])
  })

  it('never lists the same destination twice in the columns', () => {
    const all = FOOTER_COLUMNS.flatMap((c) => c.links).map((l) => l.href)
    expect(uniq(all)).toEqual(all)
  })

  it('opens every off-site link in a new tab', () => {
    const html = renderToStaticMarkup(createElement(SiteFooter))
    const externals = uniq([
      ...FOOTER_SOCIALS.map((s) => s.href),
      ...FOOTER_COLUMNS.flatMap((c) => c.links)
        .map((l) => l.href)
        .filter(isExternalHref),
    ])
    for (const href of externals) {
      expect(html).toContain(`href="${href}" target="_blank"`)
    }
  })

  it('carries the legal links in the server-rendered markup', () => {
    const html = renderToStaticMarkup(createElement(SiteFooter))
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="/terms"')
    expect(html).toContain('href="/delete-account"')
    expect(html).toContain('<footer')
  })
})
