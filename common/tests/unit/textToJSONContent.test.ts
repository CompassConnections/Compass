import {concatJSONContent, parseJsonContentToText, textToJSONContent} from 'common/util/parse'

describe('textToJSONContent', () => {
  it('makes one paragraph per blank-line-separated block', () => {
    expect(textToJSONContent('First para.\n\nSecond para.')).toEqual({
      type: 'doc',
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'First para.'}]},
        {type: 'paragraph', content: [{type: 'text', text: 'Second para.'}]},
      ],
    })
  })

  // The LLM writing our bios routinely uses one '\n' between paragraphs no matter how firmly the
  // prompt asks for two; without this the whole bio collapsed into a single paragraph.
  it('treats single newlines as paragraph breaks when there is no blank line anywhere', () => {
    expect(textToJSONContent('One\nTwo')).toEqual({
      type: 'doc',
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'One'}]},
        {type: 'paragraph', content: [{type: 'text', text: 'Two'}]},
      ],
    })
  })

  it('keeps single newlines as hard breaks once blank lines establish the paragraphing', () => {
    expect(textToJSONContent('One\nTwo\n\nThree')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'One'}, {type: 'hardBreak'}, {type: 'text', text: 'Two'}],
        },
        {type: 'paragraph', content: [{type: 'text', text: 'Three'}]},
      ],
    })
  })

  it('collapses runs of blank lines and trims whitespace', () => {
    expect(textToJSONContent('  A  \n\n \n\n  B  ')).toEqual({
      type: 'doc',
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'A'}]},
        {type: 'paragraph', content: [{type: 'text', text: 'B'}]},
      ],
    })
  })

  it('returns a valid empty doc for empty input', () => {
    expect(textToJSONContent('   ')).toEqual({type: 'doc', content: [{type: 'paragraph'}]})
  })

  it('round-trips through the rich text serializer', () => {
    const text = 'I grew up in Liège.\n\nI now live in Brussels.'
    expect(parseJsonContentToText(textToJSONContent(text))).toBe(text)
  })
})

describe('concatJSONContent', () => {
  const doc = (...texts: string[]) => ({
    type: 'doc',
    content: texts.map((text) => ({type: 'paragraph', content: [{type: 'text', text}]})),
  })

  it('appends the second document after the first', () => {
    expect(concatJSONContent(doc('One'), doc('Two'))).toEqual(doc('One', 'Two'))
  })

  it('does not accumulate blank paragraphs at the join', () => {
    const trailingBlank = {
      type: 'doc',
      content: [{type: 'paragraph', content: [{type: 'text', text: 'One'}]}, {type: 'paragraph'}],
    }
    expect(concatJSONContent(trailingBlank, doc('Two'))).toEqual(doc('One', 'Two'))
  })

  it('returns the other side when one is missing or empty', () => {
    expect(concatJSONContent(null, doc('Only'))).toEqual(doc('Only'))
    expect(concatJSONContent(doc('Only'), undefined)).toEqual(doc('Only'))
  })

  it('returns a valid empty doc when both sides are empty', () => {
    expect(concatJSONContent(null, null)).toEqual({type: 'doc', content: [{type: 'paragraph'}]})
  })
})
