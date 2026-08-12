import {
  ageFromBirthDate,
  birthDateFromStated,
  birthDateFromYear,
  birthYearFromStatedAge,
  isValidProfileAge,
  parseBirthDate,
  STORED_BIRTH_DATE_REGEX,
} from 'common/profiles/birth-date'

// Local time, to match the getters the helpers use.
const on = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

describe('parseBirthDate', () => {
  it('accepts a padded date', () => {
    expect(parseBirthDate('1991-07-01')).toEqual({year: 1991, month: 7, day: 1})
  })

  it('rejects anything that is not a real, fully padded date', () => {
    expect(parseBirthDate(null)).toBeNull()
    expect(parseBirthDate('')).toBeNull()
    expect(parseBirthDate('1991-7-1')).toBeNull()
    expect(parseBirthDate('1991-13-01')).toBeNull()
    expect(parseBirthDate('1991-02-30')).toBeNull()
  })
})

describe('birthDateFromYear', () => {
  it('stores a year as its mid-year date, and nothing finer', () => {
    expect(birthDateFromYear(1991)).toBe('1991-07-01')
    expect(birthDateFromYear(1991)).toMatch(STORED_BIRTH_DATE_REGEX)
  })
})

describe('ageFromBirthDate', () => {
  it('counts whole years only', () => {
    expect(ageFromBirthDate('1991-07-01', on('2026-06-30'))).toBe(34)
    expect(ageFromBirthDate('1991-07-01', on('2026-07-01'))).toBe(35)
    expect(ageFromBirthDate('1991-07-01', on('2026-07-02'))).toBe(35)
  })

  it('handles the turn of the year', () => {
    expect(ageFromBirthDate('1990-07-01', on('2026-01-01'))).toBe(35)
  })

  it('is null when there is no usable date', () => {
    expect(ageFromBirthDate(null)).toBeNull()
    expect(ageFromBirthDate('nonsense')).toBeNull()
  })
})

describe('birthYearFromStatedAge', () => {
  it('picks the birth year that reads back as the age that was stated', () => {
    for (const day of ['2026-01-15', '2026-06-30', '2026-07-01', '2026-08-12', '2026-12-31']) {
      for (const age of [18, 34, 67, 100]) {
        const birthDate = birthDateFromYear(birthYearFromStatedAge(age, on(day)))
        expect(ageFromBirthDate(birthDate, on(day))).toBe(age)
      }
    }
  })

  it('ages on from the date the document stated it, not from today', () => {
    // The whole point: an age extracted from a three-year-old page is three years out of date.
    const birthDate = birthDateFromYear(birthYearFromStatedAge(34, on('2023-08-12')))
    expect(ageFromBirthDate(birthDate, on('2026-08-12'))).toBe(37)
  })

  it('takes the earlier year when the age was stated before mid-year', () => {
    expect(birthYearFromStatedAge(30, on('2026-03-10'))).toBe(1995)
    expect(birthYearFromStatedAge(30, on('2026-08-10'))).toBe(1996)
  })
})

describe('birthDateFromStated', () => {
  const read = (stated: Parameters<typeof birthDateFromStated>[0]) =>
    birthDateFromStated(stated, on('2026-08-12'))

  it('prefers a stated year to an age', () => {
    expect(read({birthYear: 1991, age: 20})).toBe('1991-07-01')
    expect(read({age: 34})).toBe('1992-07-01')
  })

  it('accepts the numbers as strings, which is how they arrive from an LLM', () => {
    expect(read({birthYear: '1991'})).toBe('1991-07-01')
    expect(ageFromBirthDate(read({age: '34'}), on('2026-08-12'))).toBe(34)
  })

  it('drops an age or a year nobody on the site could have', () => {
    for (const stated of [
      {age: 12},
      {age: 250},
      {age: NaN},
      {birthYear: 1591},
      {birthYear: 2025},
    ]) {
      expect(read(stated)).toBeNull()
    }
  })

  it('says nothing when the document said nothing', () => {
    expect(read({})).toBeNull()
  })
})

describe('isValidProfileAge', () => {
  it('holds the 18–100 line', () => {
    expect(isValidProfileAge(18)).toBe(true)
    expect(isValidProfileAge(100)).toBe(true)
    expect(isValidProfileAge(17)).toBe(false)
    expect(isValidProfileAge(101)).toBe(false)
    expect(isValidProfileAge(null)).toBe(false)
    expect(isValidProfileAge(NaN)).toBe(false)
  })
})
