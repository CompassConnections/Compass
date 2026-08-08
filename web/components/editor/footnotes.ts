import {JSONContent} from '@tiptap/core'

/**
 * Google Docs "date me docs" are usually written with comments, and pasting one in brings the comments
 * along as a block of footnotes at the very bottom: each in-text marker (`[a]`, `[b]`, ...) is a link to
 * `#cmnt_refN`, and the comment text sits in a trailing paragraph that starts with the same marker.
 *
 * Neither end of that pairing survives the paste: tiptap's link mark keeps `href` but drops `id`, so every
 * `#cmnt_refN` anchor points at a target that no longer exists. Rather than try to preserve Google's ids,
 * we re-derive the pairing from the markers themselves — which also fixes the footnotes whose marker lost
 * its link on the way in.
 */

/** A marker as it stands alone in the text: `[a]`, `[12]`. Docs uses letters; other exports use numbers. */
const MARKER = /^\[([a-z]{1,3}|\d{1,3})\]$/i

/** The same marker opening a trailing paragraph, followed by the footnote's text. */
const DEFINITION = /^\[([a-z]{1,3}|\d{1,3})\]\s*/i

/** Google Docs' own anchor names, kept as aliases so old `#cmnt_ref2` links still land somewhere. */
const GOOGLE_ANCHOR = /^#(cmnt[a-z_]*\d+)$/i

/**
 * How many unlabelled paragraphs may sit between two definitions before we assume we've walked out of the
 * footnote block and back into the bio. A long footnote can run to several paragraphs, but not many.
 */
const MAX_CONTINUATION_RUN = 8

export type Footnote = {
  /** lowercased marker, e.g. `b` */
  label: string
  /** the comment body, marker stripped; paragraphs joined by blank lines */
  text: string
  /** Google Docs anchor names found on this definition's marker, e.g. `cmnt_ref2` */
  aliases: string[]
}

export type FootnoteIndex = {
  byLabel: Record<string, Footnote>
  /** top-level node index -> label of the definition starting there */
  definitionAt: Map<number, string>
}

export const footnoteDefId = (label: string) => `fn-${label}`
export const footnoteRefId = (label: string) => `fnref-${label}`

/** The label this text refers to, if it is a bare marker for a known footnote. */
export const footnoteLabelOf = (text: string, index: FootnoteIndex): string | undefined => {
  const label = MARKER.exec(text.trim())?.[1]?.toLowerCase()
  return label && index.byLabel[label] ? label : undefined
}

/**
 * The marker at the head of `label`'s definition, if this text starts with it. The paste sometimes merges
 * the marker into the same text run as the footnote body, so it isn't always a text node of its own.
 */
export const footnoteDefinitionPrefix = (text: string, label: string): string | undefined =>
  text.toLowerCase().startsWith(`[${label}]`) ? text.slice(0, label.length + 2) : undefined

/** True for the now-dangling `#cmnt…` anchors Google Docs leaves behind. */
export const isGoogleCommentAnchor = (href: string | undefined | null) =>
  !!href && GOOGLE_ANCHOR.test(href.slice(href.indexOf('#')))

const textOf = (node: JSONContent): string =>
  node.type === 'text' ? (node.text ?? '') : (node.content ?? []).map(textOf).join('')

const forEachTextNode = (node: JSONContent, fn: (node: JSONContent) => void) => {
  if (node.type === 'text') fn(node)
  else (node.content ?? []).forEach((child) => forEachTextNode(child, fn))
}

const aliasesOf = (node: JSONContent, label: string): string[] => {
  const aliases: string[] = []
  forEachTextNode(node, (text) => {
    if ((text.text ?? '').trim().toLowerCase() !== `[${label}]`) return
    for (const mark of text.marks ?? []) {
      const href: string | undefined = mark.attrs?.href
      const alias = href && GOOGLE_ANCHOR.exec(href.slice(href.indexOf('#')))?.[1]
      if (alias) aliases.push(alias)
    }
  })
  return aliases
}

/**
 * Pair up the footnote markers in a document with the definitions at the bottom of it.
 *
 * Returns undefined unless the document really does end in a footnote block whose markers are used in the
 * body — an ordinary bio that happens to contain `[a]` somewhere shouldn't grow tooltips.
 */
export function buildFootnoteIndex(doc: JSONContent | undefined): FootnoteIndex | undefined {
  const nodes = doc?.content
  if (!nodes?.length) return undefined

  const byLabel: Record<string, Footnote> = {}
  const definitionAt = new Map<number, string>()
  let continuations: string[] = []

  // Walk up from the end of the document: continuation paragraphs are seen before the definition they
  // belong to, so they queue up until a marker turns up.
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]
    if (node.type !== 'paragraph') break

    const text = textOf(node).trim()
    const match = DEFINITION.exec(text)
    if (!match) {
      if (!text) continue // blank spacer paragraph
      if (continuations.length >= MAX_CONTINUATION_RUN) break
      continuations.unshift(text)
      continue
    }

    const label = match[1].toLowerCase()
    if (byLabel[label]) break // a repeated marker means we've walked back into ordinary prose

    byLabel[label] = {
      label,
      text: [text.slice(match[0].length), ...continuations].filter(Boolean).join('\n\n'),
      aliases: aliasesOf(node, label),
    }
    definitionAt.set(i, label)
    continuations = []
  }

  if (!definitionAt.size) return undefined

  // Keep only the footnotes the body actually refers to.
  const bodyEnd = Math.min(...definitionAt.keys())
  const referenced = new Set<string>()
  for (let i = 0; i < bodyEnd; i++) {
    forEachTextNode(nodes[i], (text) => {
      const label = MARKER.exec((text.text ?? '').trim())?.[1]?.toLowerCase()
      if (label) referenced.add(label)
    })
  }

  for (const [i, label] of [...definitionAt]) {
    if (referenced.has(label)) continue
    delete byLabel[label]
    definitionAt.delete(i)
  }

  return definitionAt.size ? {byLabel, definitionAt} : undefined
}
