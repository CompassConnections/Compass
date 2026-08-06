import {Fragment, Node as PMNode, Slice} from '@tiptap/pm/model'
import type {Editor} from '@tiptap/react'

/**
 * Characters a fragment contributes to the count `max` is enforced against.
 *
 * Deliberately the same measure `CharacterCount` uses — `textBetween(0, size, undefined, ' ')` — i.e.
 * the text itself plus one character per non-text leaf (an image, a hard break), and nothing for the
 * blocks that wrap them. Counting differently here would leave the extension trimming a paste we had
 * already declared to be within budget, and its trim is a blunt one: when the cut lands inside a
 * complex node it drops the whole paste instead.
 */
const charCount = (fragment: Fragment): number => {
  let count = 0
  fragment.forEach((node) => {
    count += node.isText ? (node.text?.length ?? 0) : node.isLeaf ? 1 : charCount(node.content)
  })
  return count
}

/** Cut a fragment down to `budget` characters, keeping every node the surviving text sits inside. */
const truncateFragment = (fragment: Fragment, budget: number) => {
  const kept: PMNode[] = []
  let left = budget

  for (let i = 0; i < fragment.childCount && left > 0; i++) {
    const node = fragment.child(i)
    if (node.isText) {
      const length = node.text?.length ?? 0
      kept.push(length <= left ? node : node.cut(0, left))
      left -= Math.min(length, left)
    } else if (node.isLeaf) {
      kept.push(node)
      left -= 1
    } else {
      const inner = truncateFragment(node.content, left)
      left = inner.left
      kept.push(node.copy(inner.content))
    }
  }

  return {content: Fragment.fromArray(kept), left}
}

/** How far you can descend into a fragment following only first (or last) children. */
const openDepth = (fragment: Fragment, side: 'start' | 'end') => {
  let node = side === 'start' ? fragment.firstChild : fragment.lastChild
  let depth = 0
  while (node && !node.isLeaf && node.childCount) {
    depth++
    node = side === 'start' ? node.firstChild : node.lastChild
  }
  return depth
}

/**
 * Cut a pasted slice down to `budget` characters, without flattening it.
 *
 * The obvious way to respect `max` on paste is to take `text/plain` off the clipboard and crop the
 * string — which is what this editor did, and why pasting a bulleted list, a heading or bold text
 * into a bio or a comment produced a wall of unformatted text. Cropping the *slice* instead lets the
 * default clipboard parser do its job, so structure survives and only the overflowing characters are
 * dropped.
 */
export const truncateSlice = (slice: Slice, budget: number): Slice => {
  if (budget <= 0) return Slice.empty
  if (charCount(slice.content) <= budget) return slice

  const {content} = truncateFragment(slice.content, budget)
  if (!content.childCount) return Slice.empty

  // The cut can have removed the levels the original open depths referred to; clamp to what's left,
  // else `replace` rejects the slice outright.
  return new Slice(
    content,
    Math.min(slice.openStart, openDepth(content, 'start')),
    Math.min(slice.openEnd, openDepth(content, 'end')),
  )
}

/** `truncateSlice` against whatever is left of this editor's `max`. */
export const limitPastedSlice = (editor: Editor, slice: Slice, max: number): Slice => {
  const {from, to} = editor.state.selection
  // A paste replaces the selection, so those characters are about to be freed.
  const replaced = editor.state.doc.textBetween(from, to, undefined, ' ').length
  return truncateSlice(slice, max - (editor.storage.characterCount.characters() - replaced))
}
