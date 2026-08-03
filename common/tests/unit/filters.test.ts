import {hasSearchCriteria} from 'common/filters'

describe('hasSearchCriteria', () => {
  it('rejects a search with nothing set', () => {
    expect(hasSearchCriteria({})).toBe(false)
    expect(hasSearchCriteria(null)).toBe(false)
    expect(hasSearchCriteria(undefined)).toBe(false)
  })

  it('rejects the fields every search carries anyway', () => {
    expect(hasSearchCriteria({orderBy: 'created_time', shortBio: true})).toBe(false)
  })

  it('rejects the default language filter, which is pre-set rather than chosen', () => {
    expect(hasSearchCriteria({languages: ['english']})).toBe(false)
    expect(
      hasSearchCriteria({languages: ['english'], orderBy: 'created_time', shortBio: true}),
    ).toBe(false)
    expect(hasSearchCriteria({languages: []})).toBe(false)
  })

  it('accepts a language the member actually picked', () => {
    expect(hasSearchCriteria({languages: ['german']})).toBe(true)
    expect(hasSearchCriteria({languages: ['english', 'german']})).toBe(true)
  })

  it('accepts any other filter, including one alongside the ignored fields', () => {
    expect(hasSearchCriteria({genders: ['woman']})).toBe(true)
    expect(hasSearchCriteria({pref_age_min: 30})).toBe(true)
    expect(hasSearchCriteria({name: 'ana'})).toBe(true)
    expect(hasSearchCriteria({languages: ['english'], diet: ['vegan']})).toBe(true)
  })

  it('treats a location filter as a criterion of its own', () => {
    expect(hasSearchCriteria({}, {location: {name: 'Porto'}})).toBe(true)
  })

  it('ignores empty values', () => {
    expect(hasSearchCriteria({genders: [], name: '', diet: undefined})).toBe(false)
  })
})
