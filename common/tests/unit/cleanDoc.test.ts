import {cleanDoc} from '../../src/util/parse'

describe('cleanDoc', () => {
  it('no change', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'Good morning Sir'}, {type: 'hardBreak'}],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World',
            },
          ],
        },
      ],
    }
    const cleanedDoc = cleanDoc(doc)
    expect(cleanedDoc).toEqual(doc)
  })
  it('trims start hard breaks', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {type: 'hardBreak'},
            {type: 'hardBreak'},
            {type: 'text', text: 'Good morning Sir'},
            {type: 'hardBreak'},
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World',
            },
          ],
        },
      ],
    }
    const cleanedDoc = cleanDoc(doc)
    expect(cleanedDoc).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'Good morning Sir'}, {type: 'hardBreak'}],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World',
            },
          ],
        },
      ],
    })
  })
  it('trims end hard breaks', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'Good morning Sir'}, {type: 'hardBreak'}],
        },
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'Hello World'}, {type: 'hardBreak'}, {type: 'hardBreak'}],
        },
      ],
    }
    const cleanedDoc = cleanDoc(doc)
    expect(cleanedDoc).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'Good morning Sir'}, {type: 'hardBreak'}],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World',
            },
          ],
        },
      ],
    })
  })

  // What the desktop composer produces for a blank line: Enter submits there, so Shift+Enter twice
  // is the only way to type one. Pasting the same text gives real paragraphs — these must match.
  it('splits a paragraph on a double hard break', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {type: 'text', text: 'Abc'},
            {type: 'hardBreak'},
            {type: 'hardBreak'},
            {type: 'text', text: 'DEF'},
          ],
        },
      ],
    }
    expect(cleanDoc(doc)).toEqual({
      type: 'doc',
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'Abc'}]},
        {type: 'paragraph', content: [{type: 'text', text: 'DEF'}]},
      ],
    })
  })

  it('keeps a lone hard break as a line break', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {type: 'text', text: 'Abc'},
            {type: 'hardBreak'},
            {type: 'text', text: 'DEF'},
            {type: 'hardBreak'},
            {type: 'hardBreak'},
            {type: 'text', text: 'GHI'},
          ],
        },
      ],
    }
    expect(cleanDoc(doc)).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'Abc'}, {type: 'hardBreak'}, {type: 'text', text: 'DEF'}],
        },
        {type: 'paragraph', content: [{type: 'text', text: 'GHI'}]},
      ],
    })
  })

  // Three-plus breaks collapse to one split, matching how textToJSONContent collapses blank lines.
  it('collapses a longer run of hard breaks into a single split', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {type: 'text', text: 'Abc'},
            {type: 'hardBreak'},
            {type: 'hardBreak'},
            {type: 'hardBreak'},
            {type: 'text', text: 'DEF'},
          ],
        },
      ],
    }
    expect(cleanDoc(doc)).toEqual({
      type: 'doc',
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'Abc'}]},
        {type: 'paragraph', content: [{type: 'text', text: 'DEF'}]},
      ],
    })
  })

  it('preserves marks and other inline nodes across a split', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {type: 'text', text: 'Abc', marks: [{type: 'bold'}]},
            {type: 'hardBreak'},
            {type: 'hardBreak'},
            {type: 'mention', attrs: {id: 'u1', label: 'ivo'}},
            {type: 'text', text: ' hi'},
          ],
        },
      ],
    }
    expect(cleanDoc(doc)).toEqual({
      type: 'doc',
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'Abc', marks: [{type: 'bold'}]}]},
        {
          type: 'paragraph',
          content: [
            {type: 'mention', attrs: {id: 'u1', label: 'ivo'}},
            {type: 'text', text: ' hi'},
          ],
        },
      ],
    })
  })
})
