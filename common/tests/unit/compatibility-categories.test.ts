import {
  compatibilityCategoryLabel,
  presentCompatibilityCategories,
} from 'common/profiles/compatibility-categories'

describe('compatibilityCategoryLabel', () => {
  it('labels a known category', () => {
    expect(compatibilityCategoryLabel('kids_family')).toBe('Kids & family')
  })

  // The column is free text, and prompts predating the fixed vocabulary carry values like
  // 'sex/intimacy; descriptive'. Showing those as they are stored keeps a mislabelled prompt visible.
  it('falls back to the stored value for anything unrecognised', () => {
    expect(compatibilityCategoryLabel('sex/intimacy; descriptive')).toBe(
      'sex/intimacy; descriptive',
    )
  })
})

describe('presentCompatibilityCategories', () => {
  it('returns only categories the questions actually carry, in vocabulary order', () => {
    expect(
      presentCompatibilityCategories([
        {category: 'money_work'},
        {category: 'kids_family'},
        {category: 'money_work'},
        {category: null},
        {},
      ]),
    ).toEqual(['kids_family', 'money_work'])
  })

  it('puts unrecognised categories after the known ones', () => {
    expect(
      presentCompatibilityCategories([
        {category: 'zzz-legacy'},
        {category: 'money_work'},
        {category: 'aaa-legacy'},
      ]),
    ).toEqual(['money_work', 'aaa-legacy', 'zzz-legacy'])
  })

  it('is empty when nothing is categorised', () => {
    expect(presentCompatibilityCategories([{category: null}, {}])).toEqual([])
  })
})
