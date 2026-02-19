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
})
