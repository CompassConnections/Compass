import clsx from 'clsx'
import {GENDERS_PLURAL} from 'common/choices'
import {FilterFields} from 'common/filters'
import {Gender} from 'common/gender'
import {Row} from 'web/components/layout/row'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'

import GenderIcon from '../gender-icon'

export function PrefGenderFilterText(props: {
  pref_gender: Gender[] | undefined
  highlightedClass?: string
}) {
  const {pref_gender, highlightedClass} = props
  const t = useT()

  if (!pref_gender || pref_gender.length < 1) {
    return (
      <span>
        <span className="">{t('filter.gender.they_seek', 'Gender they seek')}: </span>
        <span className={clsx('text-semibold capitalize sm:normal-case', highlightedClass)}>
          {t('filter.any', 'any')}
        </span>
      </span>
    )
  }
  return (
    <Row className="items-center gap-0.5 font-semibold">
      <span className="">{t('filter.gender.they_seek', 'Gender they seek')}: </span>
      {pref_gender.map((gender) => {
        return <GenderIcon key={gender} gender={gender} className={clsx('h-4 w-4')} hasColor />
      })}
    </Row>
  )
}

export function PrefGenderFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.pref_gender ?? []}
      choices={GENDERS_PLURAL}
      translationPrefix={'profile.gender.plural'}
      onChange={(c) => {
        updateFilter({pref_gender: c})
      }}
    />
  )
}
