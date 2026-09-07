import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {
  WANTS_KIDS_MAX_STRENGTH,
  WANTS_KIDS_MIN_STRENGTH,
  WANTS_KIDS_STRENGTH_NAMES,
  WANTS_KIDS_STRENGTH_SHORT_NAMES,
} from 'common/wants-kids'
import {RangeSlider} from 'web/components/widgets/slider'
import {useT} from 'web/lib/locale'

/**
 * A band over the five answers to "I would like to have kids" rather than a single value.
 *
 * The profile stores an answer on a five-point scale, so a search for one point of it ("wants kids")
 * had to invent a rule for the other four — it used to sweep in everything above or below, which
 * quietly made "neutral" and "wants kids" the same search. An interval says exactly which answers
 * are in, and is the same shape the looking-for bundle derives from your own answer
 * (`getWantsKidsRange`).
 */
export function getNoMinMaxWantsKids(
  wants_kids_range_min: number | null | undefined,
  wants_kids_range_max: number | null | undefined,
) {
  const noMin = wants_kids_range_min == null || wants_kids_range_min <= WANTS_KIDS_MIN_STRENGTH
  const noMax = wants_kids_range_max == null || wants_kids_range_max >= WANTS_KIDS_MAX_STRENGTH
  return [noMin, noMax]
}

/** The section's collapsed summary: the two answers the band runs between, or just the one. */
export function WantsKidsFilterText(props: {
  wants_kids_range_min: number | null | undefined
  wants_kids_range_max: number | null | undefined
  highlightedClass?: string
}) {
  const {wants_kids_range_min, wants_kids_range_max, highlightedClass} = props
  const [noMin, noMax] = getNoMinMaxWantsKids(wants_kids_range_min, wants_kids_range_max)
  const t = useT()

  if (noMin && noMax) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.label.wants_kids_range', 'Desire for kids')}
      </span>
    )
  }

  const answer = (strength: number) =>
    t(`profile.wants_kids_${strength}`, WANTS_KIDS_STRENGTH_NAMES[strength])

  const low = wants_kids_range_min ?? WANTS_KIDS_MIN_STRENGTH
  const high = wants_kids_range_max ?? WANTS_KIDS_MAX_STRENGTH

  return (
    <span className="font-semibold">
      <span className={clsx(highlightedClass)}>
        {low === high ? answer(low) : `${answer(low)} - ${answer(high)}`}
      </span>
    </span>
  )
}

export function WantsKidsFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  const t = useT()

  const span = WANTS_KIDS_MAX_STRENGTH - WANTS_KIDS_MIN_STRENGTH

  return (
    <RangeSlider
      lowValue={filters.wants_kids_range_min ?? WANTS_KIDS_MIN_STRENGTH}
      highValue={filters.wants_kids_range_max ?? WANTS_KIDS_MAX_STRENGTH}
      setValues={(low: number, high: number) => {
        // An end left at the edge of the scale is not a constraint, so it is dropped rather than
        // stored — otherwise every search would carry a kid-desire filter that excludes nobody, and
        // the panel would count it.
        updateFilter({
          wants_kids_range_min: low > WANTS_KIDS_MIN_STRENGTH ? Number(low) : undefined,
          wants_kids_range_max: high < WANTS_KIDS_MAX_STRENGTH ? Number(high) : undefined,
        })
      }}
      min={WANTS_KIDS_MIN_STRENGTH}
      max={WANTS_KIDS_MAX_STRENGTH}
      marks={Object.entries(WANTS_KIDS_STRENGTH_SHORT_NAMES).map(([strength, shortName]) => ({
        value: ((Number(strength) - WANTS_KIDS_MIN_STRENGTH) / span) * 100,
        label: t(`filter.wants_kids.short.${strength}`, shortName),
      }))}
    />
  )
}
