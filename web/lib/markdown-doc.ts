/**
 * Splits a long-form markdown document into the sections a document page renders.
 *
 * The distinction it needs is much coarser than the FAQ's (see `web/lib/faq.ts`): `#` is the title,
 * `##` starts a section, and everything under a `##` — including any `###` subheadings — is that
 * section's body, handed to the markdown renderer untouched. That is enough to build a table of
 * contents and give every section a stable anchor, which is all a policy or terms page needs on top
 * of plain prose.
 *
 * Bodies stay as *markdown strings* rather than pre-rendered HTML, for the same reason the FAQ's
 * answers do: the page renders them with `react-markdown` and a component map, so links keep going
 * through `CustomLink` and lists pick up the design tokens.
 *
 * Runs in `getStaticProps`, so the text is in the served HTML — a privacy policy is a page crawlers
 * and compliance reviewers fetch cold, and the old client-side `fetch` shipped them an empty shell.
 */

export type DocSection = {
  /** Slug used as the element id, so `/privacy#cookies` deep-links to a section. */
  id: string
  title: string
  /** Raw markdown, rendered by the page. */
  body: string
}

export type MarkdownDoc = {
  title: string
  /** Everything between the `#` title and the first `##` — rendered as the page's lede. */
  lede: string
  sections: DocSection[]
}

const HEADING = /^(#{1,6})\s+(.*?)\s*$/

/**
 * Slugs come from the heading text rather than its position, so an anchor survives sections being
 * reordered or inserted above it. The cost is that anchors are per-locale, since the text they derive
 * from is translated; a shared cross-locale anchor would need an explicit id in the markdown, which
 * is exactly the markup the source files are meant to stay free of.
 */
export function slugify(text: string) {
  return (
    text
      .normalize('NFD')
      // Strip diacritics so `Confidentialité` and `Für` produce clean ASCII anchors.
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/g, '')
  )
}

export function parseDoc(markdown: string): MarkdownDoc {
  const lines = markdown.split('\n')

  let title = ''
  const lede: string[] = []
  const sections: DocSection[] = []
  // Tracks fenced blocks so a `## ` inside one is never mistaken for a section heading.
  let inFence = false
  let current: {id: string; title: string; body: string[]} | undefined
  const seen = new Set<string>()

  const flush = () => {
    if (!current) return
    sections.push({id: current.id, title: current.title, body: trim(current.body)})
    current = undefined
  }

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence

    const m = inFence ? null : HEADING.exec(line)

    if (m && m[1].length === 1 && !title) {
      title = m[2]
      continue
    }

    if (m && m[1].length === 2) {
      flush()
      let id = slugify(m[2]) || `section-${sections.length + 1}`
      // Two headings can legitimately slugify the same way in a long document; the suffix keeps the
      // ids unique so `getElementById` and the deep link stay unambiguous.
      if (seen.has(id)) {
        let n = 2
        while (seen.has(`${id}-${n}`)) n++
        id = `${id}-${n}`
      }
      seen.add(id)
      current = {id, title: m[2], body: []}
      continue
    }

    if (current) current.body.push(line)
    else lede.push(line)
  }

  flush()

  return {title, lede: trim(lede), sections}
}

function trim(lines: string[]) {
  const out = [...lines]
  while (out.length && !out[0].trim()) out.shift()
  while (out.length && !out[out.length - 1].trim()) out.pop()
  return out.join('\n')
}
