import {getSchema} from '@tiptap/core'
import {Slice} from '@tiptap/pm/model'
import {extensions} from 'common/util/parse'
import {truncateSlice} from 'web/components/editor/paste-limit'

const schema = getSchema(extensions)

/** A slice built from JSONContent, the way the clipboard parser hands one to `transformPasted`. */
const slice = (content: any[], openStart = 0, openEnd = 0) =>
  new Slice(schema.nodeFromJSON({type: 'doc', content}).content, openStart, openEnd)

const bullets = (...items: string[]) => [
  {
    type: 'bulletList',
    content: items.map((text) => ({
      type: 'listItem',
      content: [{type: 'paragraph', content: [{type: 'text', text}]}],
    })),
  },
]

const json = (result: Slice) => schema.topNodeType.create(null, result.content).toJSON()

describe('truncateSlice', () => {
  it('leaves a slice that fits alone', () => {
    const original = slice(bullets('one', 'two'))
    expect(truncateSlice(original, 100)).toBe(original)
  })

  it('keeps the list structure when it has to cut', () => {
    const result = json(truncateSlice(slice(bullets('alpha', 'beta', 'gamma')), 7))
    expect(result).toEqual({type: 'doc', content: bullets('alpha', 'be')})
  })

  it('keeps marks on the text it keeps', () => {
    const bold = [
      {
        type: 'paragraph',
        content: [{type: 'text', marks: [{type: 'bold'}], text: 'important'}],
      },
    ]
    const result = json(truncateSlice(slice(bold), 4))
    expect(result.content[0].content[0]).toEqual({
      type: 'text',
      marks: [{type: 'bold'}],
      text: 'impo',
    })
  })

  it('counts a non-text leaf as one character, like CharacterCount does', () => {
    const withBreak = [
      {
        type: 'paragraph',
        content: [{type: 'text', text: 'ab'}, {type: 'hardBreak'}, {type: 'text', text: 'cd'}],
      },
    ]
    const result = json(truncateSlice(slice(withBreak), 4))
    expect(result.content[0].content).toEqual([
      {type: 'text', text: 'ab'},
      {type: 'hardBreak'},
      {type: 'text', text: 'c'},
    ])
  })

  it('drops the blocks that no longer hold any text', () => {
    const paragraphs = [
      {type: 'paragraph', content: [{type: 'text', text: 'kept'}]},
      {type: 'paragraph', content: [{type: 'text', text: 'dropped'}]},
    ]
    const result = json(truncateSlice(slice(paragraphs), 4))
    expect(result.content).toHaveLength(1)
  })

  it('clamps open depths to what survived the cut', () => {
    // Copying from the middle of one bullet to the middle of another leaves the slice open three
    // levels deep on both sides; cutting it must not leave those depths pointing at nothing.
    const result = truncateSlice(slice(bullets('alpha', 'beta'), 3, 3), 2)
    const doc = schema.nodeFromJSON({type: 'doc', content: bullets('here')})
    // Pasted back into a bullet, where a slice that open belongs. Throws if the depths are wrong.
    expect(() => doc.replace(3, 3, result)).not.toThrow()
    expect(doc.replace(3, 3, result).toJSON()).toEqual({type: 'doc', content: bullets('alhere')})
  })

  it('returns nothing when the editor is already at its limit', () => {
    expect(truncateSlice(slice(bullets('one')), 0)).toBe(Slice.empty)
  })
})
