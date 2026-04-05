import {Readability} from '@mozilla/readability'
import {JSONContent} from '@tiptap/core'
import {debug} from 'common/logger'
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
    /\/document\/d\/([a-zA-Z0-9-_]+)/, // standard /d/{id}/ format
    /id=([a-zA-Z0-9-_]+)/, // ?id= query param format
    /^([a-zA-Z0-9-_]+)$/, // raw ID passed directly
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
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
