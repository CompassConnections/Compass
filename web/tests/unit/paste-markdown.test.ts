import {markdownPasteHtml} from 'web/components/editor/paste-markdown'

/** Just enough of a `DataTransfer` for the helper: the two flavours it reads. */
const clipboard = (text: string, html = '') =>
  ({getData: (type: string) => (type === 'text/html' ? html : text)}) as DataTransfer

/** What a code editor puts on the clipboard: the same characters, wearing a syntax highlighter. */
const highlighted = (text: string) =>
  '<meta charset="utf-8">' +
  text
    .split('\n')
    .map((line) => `<div><span style="color: #ce9178;">${line || '<br>'}</span></div>`)
    .join('')

const DRAFT = `Every member picks how much of them goes in it:

- nothing at all
- name, city, headline and keywords
- the same plus gender

1. RSS→ActivityPub bridge
2. Post each new profile straight to our own account`

describe('markdownPasteHtml', () => {
  it('turns a Markdown draft into lists', () => {
    const html = markdownPasteHtml(clipboard(DRAFT))
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>nothing at all</li>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>RSS→ActivityPub bridge</li>')
  })

  it('still reads the Markdown when a code editor also supplies highlighted HTML', () => {
    expect(markdownPasteHtml(clipboard(DRAFT, highlighted(DRAFT)))).toContain('<ul>')
  })

  it('defers to HTML that carries real structure', () => {
    // Same visible words, but the bullets live in the markup rather than in the text.
    const rich = '<ul><li>nothing at all</li><li>name, city</li></ul>'
    expect(markdownPasteHtml(clipboard('- nothing at all\n- name, city', rich))).toBeNull()
  })

  it('leaves prose alone', () => {
    expect(markdownPasteHtml(clipboard('Thanks for the good comments. Feed shipped!'))).toBeNull()
  })

  it('does not read a hyphen or a diff as a list', () => {
    expect(markdownPasteHtml(clipboard('well-known member\n-removed a line'))).toBeNull()
  })

  it('handles headings, quotes and links', () => {
    const html = markdownPasteHtml(clipboard('# Feed\n\n> shipped\n\n[docs](https://x.dev)'))
    expect(html).toContain('<h1>Feed</h1>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<a href="https://x.dev">docs</a>')
  })

  it('keeps a wrapped paragraph as one paragraph', () => {
    const html = markdownPasteHtml(clipboard('- item\n\nA sentence that\nwraps in the source.'))
    expect(html).toContain('<p>A sentence that\nwraps in the source.</p>')
  })

  it('ignores an empty clipboard', () => {
    expect(markdownPasteHtml(clipboard('   '))).toBeNull()
    expect(markdownPasteHtml(null)).toBeNull()
  })
})
