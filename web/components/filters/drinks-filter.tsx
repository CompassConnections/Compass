import clsx from 'clsx'
import {RangeSlider} from 'web/components/widgets/slider'
import {FilterFields} from 'common/filters'

export const DRINKS_MIN = 0
export const DRINKS_MAX = 20

export function getNoMinMaxDrinks(
  drinks_min: number | null | undefined,
  drinks_max: number | null | undefined
) {
  const noMin = drinks_min == null || drinks_min <= DRINKS_MIN
  const noMax = drinks_max == null || drinks_max >= DRINKS_MAX
  // console.log('drinks min max', drinks_min, drinks_max)
  return [noMin, noMax]
}

export function DrinksFilterText(props: {
  drinks_min: number | null | undefined
  drinks_max: number | null | undefined
  highlightedClass?: string
}) {
  const {drinks_min, drinks_max, highlightedClass} = props
  const [noMin, noMax] = getNoMinMaxDrinks(drinks_min, drinks_max)


  if (drinks_max === DRINKS_MIN) {
    return (
      <span className="font-semibold">
        <span className={clsx(highlightedClass)}>{drinks_max}</span> / mo
      </span>
    )
  }

  if (noMin && noMax) {
    return (
      <span>
        <span className={clsx('text-semibold', highlightedClass)}>Any</span>{' '}
        <span className="hidden sm:inline">drinks</span>
      </span>
    )
  }
  if (noMin) {
    return (
      <span className="font-semibold">
        <span className={clsx(highlightedClass)}>
          {' < '}
          {drinks_max}
        </span>{' '}
        / mo
      </span>
    )
  }
  if (noMax) {
    return (
      <span className="font-semibold">
        <span className={clsx(highlightedClass)}>
          {' > '}
          {drinks_min}
        </span>{' '}
        / mo
      </span>
    )
  }
  if (drinks_min === drinks_max) {
    return (
      <span className="font-semibold">
        <span className={clsx(highlightedClass)}>{drinks_min}</span> / mo
      </span>
    )
  }
  return (
    <span className="font-semibold">
      <span className={clsx(highlightedClass)}>
        {drinks_min}
        {' - '}
        {drinks_max}
      </span>{' '}
      /mo
    </span>
  )
}

export function DrinksFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <RangeSlider
      lowValue={filters.drinks_min ?? DRINKS_MIN}
      highValue={filters.drinks_max ?? DRINKS_MAX}
      setValues={(low: number, high: number) => {
        updateFilter({
          drinks_min: low > DRINKS_MIN ? Number(low) : undefined,
          drinks_max: high < DRINKS_MAX ? Number(high) : undefined,
        })
      }}
      min={DRINKS_MIN}
      max={DRINKS_MAX}
      marks={[
        {value: 0, label: `${DRINKS_MIN}`},
        {
          value: ((5 - DRINKS_MIN) / (DRINKS_MAX - DRINKS_MIN)) * 100,
          label: `5`,
        },
        {
          value: ((10 - DRINKS_MIN) / (DRINKS_MAX - DRINKS_MIN)) * 100,
          label: `10`,
        },
        {
          value: ((15 - DRINKS_MIN) / (DRINKS_MAX - DRINKS_MIN)) * 100,
          label: `15`,
        },
        {value: 100, label: `${DRINKS_MAX}+`},
      ]}
    />
  )
}
