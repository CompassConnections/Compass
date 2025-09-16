import clsx from 'clsx'
import GenderIcon from '../gender-icon'
import { Gender } from 'common/gender'
import { Row } from 'web/components/layout/row'
import { MultiCheckbox } from 'web/components/multi-checkbox'

import {FilterFields} from "common/filters";

export function GenderFilterText(props: {
  gender: Gender[] | undefined
  highlightedClass?: string
}) {
  const { gender, highlightedClass } = props

  if (!gender || gender.length < 1) {
    return (
      <span>
        <span className={clsx('text-semibold', highlightedClass)}>Any</span>{' '}
        <span className="hidden sm:inline">gender</span>
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
        gender{gender.length > 1 ? 's' : ''}
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
        choices={{
          Women: 'female',
          Men: 'male',
          'Other': 'other',
        }}
        onChange={(c) => {
          updateFilter({ genders: c })
        }}
      />
    </>
  )
}
