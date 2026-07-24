import clsx from 'clsx'
import {
  DEFAULT_NEUROTYPES,
  EXTRA_NEUROTYPES,
  INVERTED_NEUROTYPE_CHOICES,
  NEUROTYPE_CHOICES,
} from 'common/choices'
import {FilterFields} from 'common/filters'
import {toKey} from 'common/parsing'
import {Profile} from 'common/profiles/profile'
import {useState} from 'react'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'

export function NeurotypeFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  const t = useT()

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_neurotype', 'Any neurotype')}
      </span>
    )
  }

  if (length > 2) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          {t('filter.multiple', 'Multiple')}
        </span>
      </span>
    )
  }

  const convertedTypes = options.map((o) =>
    t(`profile.neurotype.${toKey(o)}`, INVERTED_NEUROTYPE_CHOICES[o] ?? o),
  )

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: convertedTypes,
          capitalizeFirstLetterOption: true,
          t: t,
        })}{' '}
      </span>
    </div>
  )
}

export function NeurotypeFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  className?: string
  profile?: Profile | null
}) {
  const {filters, updateFilter, className, profile} = props
  const t = useT()
  const selected = ((filters as any).neurotype as string[] | undefined) ?? []
  const hasExtendedSelected =
    selected.some((v) => EXTRA_NEUROTYPES.includes(v as any)) ||
    (profile?.neurotype && profile?.neurotype.some((v) => EXTRA_NEUROTYPES.includes(v as any)))
  const [showAll, setShowAll] = useState(hasExtendedSelected)

  const visibleChoices = Object.fromEntries(
    Object.entries(NEUROTYPE_CHOICES).filter(
      ([, v]) => showAll || DEFAULT_NEUROTYPES.includes(v as any) || selected.includes(v),
    ),
  )

  return (
    <>
      <MultiCheckbox
        selected={selected}
        choices={visibleChoices}
        translationPrefix={'profile.neurotype'}
        onChange={(c) => {
          updateFilter({neurotype: c} as any)
        }}
        optionsClassName={className}
      />
      {!showAll && (
        <button
          type="button"
          className="text-primary-600 mt-1 text-sm"
          onClick={() => setShowAll(true)}
        >
          {t('filter.neurotype.show_more', 'Show more neurotypes')}
        </button>
      )}
    </>
  )
}
