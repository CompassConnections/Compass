import {getSchema, getText, getTextSerializersFromSchema, JSONContent} from '@tiptap/core'
import {Image} from '@tiptap/extension-image'
import {Link} from '@tiptap/extension-link'
import {Mention} from '@tiptap/extension-mention'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Underline from '@tiptap/extension-underline'
import {Node as ProseMirrorNode} from '@tiptap/pm/model'
import {StarterKit} from '@tiptap/starter-kit'
import {find} from 'linkifyjs'
import {uniq} from 'lodash'
import {compareTwoStrings} from 'string-similarity'

import Iframe from './tiptap-iframe'

/** get first url in text. like "notion.so " -> "http://notion.so" "notion" -> null */
export function getUrl(text: string) {
  const results = find(text, 'url')
  return results.length ? results[0].href : null
}

export const beginsWith = (text: string, query: string) =>
  text.toLocaleLowerCase().startsWith(query.toLocaleLowerCase())

export const wordIn = (word: string, corpus: string) => {
  word = word.toLocaleLowerCase()
  corpus = corpus.toLocaleLowerCase()

  return corpus.includes(word) || compareTwoStrings(word, corpus) > 0.7
}

const checkAgainstQuery = (query: string, corpus: string) =>
  query.split(' ').every((word) => wordIn(word, corpus))

export const searchInAny = (query: string, ...fields: string[]) =>
  fields.some((field) => checkAgainstQuery(query, field))

/** @return user ids of all \@mentions */
export function parseMentions(data: JSONContent): string[] {
  const mentions = data.content?.flatMap(parseMentions) ?? [] //dfs
  if (data.type === 'mention' && data.attrs) {
    mentions.push(data.attrs.id as string)
  }
  return uniq(mentions)
}

export const extensions = [
  StarterKit,
  Link,
  Image.extend({renderText: () => '[image]'}),
  Mention, // user @mention
  Iframe.extend({
    renderText: ({node}) => ('[embed]' + node.attrs.src ? `(${node.attrs.src})` : ''),
  }),
  Table.configure({resizable: false}),
  TableRow,
  TableCell,
  TableHeader,
  Underline,
]

const extensionSchema = getSchema(extensions)
const extensionSerializers = getTextSerializersFromSchema(extensionSchema)

export function richTextToString(text?: JSONContent) {
  if (!text) return ''
  try {
    const node = ProseMirrorNode.fromJSON(extensionSchema, text)
    return getText(node, {
      blockSeparator: '\n\n',
      textSerializers: extensionSerializers,
    })
  } catch (e) {
    console.error('error parsing rich text', `"${text}":`, e)
    return ''
  }
}

export function parseJsonContentToText(content: JSONContent | string | undefined | null) {
  if (!content) return ''
  return typeof content === 'string' ? content : richTextToString(content)
}

/**
 * Inverse of `parseJsonContentToText`: turns plain text into a minimal Tiptap document. Used when
 * an LLM hands us prose (e.g. a bio written from a voice transcript) that has to be stored in a
 * rich-text column.
 *
 * A blank line always starts a new paragraph, and single newlines inside such a block are hard
 * breaks. But when the text contains no blank line at all, single newlines are the only structure
 * on offer, so they are read as paragraph breaks instead — LLMs routinely separate paragraphs with
 * one `\n` however firmly the prompt asks for two, and the alternative is one giant paragraph.
 */
export function textToJSONContent(text: string): JSONContent {
  const separator = /\n\s*\n/.test(text) ? /\n\s*\n+/ : '\n'
  const paragraphs = text
    .split(separator)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)

  return {
    type: 'doc',
    content: paragraphs.length
      ? paragraphs.map((block) => ({
          type: 'paragraph',
          // Single newlines inside a block are line breaks, not paragraph breaks.
          content: block
            .split('\n')
            .flatMap((line, i) => [
              ...(i > 0 ? [{type: 'hardBreak'}] : []),
              ...(line.trim() ? [{type: 'text', text: line.trim()}] : []),
            ]),
        }))
      : [{type: 'paragraph'}],
  }
}

/**
 * Appends one rich-text document to another, so a second pass adds to what is already written
 * instead of replacing it (e.g. recording a follow-up voice note to extend an existing bio).
 *
 * Each side is trimmed of its leading and trailing empty paragraphs first, so the join does not
 * accumulate blank space every time something is appended.
 */
export function concatJSONContent(
  first: JSONContent | null | undefined,
  second: JSONContent | null | undefined,
): JSONContent {
  const blocksOf = (doc: JSONContent | null | undefined) => {
    if (!doc) return []
    const cleaned = cleanDoc(doc)
    return Array.isArray(cleaned.content) ? cleaned.content : []
  }

  const content = [...blocksOf(first), ...blocksOf(second)]
  return {type: 'doc', content: content.length ? content : [{type: 'paragraph'}]}
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)))
}

export function cleanDoc(doc: JSONContent) {
  try {
    return _cleanDoc(doc)
  } catch (e) {
    console.error('error cleaning doc', doc, e)
    return doc
  }
}

function _cleanDoc(doc: JSONContent) {
  if (!doc || !Array.isArray(doc.content)) return doc

  let content = [...doc.content]

  const isEmptyParagraph = (node: JSONContent) =>
    node.type === 'paragraph' && (!node.content || node.content.length === 0)

  // Remove empty paragraphs at the start
  while (content.length > 0 && isEmptyParagraph(content[0])) {
    content.shift()
  }

  // Remove empty paragraphs at the end
  while (content.length > 0 && isEmptyParagraph(content[content.length - 1])) {
    content.pop()
  }

  // Trim leading/trailing hardBreaks within first and last paragraphs
  const trimHardBreaks = (paragraph: JSONContent, start: boolean, end: boolean) => {
    if (!paragraph.content) return paragraph

    const nodes = [...paragraph.content]

    // Remove hardBreaks at the start
    while (start && nodes.length > 0 && nodes[0].type === 'hardBreak') {
      nodes.shift()
    }

    // Remove hardBreaks at the end
    while (end && nodes.length > 0 && nodes[nodes.length - 1].type === 'hardBreak') {
      nodes.pop()
    }

    return {...paragraph, content: nodes}
  }

  if (content.length > 0) {
    content[0] = trimHardBreaks(content[0], true, false)
    if (content.length > 1) {
      content[content.length - 1] = trimHardBreaks(content[content.length - 1], false, true)
    }
  }

  // Remove any now-empty paragraphs created by hardBreak trimming
  content = content.filter(
    (node) => !(node.type === 'paragraph' && (!node.content || node.content.length === 0)),
  )

  return {...doc, content}
}
