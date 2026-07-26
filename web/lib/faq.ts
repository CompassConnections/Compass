/**
 * Turns an FAQ markdown file into the structure the FAQ page renders.
 *
 * The markdown already carries every distinction the UI needs — `##` is a category, `###` is a
 * question, everything until the next heading is that question's answer — so the source files stay
 * plain prose that a translator can work on without touching any markup. All this does is stop
 * treating the file as one opaque blob, which is what forced the old page to render it as a single
 * undifferentiated `prose` column.
 *
 * Answers stay as *markdown strings*, not HTML: the page renders them with `react-markdown` and a
 * component map, so the links keep going through `CustomLink` (client-side routing for internal
 * hrefs) and the lists pick up the design tokens. Pre-rendering to an HTML string here would trade
 * both away for nothing.
 *
 * Runs in `getStaticProps`, so the result is in the served HTML — which is what makes the FAQPage
 * JSON-LD possible and removes the empty-page flash the old client-side `fetch` had.
 */

export type FaqQuestion = {
  /** Slug used as the element id, so `/faq#is-my-data-safe` deep-links to a question. */
  id: string
  question: string
  /** Raw markdown, rendered by the page. */
  answer: string
}

export type FaqCategory = {
  id: string
  title: string
  questions: FaqQuestion[]
}

export type FaqDoc = {
  title: string
  /** Everything between the `#` title and the first category — rendered as the page's lede. */
  intro: string
  categories: FaqCategory[]
}

const HEADING = /^(#{1,6})\s+(.*?)\s*$/

/**
 * Slugs come from the question text rather than its position, so an anchor survives questions being
 * reordered or inserted above it — the thing that actually happens to an FAQ. The cost is that the
 * anchors are per-locale, since the text they derive from is translated; a shared cross-locale anchor
 * would need an explicit id in the markdown, which is exactly the markup the source files are meant
 * to stay free of.
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

export function parseFaq(markdown: string): FaqDoc {
  const lines = markdown.split('\n')

  let title = ''
  const intro: string[] = []
  const categories: FaqCategory[] = []
  // Tracks fenced blocks so a `### ` inside one is never mistaken for a question. No FAQ answer has
  // a code fence today, but a parser that silently shatters the first one that shows up is a trap.
  let inFence = false
  let current: FaqCategory | undefined
  let question: {question: string; answer: string[]} | undefined
  const seen = new Set<string>()

  const flushQuestion = () => {
    if (!question || !current) return
    let id = slugify(question.question) || `q${current.questions.length + 1}`
    // Two questions can legitimately slugify the same way across a long file; the suffix keeps the
    // ids unique so `getElementById` and the deep link stay unambiguous.
    if (seen.has(id)) {
      let n = 2
      while (seen.has(`${id}-${n}`)) n++
      id = `${id}-${n}`
    }
    seen.add(id)
    current.questions.push({id, question: question.question, answer: trim(question.answer)})
    question = undefined
  }

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence

    const m = inFence ? null : HEADING.exec(line)
    const depth = m ? m[1].length : 0

    if (m && depth === 1 && !title) {
      title = m[2]
      continue
    }

    if (m && depth === 2) {
      flushQuestion()
      current = {id: slugify(m[2]), title: m[2], questions: []}
      categories.push(current)
      continue
    }

    if (m && depth >= 3) {
      flushQuestion()
      // A `###` before any `##` still has to land somewhere; an untitled category renders without a
      // heading, so a file that never groups its questions degrades to one flat list rather than
      // dropping content.
      if (!current) {
        current = {id: 'faq', title: '', questions: []}
        categories.push(current)
      }
      question = {question: m[2], answer: []}
      continue
    }

    if (question) question.answer.push(line)
    else if (!current) intro.push(line)
    // Prose sitting directly under a `##` with no `###` after it has nowhere to go in this model.
    // Dropping it is deliberate — the alternative is inventing a heading-less pseudo-question.
  }

  flushQuestion()

  return {
    title,
    intro: trim(intro),
    // A category whose questions all failed to parse would render as a heading over nothing.
    categories: categories.filter((c) => c.questions.length > 0),
  }
}

function trim(lines: string[]) {
  const out = [...lines]
  while (out.length && !out[0].trim()) out.shift()
  while (out.length && !out[out.length - 1].trim()) out.pop()
  return out.join('\n')
}

/** Flattened, in document order — for search and for the JSON-LD. */
export function allQuestions(doc: FaqDoc): FaqQuestion[] {
  return doc.categories.flatMap((c) => c.questions)
}

/**
 * Answer markdown reduced to plain text, for the search index and the JSON-LD `acceptedAnswer`.
 *
 * Deliberately a regex pass rather than a real render: search wants the words, and Google wants the
 * text of the answer. Neither needs the tree, and pulling a second markdown pipeline in for this
 * would be far more machinery than the job.
 */
export function toPlainText(markdown: string) {
  return markdown
    .replace(/^\[\/\/\]:.*$/gm, '') // markdown comments (`[//]: # '...'`)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // keep link text, drop the href
    .replace(/[*_`>#]/g, '')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Accent- and case-insensitive, so `donnees` matches `données` and `fur` matches `für`. */
export function normalizeForSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
