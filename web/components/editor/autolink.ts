import {
  combineTransactionSteps,
  type Editor,
  Extension,
  getChangedRanges,
  getMarkRange,
} from '@tiptap/core'
import type {Mark, MarkType, Node as PMNode} from '@tiptap/pm/model'
import {Plugin, PluginKey, type Transaction} from '@tiptap/pm/state'
import {tokenize} from 'linkifyjs'

/** Protocol assumed for bare hosts like `example.com`. Matches what `Link` is configured with. */
export const DEFAULT_PROTOCOL = 'http'

/**
 * The href a piece of text would get if it were autolinked, or undefined if it isn't a link.
 *
 * Tokenizing the whole string (rather than searching it for links) is what rejects `example.com1`:
 * the text only counts as a link if the link is the *entire* string. Same call the autolink plugin
 * makes, so anything typed and anything synced here agree on what a URL is.
 */
const hrefOf = (text: string) => {
  const tokens = tokenize(text)
  if (tokens.length !== 1 || !tokens[0].isLink) return undefined
  return tokens[0].toObject(DEFAULT_PROTOCOL).href
}

/**
 * Add link marks to every bare URL in the doc that doesn't have one yet, writing into `tr`.
 *
 * Returns whether anything was marked. Shared by the on-send pass and the on-paste plugin so both
 * agree, to the character, on what counts as a URL.
 */
const addLinkMarks = (doc: PMNode, tr: Transaction, linkType: MarkType, codeType?: MarkType) => {
  let changed = false

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true // a list item / table cell / blockquote: keep descending
    if (node.type.spec.code) return false // a code block is literal text, not prose

    // The block's first content position, one past the block node itself. Leaf nodes (hard breaks,
    // mentions, emoji) are read as a single space, which is both what the autolink plugin does and
    // what keeps string offsets lined up one-to-one with document positions.
    const start = pos + 1
    const text = doc.textBetween(start, pos + node.nodeSize - 1, undefined, ' ')

    tokenize(text).forEach((token) => {
      if (!token.isLink) return
      const from = start + token.startIndex()
      const to = start + token.endIndex()
      if (doc.rangeHasMark(from, to, linkType)) return // already linked, by hand or by autolink
      if (codeType && doc.rangeHasMark(from, to, codeType)) return
      tr.addMark(from, to, linkType.create({href: token.toObject(DEFAULT_PROTOCOL).href}))
      changed = true
    })

    return false // no textblocks nested inside a textblock
  })

  return changed
}

/**
 * Link every bare URL in the doc, including protocol-less ones like `compassmeet.com/heartborne`.
 *
 * TipTap's autolink only fires on the keystroke *after* a URL (a space, or the enter that splits the
 * block), so a message whose last word is a URL is submitted as plain text — and text arriving any
 * way other than typing (paste, programmatic insert) is never seen by it at all. Call this right
 * before reading the content out of the editor; it uses the same rules as the autolink plugin, so
 * the result is what you'd have got by typing every URL and following it with a space.
 */
export const linkifyUrls = (editor: Editor) => {
  const {schema, tr, doc} = editor.state
  const linkType = schema.marks.link
  if (!linkType) return

  if (addLinkMarks(doc, tr, linkType, schema.marks.code)) {
    editor.view.dispatch(tr.setMeta('preventAutolink', true))
  }
}

/** Every distinct link-marked run of text overlapping [from, to], each expanded to its full extent. */
const linkRangesIn = (doc: PMNode, from: number, to: number, type: MarkType) => {
  const ranges: {from: number; to: number; mark: Mark}[] = []
  doc.nodesBetween(from, to, (node, pos) => {
    const mark = node.marks.find((m) => m.type === type)
    if (!node.isText || !mark) return
    // Expand: the run can start before `from` and end after `to` (editing the middle of a link only
    // reports the edited characters as changed).
    const range = getMarkRange(doc.resolve(pos), type, mark.attrs)
    if (!range || ranges.some((r) => r.from === range.from)) return
    ranges.push({...range, mark})
  })
  return ranges
}

/**
 * Keep an autolinked URL's href in sync with its text.
 *
 * TipTap links the text once, on the keystroke that completes the URL, and then never looks at it
 * again — so correcting a typo in an already-linked URL leaves the anchor pointing at the *old*
 * address, silently. That's worse than not linking at all: what you click is not what you read.
 *
 * Neither TipTap v2 nor v3 does this, so the plugin is ours. On every doc change it re-derives the
 * href of each edited link and, when the text no longer says what the href says, either updates the
 * href or drops the mark (the text stopped being a URL at all).
 *
 * Links whose text is a *label* rather than a URL — `[click here](…)`, set by hand from the format
 * menu — are left alone. They're recognised by the href not matching what the text linkifies to,
 * checked against the doc as it was *before* the edit, since after the edit that's exactly the
 * mismatch we're here to fix.
 */
export const SyncAutolink = Extension.create({
  name: 'syncAutolink',

  addProseMirrorPlugins() {
    const linkType = this.editor.schema.marks.link
    if (!linkType) return []

    return [
      new Plugin({
        key: new PluginKey('syncAutolink'),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanged =
            transactions.some((transaction) => transaction.docChanged) &&
            !oldState.doc.eq(newState.doc)
          // Same escape hatch the autolink plugin honours.
          const prevented = transactions.some((transaction) =>
            transaction.getMeta('preventAutolink'),
          )
          if (!docChanged || prevented) return

          const {tr} = newState
          const transform = combineTransactionSteps(oldState.doc, [...transactions])
          const handled = new Set<number>()

          getChangedRanges(transform).forEach(({oldRange}) => {
            // Widened by one on each side: a pure insertion reports a zero-length range sitting
            // *between* two text nodes, which on its own matches neither of them — including the
            // case that matters most, typing more characters onto the end of a link.
            const from = Math.max(0, oldRange.from - 1)
            const to = Math.min(oldState.doc.content.size, oldRange.to + 1)

            linkRangesIn(oldState.doc, from, to, linkType).forEach((old) => {
              const oldText = oldState.doc.textBetween(old.from, old.to)
              if (old.mark.attrs.href !== hrefOf(oldText)) return // a hand-written label, not a URL

              // The edit may have grown or shrunk the run, so re-read it from the new doc rather
              // than trusting the mapped endpoints.
              const pos = transform.mapping.map(old.from, 1)
              if (pos > newState.doc.content.size) return
              const range = getMarkRange(newState.doc.resolve(pos), linkType, old.mark.attrs)
              if (!range || handled.has(range.from)) return
              handled.add(range.from)

              const text = newState.doc.textBetween(range.from, range.to)
              const href = hrefOf(text)
              if (href === old.mark.attrs.href) return

              tr.removeMark(range.from, range.to, linkType)
              // No href means the text isn't a URL any more (`example.com` → `example`), so the
              // mark goes with it.
              if (href) tr.addMark(range.from, range.to, linkType.create({...old.mark.attrs, href}))
            })
          })

          return tr.steps.length ? tr : undefined
        },
      }),

      /**
       * Linkify pasted URLs.
       *
       * TipTap's own paste handling only links a URL pasted *over a selection*; a plain paste is left
       * to the autolink plugin, which never sees it because it only reacts to typed separators. So
       * pasting a list of links yields a list of plain text. Re-scanning the whole doc after a paste
       * is cheap at the sizes this editor holds (a message, a bio) and, unlike scanning the pasted
       * slice, it also catches a URL completed by the paste landing next to existing text.
       */
      new Plugin({
        key: new PluginKey('linkifyOnPaste'),
        appendTransaction: (transactions, _oldState, newState) => {
          const pasted = transactions.some(
            (transaction) =>
              transaction.docChanged &&
              (transaction.getMeta('paste') || transaction.getMeta('uiEvent') === 'drop'),
          )
          const prevented = transactions.some((transaction) =>
            transaction.getMeta('preventAutolink'),
          )
          if (!pasted || prevented) return

          const {tr} = newState
          const {code} = newState.schema.marks
          return addLinkMarks(newState.doc, tr, linkType, code) ? tr : undefined
        },
      }),
    ]
  },
})
