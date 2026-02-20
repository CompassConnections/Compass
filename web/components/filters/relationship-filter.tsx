import clsx from 'clsx'
import {convertRelationshipType, RelationshipType,} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'

import {RELATIONSHIP_CHOICES} from "common/choices";
import {FilterFields} from "common/filters";

export function RelationshipFilterText(props: {
  relationship: RelationshipType[] | undefined
  highlightedClass?: string
}) {
  const {relationship, highlightedClass} = props
  const relationshipLength = (relationship ?? []).length

  const t = useT()
  if (!relationship || relationshipLength < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.relationship.any_connection', 'Any connection')}
      </span>
    )
  }

  const convertedRelationships = relationship?.map((r) =>
    t(`profile.relationship.${r}`, convertRelationshipType(r))
  )

  if (relationshipLength > 1) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          {t('filter.multiple', 'Multiple')}
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
          t: t,
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
      translationPrefix={'profile.relationship'}
      onChange={(c) => {
        updateFilter({pref_relation_styles: c})
      }}
    />
  )
}
