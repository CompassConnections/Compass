import {JSONContent} from '@tiptap/core'
import {
  buildFootnoteIndex,
  footnoteLabelOf,
  isGoogleCommentAnchor,
} from 'web/components/editor/footnotes'

/** A paragraph whose text runs are `[text, href?]` pairs. */
const p = (...runs: (string | [string, string])[]): JSONContent => ({
  type: 'paragraph',
  content: runs.map((run) =>
    typeof run === 'string'
      ? {type: 'text', text: run}
      : {type: 'text', text: run[0], marks: [{type: 'link', attrs: {href: run[1]}}]},
  ),
})

const doc = (...content: JSONContent[]): JSONContent => ({type: 'doc', content})

/** The shape a pasted Google Doc arrives in: linked markers up top, comments in a block at the bottom. */
const googleDoc = doc(
  p('Please allow me to introduce myself', [
    '[b]',
    'https://www.compassmeet.com/Someone#cmnt_ref2',
  ]),
  p('I have lived my whole life in the SF area', ['[m]', '#cmnt_ref13']),
  p('Footnotes:'),
  p(['[b]', '#cmnt_ref2'], "I'm a man of wealth and taste"),
  p(['[m]', '#cmnt_ref13'], 'Until my arrival in Burien.'),
  p('But it is also a major metropolitan area.'),
)

describe('buildFootnoteIndex', () => {
  it('pairs markers with the definitions at the bottom', () => {
    const index = buildFootnoteIndex(googleDoc)!
    expect(index).toBeDefined()
    expect(Object.keys(index.byLabel).sort()).toEqual(['b', 'm'])
    expect(index.byLabel.b.text).toBe("I'm a man of wealth and taste")
    expect([...index.definitionAt]).toEqual([
      [4, 'm'],
      [3, 'b'],
    ])
  })

  it('folds trailing paragraphs into the footnote they follow', () => {
    const index = buildFootnoteIndex(googleDoc)!
    expect(index.byLabel.m.text).toBe(
      'Until my arrival in Burien.\n\nBut it is also a major metropolitan area.',
    )
  })

  it("keeps Google's anchor names as aliases", () => {
    const index = buildFootnoteIndex(googleDoc)!
    expect(index.byLabel.b.aliases).toEqual(['cmnt_ref2'])
  })

  it('still pairs a definition whose marker lost its link on paste', () => {
    const index = buildFootnoteIndex(
      doc(p('Read on', '[a]'), p("[a] Annoying to find these, isn't it?")),
    )!
    expect(index.byLabel.a.text).toBe("Annoying to find these, isn't it?")
    expect(index.byLabel.a.aliases).toEqual([])
  })

  it('ignores definitions the body never refers to', () => {
    expect(
      buildFootnoteIndex(doc(p('No markers here'), p('[a] a dangling footnote'))),
    ).toBeUndefined()
  })

  it('ignores a bio that merely contains bracketed text', () => {
    expect(buildFootnoteIndex(doc(p('I like lists [a] and [b]'), p('The end.')))).toBeUndefined()
  })

  it('stops before a long run of ordinary prose', () => {
    const prose = Array.from({length: 9}, (_, i) => p(`paragraph ${i}`))
    expect(
      buildFootnoteIndex(doc(p('marker', '[a]'), p('[a] real footnote'), ...prose)),
    ).toBeUndefined()
  })

  it('stops at a repeated marker rather than walking into prose', () => {
    const index = buildFootnoteIndex(
      doc(p('marker', '[a]'), p('[a] the earlier one'), p('[a] the real footnote')),
    )!
    expect(index.byLabel.a.text).toBe('the real footnote')
    expect(index.definitionAt.size).toBe(1)
  })

  it('handles empty and missing documents', () => {
    expect(buildFootnoteIndex(undefined)).toBeUndefined()
    expect(buildFootnoteIndex(doc())).toBeUndefined()
  })
})

describe('footnoteLabelOf', () => {
  const index = buildFootnoteIndex(googleDoc)!

  it('matches a bare marker for a known footnote', () => {
    expect(footnoteLabelOf('[b]', index)).toBe('b')
    expect(footnoteLabelOf(' [B] ', index)).toBe('b')
  })

  it('ignores unknown markers and text that merely contains one', () => {
    expect(footnoteLabelOf('[z]', index)).toBeUndefined()
    expect(footnoteLabelOf('see [b] below', index)).toBeUndefined()
  })
})

describe('isGoogleCommentAnchor', () => {
  it('recognises the dangling anchors, relative or absolute', () => {
    expect(isGoogleCommentAnchor('#cmnt_ref2')).toBe(true)
    expect(isGoogleCommentAnchor('#cmnt3')).toBe(true)
    expect(isGoogleCommentAnchor('https://www.compassmeet.com/Someone#cmnt_ref2')).toBe(true)
  })

  it('leaves real links alone', () => {
    expect(
      isGoogleCommentAnchor('https://waitbutwhy.com/2014/02/pick-life-partner-part-2.html'),
    ).toBe(false)
    expect(isGoogleCommentAnchor('#section-2')).toBe(false)
    expect(isGoogleCommentAnchor(undefined)).toBe(false)
  })
})
