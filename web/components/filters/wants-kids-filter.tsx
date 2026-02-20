import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {generateChoicesMap, KidLabel, wantsKidsLabels} from 'common/wants-kids'
import {ReactNode} from 'react'
import {MdNoStroller, MdOutlineStroller, MdStroller} from 'react-icons/md'
import {Row} from 'web/components/layout/row'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {useT} from 'web/lib/locale'

interface KidLabelWithIcon extends KidLabel {
  icon: ReactNode
}

interface KidsLabelsMapWithIcon {
  [key: string]: KidLabelWithIcon
}

export const useWantsKidsLabelsWithIcon = () => {
  const t = useT()
  return {
    no_preference: {
      ...wantsKidsLabels.no_preference,
      name: t('filter.wants_kids.any_preference', 'Any preference'),
      shortName: t('filter.wants_kids.either', 'Either'),
      icon: <MdOutlineStroller className="h-4 w-4" />,
    },
    wants_kids: {
      ...wantsKidsLabels.wants_kids,
      name: t('filter.wants_kids.wants_kids', 'Wants kids'),
      shortName: t('common.yes', 'Yes'),
      icon: <MdStroller className="h-4 w-4" />,
    },
    doesnt_want_kids: {
      ...wantsKidsLabels.doesnt_want_kids,
      name: t('filter.wants_kids.doesnt_want_kids', "Doesn't want kids"),
      shortName: t('common.no', 'No'),
      icon: <MdNoStroller className="h-4 w-4" />,
    },
  } as KidsLabelsMapWithIcon
}

export function WantsKidsIcon(props: {strength: number; className?: string}) {
  const {strength, className} = props
  const wantsKidsLabelsWithIcon = useWantsKidsLabelsWithIcon()

  return (
    <span className={className}>
      {strength == wantsKidsLabelsWithIcon.no_preference.strength
        ? wantsKidsLabelsWithIcon.no_preference.icon
        : strength == wantsKidsLabelsWithIcon.wants_kids.strength
          ? wantsKidsLabelsWithIcon.wants_kids.icon
          : wantsKidsLabelsWithIcon.doesnt_want_kids.icon}
    </span>
  )
}

export function KidsLabel(props: {strength: number; highlightedClass?: string; mobile?: boolean}) {
  const {strength, highlightedClass} = props
  const wantsKidsLabelsWithIcon = useWantsKidsLabelsWithIcon()

  return (
    <Row className="items-center gap-0.5">
      <WantsKidsIcon strength={strength} className={clsx('')} />
      <span
        className={clsx(
          strength != wantsKidsLabelsWithIcon.no_preference.strength && 'font-semibold',
          highlightedClass,
        )}
      >
        {strength == wantsKidsLabelsWithIcon.no_preference.strength
          ? wantsKidsLabelsWithIcon.no_preference.name
          : strength == wantsKidsLabelsWithIcon.wants_kids.strength
            ? wantsKidsLabelsWithIcon.wants_kids.name
            : wantsKidsLabelsWithIcon.doesnt_want_kids.name}
      </span>
    </Row>
  )
}

export function WantsKidsFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  const wantsKidsLabelsWithIcon = useWantsKidsLabelsWithIcon()

  return (
    <ChoicesToggleGroup
      currentChoice={filters.wants_kids_strength ?? 0}
      choicesMap={generateChoicesMap(wantsKidsLabelsWithIcon)}
      setChoice={(c) => updateFilter({wants_kids_strength: Number(c)})}
      toggleClassName="w-1/3 justify-center"
    />
  )
}
