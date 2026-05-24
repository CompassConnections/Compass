import clsx from 'clsx'
import {GENDERS} from 'common/choices'
import {FilterFields} from 'common/filters'
import {EXTRA_GENDERS, Gender} from 'common/gender'
import {Profile} from 'common/profiles/profile'
import {useState} from 'react'
import {Row} from 'web/components/layout/row'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'

import GenderIcon from '../gender-icon'

const DEFAULT_GENDER_VALUES = ['female', 'male']

export function GenderFilterText(props: {gender: Gender[] | undefined; highlightedClass?: string}) {
  const {gender, highlightedClass} = props

  const t = useT()
  if (!gender || gender.length < 1) {
    return (
      <span>
        <span className={clsx('text-semibold', highlightedClass)}>
          {t('filter.gender.any', 'Any')}
        </span>{' '}
        <span className="">{t('filter.gender.gender', 'gender')}</span>
      </span>
    )
  }
  return (
    <Row className="items-center gap-0.5 font-semibold">
      {gender.map((g) => {
        return <GenderIcon key={g} gender={g} className={clsx('h-4 w-4')} hasColor />
      })}{' '}
      <span className="hidden sm:inline">
        {gender.length > 1
          ? t('filter.gender.genders', 'genders')
          : t('filter.gender.gender', 'gender')}
      </span>
    </Row>
  )
}

export function GenderFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  profile?: Profile | null
}) {
  const {filters, updateFilter, profile} = props
  const t = useT()
  const selected = filters.genders ?? []
  const hasExtendedSelected =
    selected.some((v) => !DEFAULT_GENDER_VALUES.includes(v)) ||
    (profile?.gender && EXTRA_GENDERS.includes(profile.gender as any))
  const [showAll, setShowAll] = useState(hasExtendedSelected)

  const visibleChoices = Object.fromEntries(
    Object.entries(GENDERS).filter(
      ([, v]) => showAll || DEFAULT_GENDER_VALUES.includes(v) || selected.includes(v),
    ),
  )

  return (
    <>
      <MultiCheckbox
        selected={selected}
        choices={visibleChoices}
        translationPrefix={'profile.gender'}
        onChange={(c) => {
          updateFilter({genders: c})
        }}
      />
      {!showAll && (
        <button
          type="button"
          className="text-primary-600 mt-1 text-sm"
          onClick={() => setShowAll(true)}
        >
          {t('filter.gender.show_more', 'Show more genders')}
        </button>
      )}
    </>
  )
}
