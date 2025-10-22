import {
  getText,
  getSchema,
  getTextSerializersFromSchema,
  JSONContent,
} from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { StarterKit } from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Mention } from '@tiptap/extension-mention'
import Iframe from './tiptap-iframe'
import { find } from 'linkifyjs'
import { uniq } from 'lodash'
import { compareTwoStrings } from 'string-similarity'

/** get first url in text. like "notion.so " -> "http://notion.so"; "notion" -> null */
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
  Image.extend({ renderText: () => '[image]' }),
  Mention, // user @mention
  Iframe.extend({
    renderText: ({ node }) =>
      '[embed]' + node.attrs.src ? `(${node.attrs.src})` : '',
  }),
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

export function parseJsonContentToText(content: JSONContent | string) {
  return typeof content === 'string' ? content : richTextToString(content)
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}