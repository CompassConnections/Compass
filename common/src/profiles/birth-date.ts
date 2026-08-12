/**
 * Everything that turns "how old are you" into a date we can keep counting from.
 *
 * `profiles.birth_date` is the stored truth and `profiles.age` is a cache the database maintains
 * from it (see `20260812_add_birth_date_to_profiles.sql`), so nothing here writes an age — it only
 * converts between the two for display and for the one field people actually type.
 *
 * We deliberately store nothing finer than a year: an exact date of birth is a credential in its own
 * right — the thing banks and support desks ask for — and nothing on Compass needs one. Every stored
 * date is therefore the 1st of July of the birth year, which the database enforces with a CHECK
 * constraint rather than trusting the callers. The cost is that a shown age can be out by a year for
 * up to six months around someone's real birthday, which is the trade the profile form explains.
 */

/** A `date` column crosses the wire as 'YYYY-MM-DD' — never as a `Date`, so no timezone can shift it. */
export type BirthDateString = string

/** The shape of a date, for parsing. What we *store* is narrower — see {@link STORED_BIRTH_DATE_REGEX}. */
export const BIRTH_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * The only birth date the API accepts or the database will hold: mid-year, so it carries a year and
 * nothing more. Anything else is a caller trying to store a real birthday.
 */
export const STORED_BIRTH_DATE_REGEX = /^\d{4}-07-01$/

export const MIN_PROFILE_AGE = 18
export const MAX_PROFILE_AGE = 100

/**
 * The day a birth year is stored as. Mid-year: someone who tells us "1991" was born on average six
 * months either side of it, so July 1st is the choice that minimises the expected error of the age
 * we compute back out.
 */
const MID_YEAR_MONTH = 7
const MID_YEAR_DAY = 1

export type BirthDateParts = {year: number; month: number; day: number}

const pad = (n: number) => String(n).padStart(2, '0')

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

export const formatBirthDate = ({year, month, day}: BirthDateParts): BirthDateString =>
  `${String(year).padStart(4, '0')}-${pad(month)}-${pad(day)}`

export const parseBirthDate = (
  birthDate: BirthDateString | null | undefined,
): BirthDateParts | null => {
  if (!birthDate || !BIRTH_DATE_REGEX.test(birthDate)) return null
  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return {year, month, day}
}

/** What gets stored for a birth year. The only way a birth date is ever constructed. */
export const birthDateFromYear = (year: number): BirthDateString =>
  formatBirthDate({year, month: MID_YEAR_MONTH, day: MID_YEAR_DAY})

/** The year someone entered, back out of the date we stored for them. */
export const birthYearFromBirthDate = (birthDate: BirthDateString | null | undefined) =>
  parseBirthDate(birthDate)?.year ?? null

/** Whether `date` falls on or after the 1st of July, i.e. whether a stored birth date has come round. */
const pastMidYear = (date: Date) => date.getMonth() + 1 >= MID_YEAR_MONTH

/**
 * Full years elapsed, rounding the same way Postgres' `age()` does — so the number here and the one
 * the database caches in `profiles.age` never disagree.
 */
export const ageFromBirthDate = (
  birthDate: BirthDateString | null | undefined,
  asOf: Date = new Date(),
): number | null => {
  const parts = parseBirthDate(birthDate)
  if (!parts) return null
  const [nowMonth, nowDay] = [asOf.getMonth() + 1, asOf.getDate()]
  const hadBirthday = nowMonth > parts.month || (nowMonth === parts.month && nowDay >= parts.day)
  return asOf.getFullYear() - parts.year - (hadBirthday ? 0 : 1)
}

/**
 * A stated age is an interval, not a date: "34" on day T means born somewhere in the year ending at
 * T − 34 years, which straddles two birth years. We take the one that reads back as the age they
 * actually stated on the day they stated it.
 *
 * `statedOn` matters — it is what stops an age read out of a document written in 2023 being treated
 * as an age stated today.
 */
export const birthYearFromStatedAge = (age: number, statedOn: Date = new Date()) =>
  statedOn.getFullYear() - age - (pastMidYear(statedOn) ? 0 : 1)

/**
 * Whatever a document said about someone's age, resolved into the year we store.
 *
 * Documents state it two ways — a birth year (or a full date, of which the extractor is asked for
 * only the year) and "I'm 34" — and the arithmetic is deliberately not the model's job: it only has
 * to report what it read, and this can only ever be off by as much as the document itself was vague.
 *
 * Everything goes through one plausibility gate afterwards, so a typo'd year, a 12-year-old or an
 * age of 250 comes back null rather than being saved and displayed.
 */
export const birthDateFromStated = (
  stated: {birthYear?: number | string | null; age?: number | string | null},
  statedOn: Date = new Date(),
): BirthDateString | null => {
  const birthYear = Number(stated.birthYear)
  const age = Number(stated.age)

  const year = Number.isInteger(birthYear)
    ? birthYear
    : isValidProfileAge(age)
      ? birthYearFromStatedAge(age, statedOn)
      : null

  if (year === null) return null
  const birthDate = birthDateFromYear(year)
  return isValidProfileAge(ageFromBirthDate(birthDate, statedOn)) ? birthDate : null
}

export const isValidProfileAge = (age: number | null | undefined): age is number =>
  typeof age === 'number' &&
  Number.isFinite(age) &&
  age >= MIN_PROFILE_AGE &&
  age <= MAX_PROFILE_AGE
