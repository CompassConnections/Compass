import clsx from 'clsx'
import GenderIcon from '../gender-icon'
import {Gender} from 'common/gender'
import {Row} from 'web/components/layout/row'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'
import {FilterFields} from "common/filters";
import {GENDERS_PLURAL} from "web/components/filters/choices";

export function GenderFilterText(props: {
  gender: Gender[] | undefined
  highlightedClass?: string
}) {
  const { gender, highlightedClass } = props

  const t = useT()
  if (!gender || gender.length < 1) {
    return (
      <span>
        <span className={clsx('text-semibold', highlightedClass)}>{t('filter.gender.any', 'Any')}</span>{' '}
        <span className="">{t('filter.gender.gender', 'gender')}</span>
      </span>
    )
  }
  return (
    <Row className="items-center gap-0.5 font-semibold">
      {gender.map((g) => {
        return (
          <GenderIcon key={g} gender={g} className={clsx('h-4 w-4')} hasColor />
        )
      })}{' '}
      <span className="hidden sm:inline">
        {gender.length > 1 ? t('filter.gender.genders', 'genders') : t('filter.gender.gender', 'gender')}
      </span>
    </Row>
  )
}

export function GenderFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const { filters, updateFilter } = props
  return (
    <>
      <MultiCheckbox
        selected={filters.genders ?? []}
        choices={GENDERS_PLURAL}
        translationPrefix={'profile.gender.plural'}
        onChange={(c) => {
          updateFilter({ genders: c })
        }}
      />
    </>
  )
}
