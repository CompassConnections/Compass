import {Readability} from '@mozilla/readability'
import {JSONContent} from '@tiptap/core'
import {debug} from 'common/logger'
import {parseJsonContentToText} from 'common/util/parse'
import {JSDOM} from 'jsdom'
import {marked} from 'marked'

export function htmlToJSONContent(html: string, url: string): JSONContent {
  // Tier 1: Try __NEXT_DATA__ (Next.js, free, structured)
  const nextData = extractNextData(html)
  const nextContent = nextDataToJSONContent(nextData)

  // Tier 2: Try Readability on raw HTML (works for ~75% of the web)
  const result = tryReadability(html, url)

  if (nextContent.content) result.content = [...nextContent.content, ...(result.content || [])]

  return result

  // Tier 3: Puppeteer fallback (CSR catch-all, expensive, high mem usage, and needs chrome deps in container — only if needed)
  // To implement if really needed (i.e., lots of users want to extract profile info from client-side rendered pages)
  // const renderedHtml = await fetchWithBrowser(url)
  // return tryReadability(renderedHtml, url) ?? emptyContent()
}

/** Whether a parsed document carries any actual prose, as opposed to only empty structure. */
export function hasText(content: JSONContent | null | undefined): boolean {
  return parseJsonContentToText(content).trim().length > 0
}

/**
 * Sites that cannot be scraped at all, mapped to their display name. LinkedIn answers any
 * unauthenticated request with HTTP 999 regardless of user agent — it is an IP/session block, not
 * something headers can talk their way past — so there is nothing to parse and no point retrying.
 * Detected up front so the user gets told what to do instead of a generic fetch failure.
 */
const BLOCKED_PROFILE_HOSTS: Record<string, string> = {
  'linkedin.com': 'LinkedIn',
  // Instagram answers 200 but with a bare SPA shell: the body carries no text at all, so an
  // extraction from it would quietly come back empty.
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
}

export function getBlockedProfileHost(url: string): string | null {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return null
  }

  for (const [domain, name] of Object.entries(BLOCKED_PROFILE_HOSTS)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) return name
  }
  return null
}

function extractNextData(html: string): Record<string, any> | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function extractContent(obj: unknown, depth = 0): JSONContent[] {
  if (depth > 6) return []
  if (typeof obj === 'string' && obj.trim().length > 0)
    return [
      {
        type: 'paragraph',
        content: [{type: 'text', text: obj.trim()}],
      },
    ]
  if (Array.isArray(obj)) return obj.flatMap((v) => extractContent(v, depth + 1))
  if (obj && typeof obj === 'object') {
    const record = obj as Record<string, unknown>
    if (record.type === 'doc' && Array.isArray(record.content)) {
      return [obj] as JSONContent[]
    }
    return Object.values(obj).flatMap((v) => extractContent(v, depth + 1))
  }
  return []
}

function nextDataToJSONContent(nextData: Record<string, any> | null): JSONContent {
  return {
    type: 'doc',
    content: extractContent(nextData?.props?.pageProps ?? {}),
  }
}

function tryReadability(html: string, url: string): JSONContent {
  const dom = new JSDOM(html, {url})
  const document = dom.window.document

  const reader = new Readability(document.cloneNode(true) as any, {
    keepClasses: true,
  })
  const article = reader.parse()

  if (article?.content) {
    debug('Using readability content')
    const cleanDom = new JSDOM(article.content)
    const classStyles = extractClassStyles(document)
    return parseHtmlBodyToJSONContent(cleanDom.window.document, classStyles)
  }
  return parseHtmlBodyToJSONContent(document)
}

function plainTextToJSONContent(text: string): JSONContent {
  const paragraphs = text
    .split(/\n{2,}/) // split on blank lines
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({
      type: 'paragraph' as const,
      content: [{type: 'text' as const, text: p}],
    }))

  return {type: 'doc', content: paragraphs}
}

function extractClassStyles(document: Document): Map<string, Record<string, string>> {
  const classStyles = new Map<string, Record<string, string>>()

  for (const styleEl of document.querySelectorAll('style')) {
    const css = styleEl.textContent ?? ''

    // Match .className { prop: value; prop: value }
    const ruleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)}/g
    let match
    while ((match = ruleRegex.exec(css)) !== null) {
      const className = match[1]
      const declarations = match[2]
      const styles = parseStyleString(declarations)
      classStyles.set(className, styles)
    }
  }

  return classStyles
}

export function parseHtmlBodyToJSONContent(
  document: Document,
  classStyles?: Map<string, Record<string, string>>,
): JSONContent {
  const body = document.body
  classStyles ??= extractClassStyles(document)
  const content = parseBlockElements(body.children, classStyles)
  return {type: 'doc', content}
}

function parseBlockElements(
  children: HTMLCollection | Element[],
  classStyles: Map<string, Record<string, string>>,
): JSONContent[] {
  const content: JSONContent[] = []

  for (const el of Array.from(children)) {
    const tag = el.tagName.toLowerCase()
    const node = parseBlockElement(el, tag, classStyles)
    if (!node) continue

    if ((node as any).type === '__fragment') {
      // Recursively flatten — fragments can contain fragments
      content.push(...flattenFragment(node as any))
    } else {
      content.push(node)
    }
  }

  return content
}

function flattenFragment(node: any): JSONContent[] {
  return node.content.flatMap((child: any) =>
    child.type === '__fragment' ? flattenFragment(child) : [child],
  )
}

function parseBlockElement(
  el: Element,
  tag: string,
  classStyles: Map<string, Record<string, string>>,
): JSONContent | null {
  // console.debug('parseBlockElement', {tag, el})
  // Headings h1–h6
  if (/^h[1-6]$/.test(tag)) {
    return {
      type: 'heading',
      attrs: {level: parseInt(tag[1])},
      content: parseInlineElements(el, classStyles),
    }
  }

  // Paragraph
  if (tag === 'p') {
    const inline = parseInlineElements(el, classStyles)
    return inline.length > 0 ? {type: 'paragraph', content: inline} : null
  }

  // Lists
  if (tag === 'ol') {
    return {
      type: 'orderedList',
      attrs: {start: 1}, // ← required by TipTap's OrderedList extension
      content: parseListItems(el, classStyles),
    }
  }
  if (tag === 'ul') {
    return {
      type: 'bulletList',
      attrs: {},
      content: parseListItems(el, classStyles),
    }
  }
  // Blockquote
  if (tag === 'blockquote') {
    return {
      type: 'blockquote',
      content: parseBlockElements(el.children, classStyles),
    }
  }

  // Code block  <pre><code>...</code></pre>
  if (tag === 'pre') {
    const codeEl = el.querySelector('code')
    const language = codeEl?.className.match(/language-(\w+)/)?.[1] ?? null
    return {
      type: 'codeBlock',
      attrs: {language},
      content: [{type: 'text', text: (codeEl ?? el).textContent ?? ''}],
    }
  }

  // Inline code outside of pre (treat as paragraph)
  if (tag === 'code') {
    return {
      type: 'paragraph',
      content: [{type: 'text', text: el.textContent ?? '', marks: [{type: 'code'}]}],
    }
  }

  // Horizontal rule
  if (tag === 'hr') {
    return {type: 'horizontalRule'}
  }

  // Image
  if (tag === 'img') {
    const src = el.getAttribute('src')
    if (!src || !src.startsWith('http')) return null
    return {
      type: 'image',
      attrs: {
        src,
        alt: el.getAttribute('alt') ?? null,
        title: el.getAttribute('title') ?? null,
      },
    }
  }

  // Figure (image + optional caption)
  if (tag === 'figure') {
    const img = el.querySelector('img')
    const caption = el.querySelector('figcaption')?.textContent ?? null
    const src = img?.getAttribute('src')
    if (!src || !src.startsWith('http')) return null
    return {
      type: 'image',
      attrs: {
        src: img?.getAttribute('src'),
        alt: img?.getAttribute('alt') ?? caption,
        title: caption,
      },
    }
  }

  // Table
  if (tag === 'table') {
    return parseTable(el, classStyles)
  }

  // Container elements — recurse into children
  if (['div', 'section', 'article', 'main', 'header', 'footer', 'aside'].includes(tag)) {
    const inner = parseBlockElementsWithText(el, classStyles)
    if (inner.length === 0) return null
    if (inner.length === 1) return inner[0]

    // Always use fragment — never paragraph — for multiple block children
    return {type: '__fragment', content: inner} as any
  }

  // Unknown/custom elements — try to parse as container (e.g., <projectcontent>, <bodycopy>)
  if (el.children.length > 0) {
    const inner = parseBlockElements(el.children, classStyles)
    if (inner.length === 0) return null
    if (inner.length === 1) return inner[0]
    return {type: '__fragment', content: inner} as any
  }

  return null
}

function parseBlockElementsWithText(
  el: Element,
  classStyles: Map<string, Record<string, string>>,
): JSONContent[] {
  const content: JSONContent[] = []

  for (const child of el.childNodes) {
    // Bare text node directly in a div — wrap in paragraph
    if (child.nodeType === 3) {
      const text = (child.textContent ?? '').trim()
      if (text) content.push({type: 'paragraph', content: [{type: 'text', text}]})
      continue
    }

    if (child.nodeType !== 1) continue
    const childEl = child as Element
    const tag = childEl.tagName.toLowerCase()

    // Treat span.section-header as a heading
    if (tag === 'span' && childEl.classList.contains('section-header')) {
      const text = childEl.textContent?.trim()
      if (text) content.push({type: 'heading', attrs: {level: 2}, content: [{type: 'text', text}]})
      continue
    }

    const node = parseBlockElement(childEl, tag, classStyles)
    if (!node) continue

    if ((node as any).type === '__fragment') {
      content.push(...flattenFragment(node as any))
    } else {
      content.push(node)
    }
  }

  return content
}

function parseStyleString(style: string): Record<string, string> {
  return Object.fromEntries(
    style
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((declaration) => {
        const [prop, ...rest] = declaration.split(':')
        const value = rest.join(':').trim()
        // Convert kebab-case to camelCase (e.g. font-weight → fontWeight)
        const camelProp = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        return [camelProp, value]
      }),
  )
}

function parseListItems(
  listEl: Element,
  classStyles: Map<string, Record<string, string>>,
): JSONContent[] {
  return Array.from(listEl.querySelectorAll(':scope > li')).map((li) => {
    const nestedList = li.querySelector('ul, ol')
    const blockContent: JSONContent[] = [
      {type: 'paragraph', content: parseInlineElements(li, classStyles, true)},
    ]

    if (nestedList) {
      const nestedTag = nestedList.tagName.toLowerCase()
      blockContent.push({
        type: nestedTag === 'ul' ? 'bulletList' : 'orderedList',
        content: parseListItems(nestedList, classStyles),
      })
    }

    return {type: 'listItem', content: blockContent}
  })
}

function parseTable(
  tableEl: Element,
  classStyles: Map<string, Record<string, string>>,
): JSONContent {
  const rows = Array.from(tableEl.querySelectorAll('tr'))

  return {
    type: 'table',
    content: rows.map((row, rowIndex) => ({
      type: 'tableRow',
      content: Array.from(row.querySelectorAll('td, th')).map((cell) => ({
        type: rowIndex === 0 || cell.tagName.toLowerCase() === 'th' ? 'tableHeader' : 'tableCell',
        attrs: {
          colspan: parseInt(cell.getAttribute('colspan') ?? '1'),
          rowspan: parseInt(cell.getAttribute('rowspan') ?? '1'),
        },
        content: [{type: 'paragraph', content: parseInlineElements(cell, classStyles)}],
      })),
    })),
  }
}

function parseInlineElements(
  el: Element,
  classStyles: Map<string, Record<string, string>>,
  skipNested = false,
): JSONContent[] {
  const nodes: JSONContent[] = []

  for (const child of el.childNodes) {
    // Plain text node
    if (child.nodeType === 3) {
      let text = child.textContent ?? ''

      // Remove HTML tags from text
      text = text.replace('<aside>', '\n').replace('</aside>', '\n')

      if (text.trim()) nodes.push({type: 'text', text})
      continue
    }

    if (child.nodeType !== 1) continue
    const childEl = child as Element
    const tag = childEl.tagName.toLowerCase()

    // Skip nested lists when extracting list item text
    if (skipNested && ['ul', 'ol'].includes(tag)) continue

    // Line break
    if (tag === 'br') {
      nodes.push({type: 'hardBreak'})
      continue
    }

    // Inline image
    if (tag === 'img') {
      const src = childEl.getAttribute('src')
      if (src && src.startsWith('http')) nodes.push({type: 'image', attrs: {src}})
      continue
    }

    // Marks
    const marks = getMarks(childEl, tag, classStyles)

    const isInlineContainer = [
      'span',
      'a',
      'strong',
      'em',
      'b',
      'i',
      'u',
      's',
      'mark',
      'code',
      'label',
    ].includes(tag)
    const hasChildElements = childEl.children.length > 0

    if (isInlineContainer && hasChildElements) {
      // Recurse into children and apply this element's marks on top
      const innerNodes = parseInlineElements(childEl, classStyles, skipNested)
      for (const inner of innerNodes) {
        if (inner.type === 'text' && marks.length > 0) {
          // Merge marks — avoid duplicates
          const existingTypes = new Set((inner.marks ?? []).map((m: any) => m.type))
          const newMarks = marks.filter((m) => !existingTypes.has(m.type as string))
          nodes.push({
            ...inner,
            marks: [...(inner.marks ?? []), ...newMarks],
          } as JSONContent)
        } else {
          nodes.push(inner)
        }
      }
      continue
    }

    const text = childEl.textContent ?? ''
    if (!text) continue

    nodes.push({
      type: 'text',
      text,
      ...(marks.length > 0 && {marks: marks as Array<{type: string; attrs?: Record<string, any>}>}),
    })
  }

  return nodes
}

function getMarks(
  el: Element,
  tag: string,
  classStyles: Map<string, Record<string, string>>,
): JSONContent[] {
  const marks: JSONContent[] = []

  if (['b', 'strong'].includes(tag)) marks.push({type: 'bold'})
  if (['i', 'em'].includes(tag)) marks.push({type: 'italic'})
  if (tag === 'u') marks.push({type: 'underline'})
  if (['s', 'strike', 'del'].includes(tag)) marks.push({type: 'strike'})
  if (tag === 'code') marks.push({type: 'code'})
  if (tag === 'mark') marks.push({type: 'highlight'})

  if (tag === 'a') {
    const href = cleanHref(el.getAttribute('href') ?? '')
    marks.push({
      type: 'link',
      attrs: {href, target: '_blank'},
    })
  }

  const style: Record<string, string> = {}
  const classes = Array.from(el.classList)
  for (const cls of classes) {
    const resolved = classStyles.get(cls)
    if (resolved) Object.assign(style, resolved)
  }
  const inlineStyle = parseStyleString(el.getAttribute('style') ?? '')
  Object.assign(style, inlineStyle)

  if (!marks.find((m) => m.type === 'bold') && /^(bold|[7-9]\d{2})$/.test(style.fontWeight ?? '')) {
    marks.push({type: 'bold'})
  }

  if (!marks.find((m) => m.type === 'italic') && style.fontStyle === 'italic') {
    marks.push({type: 'italic'})
  }

  if (style.textDecoration?.includes('underline') && !marks.find((m) => m.type === 'underline')) {
    marks.push({type: 'underline'})
  }

  if (style.textDecoration?.includes('line-through') && !marks.find((m) => m.type === 'strike')) {
    marks.push({type: 'strike'})
  }

  return marks
}

function cleanHref(href: string): string {
  try {
    const url = new URL(href)
    if (url.hostname === 'www.google.com' && url.pathname === '/url') {
      return url.searchParams.get('q') ?? href
    }
  } catch (error) {
    debug('Invalid URL:', href, error)
  }
  return href
}

export function extractGoogleDocId(url: string) {
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9-_]+)\/edit/, // standard /d/{id}/edit format
    /\/document\/d\/([a-zA-Z0-9-_]+)\/preview/, // standard /d/{id}/preview format
    // /id=([a-zA-Z0-9-_]+)/, // ?id= query param format (catches false negatives)
    // /^([a-zA-Z0-9-_]+)$/, // raw ID passed directly (catches false negatives)
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Notion pages are client-rendered: a plain fetch only ever returns the SPA shell whose <noscript>
 * body reads "JavaScript must be enabled in order to use Notion." The page content lives behind
 * notion.so's internal `loadPageChunk` API, which serves public pages without auth (see
 * `fetchNotionRecordMap` in backend/api/src/llm-extract-profile.ts). What comes back is a
 * `recordMap` — a flat id → block dictionary — which we walk here into TipTap JSONContent.
 */
export function extractNotionPageId(url: string): string | null {
  let hostname: string
  let pathname: string
  try {
    const parsed = new URL(url)
    hostname = parsed.hostname
    pathname = parsed.pathname
  } catch {
    return null
  }

  const isNotionHost = ['notion.so', 'notion.com', 'notion.site'].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  )
  if (!isNotionHost) return null

  // The id is the last path segment, either bare 32-hex or a dashed uuid, usually preceded by a
  // slugified title (e.g. /p/Date-Tristan-1b5e1848224780a1ab1fcd5e4260ed16).
  const dashed = pathname.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (dashed) return dashed[1].toLowerCase()

  const bare = pathname.match(/([0-9a-f]{32})(?:[^0-9a-f]|$)/i)
  if (!bare) return null
  const id = bare[1].toLowerCase()
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
}

/** A single [text, marks?] segment of a Notion rich-text array. */
type NotionRichText = [string, Array<[string, ...any[]]>?]

export type NotionRecordMap = {
  block?: Record<string, {value?: {value?: NotionBlock} & NotionBlock}>
}

type NotionBlock = {
  id: string
  type: string
  properties?: Record<string, NotionRichText[]>
  content?: string[]
  format?: Record<string, any>
}

function notionRichTextToInline(title: NotionRichText[] | undefined): JSONContent[] {
  if (!title) return []

  const nodes: JSONContent[] = []
  for (const segment of title) {
    const text = segment?.[0]
    if (typeof text !== 'string' || !text) continue

    const marks: JSONContent[] = []
    for (const mark of segment[1] ?? []) {
      const [kind, value] = mark
      if (kind === 'b') marks.push({type: 'bold'})
      else if (kind === 'i') marks.push({type: 'italic'})
      else if (kind === '_') marks.push({type: 'underline'})
      else if (kind === 's') marks.push({type: 'strike'})
      else if (kind === 'c') marks.push({type: 'code'})
      // 'h' is Notion's text/background colour. There is no highlight mark in our TipTap schema
      // (see common/util/parse `extensions`), and colour carries nothing for profile extraction.
      else if (kind === 'a' && typeof value === 'string') {
        marks.push({type: 'link', attrs: {href: value, target: '_blank'}})
      }
    }

    nodes.push({
      type: 'text',
      text,
      ...(marks.length > 0 && {marks: marks as Array<{type: string; attrs?: Record<string, any>}>}),
    })
  }

  return nodes
}

const NOTION_HEADING_LEVELS: Record<string, number> = {
  header: 1,
  sub_header: 2,
  sub_sub_header: 3,
}

function notionBlocksToJSONContent(
  ids: string[],
  blocks: Record<string, NotionBlock>,
  depth = 0,
): JSONContent[] {
  if (depth > 10) return []

  const content: JSONContent[] = []

  // Notion stores list items as individual sibling blocks; TipTap needs them wrapped in a single
  // list node, so consecutive items of the same kind get collected as we go.
  let listType: 'bulletList' | 'orderedList' | null = null
  let listItems: JSONContent[] = []
  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null
      listItems = []
      return
    }
    content.push({
      type: listType,
      ...(listType === 'orderedList' && {attrs: {start: 1}}),
      content: listItems,
    })
    listType = null
    listItems = []
  }

  for (const id of ids) {
    const block = blocks[id]
    if (!block) continue

    const inline = notionRichTextToInline(block.properties?.title)
    const children = block.content ?? []

    const itemType =
      block.type === 'numbered_list'
        ? ('orderedList' as const)
        : ['bulleted_list', 'to_do'].includes(block.type)
          ? ('bulletList' as const)
          : null

    if (itemType) {
      if (listType && listType !== itemType) flushList()
      listType = itemType

      const checked = block.properties?.checked?.[0]?.[0]
      const prefix =
        block.type === 'to_do' ? [{type: 'text', text: checked === 'Yes' ? '[x] ' : '[ ] '}] : []
      const itemContent: JSONContent[] = [
        {type: 'paragraph', content: [...prefix, ...inline]},
        ...(children.length ? notionBlocksToJSONContent(children, blocks, depth + 1) : []),
      ]
      listItems.push({type: 'listItem', content: itemContent})
      continue
    }

    flushList()

    const headingLevel = NOTION_HEADING_LEVELS[block.type]
    if (headingLevel) {
      if (inline.length)
        content.push({type: 'heading', attrs: {level: headingLevel}, content: inline})
    } else if (block.type === 'divider') {
      content.push({type: 'horizontalRule'})
    } else if (block.type === 'code') {
      const text = (block.properties?.title ?? []).map((s) => s?.[0] ?? '').join('')
      content.push({
        type: 'codeBlock',
        attrs: {language: block.format?.language ?? null},
        content: text ? [{type: 'text', text}] : [],
      })
    } else if (['quote', 'callout'].includes(block.type)) {
      content.push({
        type: 'blockquote',
        content: [
          ...(inline.length ? [{type: 'paragraph', content: inline}] : []),
          ...(children.length ? notionBlocksToJSONContent(children, blocks, depth + 1) : []),
        ],
      })
      continue
    } else if (block.type === 'image') {
      // Notion's own uploads sit behind signed S3 URLs that expire, so only externally hosted
      // images survive being stored in a bio.
      const src = block.format?.display_source ?? block.properties?.source?.[0]?.[0]
      if (typeof src === 'string' && /^https?:\/\//.test(src) && !src.includes('secure.notion')) {
        content.push({type: 'image', attrs: {src, alt: null, title: null}})
      }
    } else if (inline.length) {
      content.push({type: 'paragraph', content: inline})
    }

    // page / toggle / column_list / column / anything unhandled: keep walking the tree so no text
    // is silently dropped.
    if (children.length) content.push(...notionBlocksToJSONContent(children, blocks, depth + 1))
  }

  flushList()

  return content
}

export function notionRecordMapToJSONContent(
  recordMap: NotionRecordMap,
  rootId: string,
): JSONContent {
  const blocks: Record<string, NotionBlock> = {}
  for (const [id, record] of Object.entries(recordMap.block ?? {})) {
    // The API nests the block one or two levels deep depending on the endpoint.
    const value = (record?.value?.value ?? record?.value) as NotionBlock | undefined
    if (value?.type) blocks[id] = value
  }

  const root = blocks[rootId]
  if (!root) {
    debug('Notion record map has no root block', {rootId, blockCount: Object.keys(blocks).length})
    return {type: 'doc', content: []}
  }

  const title = notionRichTextToInline(root.properties?.title)
  const content: JSONContent[] = [
    ...(title.length ? [{type: 'heading', attrs: {level: 1}, content: title}] : []),
    ...notionBlocksToJSONContent(root.content ?? [], blocks),
  ]

  return {type: 'doc', content}
}

function markdownToJSONContent(markdown: string): JSONContent {
  const html = marked(markdown) as string
  const dom = new JSDOM(html)
  return parseHtmlBodyToJSONContent(dom.window.document)
}

export function convertToJSONContent(
  content: string,
  contentType: string,
  url: string,
): JSONContent {
  if (contentType.includes('text/html')) {
    return htmlToJSONContent(content, url) // use Readability for articles
  }

  if (contentType.includes('text/markdown') || url.endsWith('.md')) {
    return markdownToJSONContent(content)
  }

  // plain text fallback
  return plainTextToJSONContent(content)
}
