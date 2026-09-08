import {
  MAX_OPTION_NAME_LENGTH,
  normalizeOptionName,
  optionNameKey,
  optionNameProblem,
  splitOptionNames,
} from 'common/profiles/option-name'

describe('normalizeOptionName', () => {
  it('uppercases the first character and nothing else', () => {
    expect(normalizeOptionName('video games')).toBe('Video games')
    expect(normalizeOptionName('rock climbing')).toBe('Rock climbing')
  })

  it('leaves an existing capital alone rather than title-casing around it', () => {
    // The rule the whole corpus depends on: title case would turn "Video games" into "Video Games"
    // and make every new option clash with every old one.
    expect(normalizeOptionName('Video games')).toBe('Video games')
    expect(normalizeOptionName('AI')).toBe('AI')
    expect(normalizeOptionName('iOS')).toBe('iOS')
    expect(normalizeOptionName('AI safety')).toBe('AI safety')
  })

  it('cannot recover a capital the writer did not type', () => {
    // Nothing can tell "ai" from a word that genuinely starts a sentence, so this is left wrong on
    // purpose. Case-insensitive identity is what saves it: "ai" resolves to the existing "AI"
    // instead of becoming a second option.
    expect(normalizeOptionName('ai')).toBe('Ai')
    expect(optionNameKey('ai')).toBe(optionNameKey('AI'))
  })

  it('does not lowercase proper nouns it cannot judge', () => {
    expect(normalizeOptionName('Rock climbing in Yosemite')).toBe('Rock climbing in Yosemite')
    expect(normalizeOptionName('Bach')).toBe('Bach')
  })

  it('collapses whitespace, including non-breaking spaces from a paste', () => {
    expect(normalizeOptionName('  video   games  ')).toBe('Video games')
    expect(normalizeOptionName('video games')).toBe('Video games')
    expect(normalizeOptionName('video\n\tgames')).toBe('Video games')
  })

  it('strips trailing sentence punctuation without eating meaningful symbols', () => {
    expect(normalizeOptionName('Cooking.')).toBe('Cooking')
    expect(normalizeOptionName('Cooking!!')).toBe('Cooking')
    // The reason the stripped set is closed rather than "all punctuation".
    expect(normalizeOptionName('C++')).toBe('C++')
    expect(normalizeOptionName('Sci-fi')).toBe('Sci-fi')
  })

  it('leaves a name starting with a digit unchanged', () => {
    expect(normalizeOptionName('3D printing')).toBe('3D printing')
  })

  it('returns empty for input with nothing in it', () => {
    expect(normalizeOptionName('   ')).toBe('')
    expect(normalizeOptionName('')).toBe('')
  })
})

describe('optionNameKey', () => {
  it('gives casing and spacing variants one identity', () => {
    const key = optionNameKey('Gaming')
    expect(optionNameKey('gaming')).toBe(key)
    expect(optionNameKey('GAMING')).toBe(key)
    expect(optionNameKey('  gaming  ')).toBe(key)
    expect(optionNameKey('Gaming.')).toBe(key)
  })

  it('keeps genuinely different names apart', () => {
    expect(optionNameKey('Gaming')).not.toBe(optionNameKey('Video games'))
  })
})

describe('optionNameProblem', () => {
  it('accepts an ordinary option', () => {
    expect(optionNameProblem('Rock climbing')).toBeNull()
    expect(optionNameProblem('AI')).toBeNull()
  })

  it('rejects an empty name', () => {
    expect(optionNameProblem('  ')).toBe('empty')
  })

  it('rejects a pasted sentence', () => {
    expect(optionNameProblem('a'.repeat(MAX_OPTION_NAME_LENGTH + 1))).toBe('too_long')
    expect(optionNameProblem('a'.repeat(MAX_OPTION_NAME_LENGTH))).toBeNull()
  })

  it('rejects several options typed as one', () => {
    expect(optionNameProblem('hiking, cooking')).toBe('multiple')
    expect(optionNameProblem('hiking; cooking')).toBe('multiple')
  })

  it('does not treat "and" or a slash as a separator', () => {
    // Both are single legitimate options, so neither may be split.
    expect(optionNameProblem('Arts and crafts')).toBeNull()
    expect(optionNameProblem('Film/TV')).toBeNull()
  })

  it('rejects a name with no letters in it', () => {
    expect(optionNameProblem('123')).toBe('no_letter')
    // Punctuation-only input is stripped to nothing by normalisation first, so it reports as empty
    // rather than reaching the letter check.
    expect(optionNameProblem('!!!')).toBe('empty')
  })
})

describe('splitOptionNames', () => {
  it('returns the pieces the reader meant, normalised', () => {
    expect(splitOptionNames('hiking, cooking')).toEqual(['Hiking', 'Cooking'])
  })

  it('drops pieces that are not usable on their own', () => {
    expect(splitOptionNames('hiking, , 42')).toEqual(['Hiking'])
  })
})
