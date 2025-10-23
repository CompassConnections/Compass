import clsx from 'clsx'
import {convertRelationshipType, RelationshipType,} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {RELATIONSHIP_CHOICES} from "web/components/filters/choices";
import {FilterFields} from "common/filters";

export function RelationshipFilterText(props: {
  relationship: RelationshipType[] | undefined
  highlightedClass?: string
}) {
  const {relationship, highlightedClass} = props
  const relationshipLength = (relationship ?? []).length

  if (!relationship || relationshipLength < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>Any connection</span>
    )
  }

  const convertedRelationships = relationship.map((r) =>
    convertRelationshipType(r)
  )

  if (relationshipLength > 1) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          Multiple
        </span>
      </span>
    )
  }
  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: convertedRelationships,
          capitalizeFirstLetterOption: true,
        })}{' '}
      </span>
    </div>
  )
}

export function RelationshipFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.pref_relation_styles ?? []}
      choices={RELATIONSHIP_CHOICES as any}
      onChange={(c) => {
        updateFilter({pref_relation_styles: c})
      }}
    />
  )
}
