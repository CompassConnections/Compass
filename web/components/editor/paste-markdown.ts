import {marked} from 'marked'

/**
 * Shapes that make a block of text unambiguously Markdown rather than prose that happens to contain
 * punctuation. Each requires the marker to be followed by content, so a diff (`-foo`), a hyphenated
 * line break or an emoticon doesn't qualify.
 */
const MARKDOWN_SIGNALS = [
  /^ {0,3}[-*+][ \t]+\S/m, // bullet list
  /^ {0,3}\d{1,9}[.)][ \t]+\S/m, // ordered list
  /^ {0,3}#{1,6}[ \t]+\S/m, // heading
  /^ {0,3}>[ \t]*\S/m, // blockquote
  /^ {0,3}(```|~~~)/m, // fenced code
  /\*\*[^\s*][^*]*\*\*/, // bold
  /\[[^\]\n]+\]\([^)\s]+\)/, // link
]

const looksLikeMarkdown = (text: string) => MARKDOWN_SIGNALS.some((re) => re.test(text))

/** Everything the two renderings can legitimately disagree about: whitespace, in all its forms. */
const squash = (text: string) => text.replace(/[\s\u00a0\u200b]+/g, '')

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/** The characters an HTML fragment reads as, with its tags stripped and its entities resolved. */
const htmlText = (html: string) =>
  html
    .replace(/<(script|style|head|title)\b[^>]*>[\s\S]*?<\/\1>/gi, '') // never part of the text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, name: string) => {
      if (name[0] !== '#') return NAMED_ENTITIES[name.toLowerCase()] ?? entity
      const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : +name.slice(1)
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    })

/**
 * Does this clipboard's HTML carry any more meaning than its plain text?
 *
 * A code editor puts HTML on the clipboard too, but it's a *picture* of the text: one `<div>` per
 * line, `<span>`s coloured by the syntax highlighter, and the Markdown markers still sitting there
 * as literal characters. Parsing that gives a stack of paragraphs reading `- nothing at all`. When
 * the HTML says exactly the same characters as `text/plain`, there's nothing in it worth keeping
 * and the Markdown underneath is the better source. A copy from a real document differs — its
 * bullets live in `<ul>`, not in the text — so it's left to the normal clipboard parser. So is
 * anything this reads imperfectly: falling back is only ever today's behaviour.
 */
const isPlainRendering = (html: string, text: string) => squash(htmlText(html)) === squash(text)

/**
 * Markdown on the clipboard, rendered to HTML for the editor to parse — or null to paste as usual.
 *
 * Pasting a Markdown-formatted draft (the way most notes, READMEs and outreach drafts are written)
 * used to land as flat text: nothing in the clipboard's HTML says "list", and ProseMirror has no
 * reason to read `- ` as a bullet. Rendering the Markdown first gives the parser the structure that
 * was in the text all along.
 */
export const markdownPasteHtml = (data: DataTransfer | null): string | null => {
  const text = data?.getData('text/plain') ?? ''
  if (!text.trim() || !looksLikeMarkdown(text)) return null

  const html = data?.getData('text/html') ?? ''
  if (html && !isPlainRendering(html, text)) return null

  // `breaks` off: in Markdown a single newline is a soft wrap, and treating it as a hard break
  // turns every wrapped paragraph into a run of short lines.
  const rendered = marked.parse(text, {async: false, gfm: true, breaks: false})
  // `async: false` makes this a string. Older type definitions can't express that, and paste has to
  // stay synchronous either way, so narrow rather than cast: a promise means paste as usual.
  return typeof rendered === 'string' ? rendered : null
}
