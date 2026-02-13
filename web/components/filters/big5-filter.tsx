import clsx from 'clsx'
import {RangeSlider} from 'web/components/widgets/slider'
import {FilterFields} from 'common/filters'
import {useT} from 'web/lib/locale'

export const BIG5_MIN = 0
export const BIG5_MAX = 100

export type Big5Key =
  | 'big5_openness'
  | 'big5_conscientiousness'
  | 'big5_extraversion'
  | 'big5_agreeableness'
  | 'big5_neuroticism'

export type Big5MinMaxKey =
  | 'big5_openness_min'
  | 'big5_openness_max'
  | 'big5_conscientiousness_min'
  | 'big5_conscientiousness_max'
  | 'big5_extraversion_min'
  | 'big5_extraversion_max'
  | 'big5_agreeableness_min'
  | 'big5_agreeableness_max'
  | 'big5_neuroticism_min'
  | 'big5_neuroticism_max'

export function hasAnyBig5Filter(filters: Partial<FilterFields>) {
  return (
    filters.big5_openness_min != null ||
    filters.big5_openness_max != null ||
    filters.big5_conscientiousness_min != null ||
    filters.big5_conscientiousness_max != null ||
    filters.big5_extraversion_min != null ||
    filters.big5_extraversion_max != null ||
    filters.big5_agreeableness_min != null ||
    filters.big5_agreeableness_max != null ||
    filters.big5_neuroticism_min != null ||
    filters.big5_neuroticism_max != null
  )
}

export function Big5FilterText(props: {
  filters: Partial<FilterFields>
  highlightedClass?: string
}) {
  const {filters, highlightedClass} = props
  const t = useT()
  const hasAny = hasAnyBig5Filter(filters)

  if (!hasAny) {
    return (
      <span className={clsx(!hasAny && 'text-ink-600')}>
        {t('filter.big5.any', 'Any Big 5')}
      </span>
    )
  }

  return (
    <span className={clsx('font-semibold', highlightedClass)}>
      {t('filter.big5.custom', 'Custom Big 5')}
    </span>
  )
}

export function Big5SliderRow(props: {
  label: string
  minValue: number | null | undefined
  maxValue: number | null | undefined
  onChange: (min: number | undefined, max: number | undefined) => void
}) {
  const {label, minValue, maxValue, onChange} = props

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-sm text-ink-600">
        <span>{label}</span>
        <span className="font-semibold text-ink-700">
          {minValue == null && maxValue == null
            ? '0 – 100'
            : `${minValue ?? BIG5_MIN} – ${maxValue ?? BIG5_MAX}`}
        </span>
      </div>
      <RangeSlider
        lowValue={minValue ?? BIG5_MIN}
        highValue={maxValue ?? BIG5_MAX}
        min={BIG5_MIN}
        max={BIG5_MAX}
        setValues={(low, high) => {
          onChange(
            low > BIG5_MIN ? Math.round(low) : undefined,
            high < BIG5_MAX ? Math.round(high) : undefined
          )
        }}
        marks={[
          {value: 0, label: '0'},
          {value: 25, label: '25'},
          {value: 50, label: '50'},
          {value: 75, label: '75'},
          {value: 100, label: '100'},
        ].map((m) => ({
          value: ((m.value - BIG5_MIN) / (BIG5_MAX - BIG5_MIN)) * 100,
          label: m.label,
        }))}
      />
    </div>
  )
}

export function Big5Filters(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  const t = useT()

  return (
    <div className="w-full max-w-md py-2">
      <Big5SliderRow
        label={t('profile.big5_openness', 'Openness')}
        minValue={filters.big5_openness_min}
        maxValue={filters.big5_openness_max}
        onChange={(min, max) =>
          updateFilter({
            big5_openness_min: min,
            big5_openness_max: max,
          })
        }
      />
      <Big5SliderRow
        label={t(
          'profile.big5_conscientiousness',
          'Conscientiousness'
        )}
        minValue={filters.big5_conscientiousness_min}
        maxValue={filters.big5_conscientiousness_max}
        onChange={(min, max) =>
          updateFilter({
            big5_conscientiousness_min: min,
            big5_conscientiousness_max: max,
          })
        }
      />
      <Big5SliderRow
        label={t('profile.big5_extraversion', 'Extraversion')}
        minValue={filters.big5_extraversion_min}
        maxValue={filters.big5_extraversion_max}
        onChange={(min, max) =>
          updateFilter({
            big5_extraversion_min: min,
            big5_extraversion_max: max,
          })
        }
      />
      <Big5SliderRow
        label={t('profile.big5_agreeableness', 'Agreeableness')}
        minValue={filters.big5_agreeableness_min}
        maxValue={filters.big5_agreeableness_max}
        onChange={(min, max) =>
          updateFilter({
            big5_agreeableness_min: min,
            big5_agreeableness_max: max,
          })
        }
      />
      <Big5SliderRow
        label={t('profile.big5_neuroticism', 'Neuroticism')}
        minValue={filters.big5_neuroticism_min}
        maxValue={filters.big5_neuroticism_max}
        onChange={(min, max) =>
          updateFilter({
            big5_neuroticism_min: min,
            big5_neuroticism_max: max,
          })
        }
      />
    </div>
  )
}


