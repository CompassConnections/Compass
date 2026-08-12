import clsx from 'clsx'
import {
  ageFromBirthDate,
  birthDateFromYear,
  BirthDateString,
  birthYearFromBirthDate,
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
} from 'common/profiles/birth-date'
import {useEffect, useRef, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {InfoTooltip} from 'web/components/widgets/info-tooltip'
import {Input} from 'web/components/widgets/input'
import {useT} from 'web/lib/locale'
import {labelClassName} from 'web/pages/signup'

/**
 * Year of birth, not age — an age is right for a year and then quietly wrong forever, and this form
 * is filled in once.
 *
 * A year costs exactly as much to type as an age, and the computed age shown beside the field is
 * what makes that true in practice: you get the same instant confirmation you got from typing "34",
 * without doing the subtraction yourself.
 *
 * The year is also all we ask for, deliberately: a full date of birth is a credential — the thing
 * banks and support desks ask for — and nothing here needs one. The tooltip says so, along with what
 * it costs, since someone who has just been asked for their birth year is entitled to know why the
 * age we show them can be a year out for part of the year.
 */
export const BirthDateInput = (props: {
  birthDate: BirthDateString | null | undefined
  onChange: (birthDate: BirthDateString | null) => void
  error: string | null
  setError: (error: string | null) => void
}) => {
  const {birthDate, onChange, error, setError} = props
  const t = useT()

  const [yearInput, setYearInput] = useState(() => String(birthYearFromBirthDate(birthDate) ?? ''))

  // What we last handed the parent. Auto-fill writes `birth_date` from outside, and this is how we
  // tell that apart from an echo of our own keystroke, which must not overwrite what is being typed.
  const lastPushed = useRef(birthDate)

  useEffect(() => {
    if (birthDate === lastPushed.current) return
    lastPushed.current = birthDate
    setYearInput(String(birthYearFromBirthDate(birthDate) ?? ''))
  }, [birthDate])

  const push = (year: string) => {
    // Anything short of four digits is a year still being typed, not a year: saving it would store a
    // birth date in the year 199, and leaving the previous one in place would save a year they have
    // already backspaced away from.
    const nextBirthDate = /^\d{4}$/.test(year) ? birthDateFromYear(Number(year)) : null

    const age = ageFromBirthDate(nextBirthDate)
    if (age === null) setError(null)
    else if (age < MIN_PROFILE_AGE)
      setError(t('profile.optional.age.error_min', 'You must be at least 18 years old'))
    else if (age > MAX_PROFILE_AGE)
      setError(t('profile.optional.age.error_max', 'Please enter a valid age'))
    else setError(null)

    lastPushed.current = nextBirthDate
    onChange(nextBirthDate)
  }

  const age = /^\d{4}$/.test(yearInput)
    ? ageFromBirthDate(birthDateFromYear(Number(yearInput)))
    : null

  return (
    <Col className={'gap-2'}>
      <Row className="items-center gap-1.5">
        <label className={clsx(labelClassName)} htmlFor="birth-year">
          {t('profile.optional.birth_year', 'Year of birth')}
        </label>
        <InfoTooltip
          size="sm"
          // The icon carries a `-mb-1` for sitting inside a line of prose; on a centred row of its
          // own that drops it below the label's midline.
          className="!mb-0"
          text={t(
            'profile.optional.birth_year.why',
            'We ask for the year rather than your full date of birth: an exact birth date is a ' +
              'piece of ID, and we take ID data privacy seriously. We count your age from mid-year instead, ' +
              'so the age shown on your profile can be a year out for at most six months around ' +
              'your birthday.',
          )}
        />
      </Row>
      <Row className="items-center gap-3">
        {/* Text rather than `type="number"`: a year is four digits, not a quantity. That gets us
            `maxLength`, no spinner arrows to aim around, and no chance of the scroll wheel silently
            ageing someone by a decade as they scroll past the field. */}
        <Input
          id="birth-year"
          type="text"
          inputMode="numeric"
          autoComplete="bday-year"
          maxLength={4}
          data-testid="birth-year"
          className={'!w-24'}
          placeholder={'YYYY'}
          value={yearInput}
          error={!!error}
          aria-invalid={!!error}
          aria-describedby={error ? 'birth-year-error' : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
            setYearInput(digits)
            push(digits)
          }}
        />
        {/* The subtraction we are asking them not to do, done back at them: same reassurance a typed
            age gave, with none of the staleness. */}
        {age !== null && !error && (
          <span className="text-ink-600 text-sm" data-testid="birth-year-age">
            {t('profile.optional.birth_year.age_echo', '{age} years old', {age})}
          </span>
        )}
      </Row>
      {error && (
        <p id="birth-year-error" className="text-error text-sm mt-1">
          {error}
        </p>
      )}
    </Col>
  )
}
