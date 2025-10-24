import clsx from 'clsx'
import { RangeSlider } from 'web/components/widgets/slider'
import {FilterFields} from "common/filters";

export const PREF_AGE_MIN = 18
export const PREF_AGE_MAX = 100

export function getNoMinMaxAge(
  pref_age_min: number | null | undefined,
  pref_age_max: number | null | undefined
) {
  const noMinAge = !pref_age_min || pref_age_min <= PREF_AGE_MIN
  const noMaxAge = !pref_age_max || pref_age_max >= PREF_AGE_MAX
  return [noMinAge, noMaxAge]
}

export function AgeFilterText(props: {
  pref_age_min: number | null | undefined
  pref_age_max: number | null | undefined
  highlightedClass?: string
}) {
  const { pref_age_min, pref_age_max, highlightedClass } = props
  const [noMinAge, noMaxAge] = getNoMinMaxAge(pref_age_min, pref_age_max)

  if (noMinAge && noMaxAge) {
    return (
      <span>
        <span className={clsx('text-semibold', highlightedClass)}>Any</span>{' '}
        <span className="hidden sm:inline">age</span>
      </span>
    )
  }
  if (noMinAge) {
    return (
      <span className="font-semibold">
        <span className={clsx(highlightedClass)}>
          {'<'}
          {pref_age_max}
        </span>{' '}
        years
      </span>
    )
  }
  if (noMaxAge) {
    return (
      <span className="font-semibold">
        <span className={clsx(highlightedClass)}>
          {'>'}
          {pref_age_min}
        </span>{' '}
        years
      </span>
    )
  }
  return (
    <span className="font-semibold">
      <span className={clsx(highlightedClass)}>
        {pref_age_min}
        {' - '}
        {pref_age_max}
      </span>{' '}
      years
    </span>
  )
}

const FILTER_MAX = 60;

export function AgeFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const { filters, updateFilter } = props
  return (
    <RangeSlider
      lowValue={filters.pref_age_min ?? PREF_AGE_MIN}
      highValue={filters.pref_age_max ?? FILTER_MAX}
      setValues={(low: number, high: number) => {
        updateFilter({
          pref_age_min: low > PREF_AGE_MIN ? Number(low) : undefined,
          pref_age_max: high < FILTER_MAX ? Number(high) : undefined,
        })
      }}
      min={PREF_AGE_MIN}
      max={FILTER_MAX}
      marks={[
        { value: 0, label: `${PREF_AGE_MIN}` },
        {
          value: ((30 - PREF_AGE_MIN) / (FILTER_MAX - PREF_AGE_MIN)) * 100,
          label: `30`,
        },
        {
          value: ((40 - PREF_AGE_MIN) / (FILTER_MAX - PREF_AGE_MIN)) * 100,
          label: `40`,
        },
        {
          value: ((50 - PREF_AGE_MIN) / (FILTER_MAX - PREF_AGE_MIN)) * 100,
          label: `50`,
        },
        { value: 100, label: `${FILTER_MAX}+` },
      ]}
    />
  )
}
