import {getLocationText, isUnitedStates, normalizeCountry, UNITED_STATES} from 'common/geodb'
import {ProfileRow} from 'common/profiles/profile'

describe('normalizeCountry', () => {
  it.each([
    'United States',
    'United States of America',
    'the United States of America',
    'USA',
    'U.S.A.',
    'US',
    'U.S.',
    'America',
    '  usa  ',
    'united states of america',
  ])('collapses %p onto the canonical name', (country) => {
    expect(normalizeCountry(country)).toBe(UNITED_STATES)
    expect(isUnitedStates(country)).toBe(true)
  })

  it.each(['Belgium', 'France', 'Mexico', 'Australia', 'United Kingdom', 'United Arab Emirates'])(
    'leaves %p untouched',
    (country) => {
      expect(normalizeCountry(country)).toBe(country)
      expect(isUnitedStates(country)).toBe(false)
    },
  )

  it('passes null and undefined through', () => {
    expect(normalizeCountry(null)).toBeNull()
    expect(normalizeCountry(undefined)).toBeUndefined()
  })
})

describe('getLocationText', () => {
  const profile = (fields: Partial<ProfileRow>) => fields as ProfileRow

  it('still abbreviates the US for display', () => {
    expect(
      getLocationText(profile({city: 'Austin', region_code: 'TX', country: UNITED_STATES})),
    ).toBe('Austin, TX, USA')
  })

  it('recognizes the US whichever synonym was stored', () => {
    expect(getLocationText(profile({city: 'Austin', region_code: 'TX', country: 'USA'}))).toBe(
      'Austin, TX, USA',
    )
  })
})
