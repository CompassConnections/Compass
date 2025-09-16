import {ReactNode} from 'react'
import {MdNoStroller, MdOutlineStroller, MdStroller} from 'react-icons/md'
import {Row} from 'web/components/layout/row'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import clsx from 'clsx'
import {FilterFields} from "common/filters";

import {generateChoicesMap, KidLabel, wantsKidsLabels} from "common/wants-kids"

interface KidLabelWithIcon extends KidLabel {
  icon: ReactNode
}

interface KidsLabelsMapWithIcon {
  [key: string]: KidLabelWithIcon
}

export const wantsKidsLabelsWithIcon: KidsLabelsMapWithIcon = {
  ...wantsKidsLabels,
  no_preference: {
    ...wantsKidsLabels.no_preference,
    icon: <MdOutlineStroller className="h-4 w-4"/>,
  },
  wants_kids: {
    ...wantsKidsLabels.wants_kids,
    icon: <MdStroller className="h-4 w-4"/>,
  },
  doesnt_want_kids: {
    ...wantsKidsLabels.doesnt_want_kids,
    icon: <MdNoStroller className="h-4 w-4"/>,
  },
}


export function WantsKidsIcon(props: { strength: number; className?: string }) {
  const {strength, className} = props
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

export function KidsLabel(props: {
  strength: number
  highlightedClass?: string
  mobile?: boolean
}) {
  const {strength, highlightedClass, mobile} = props

  return (
    <Row className="items-center gap-0.5">
      <WantsKidsIcon strength={strength} className={clsx('hidden sm:inline')}/>
      <span
        className={clsx(
          strength != wantsKidsLabelsWithIcon.no_preference.strength && 'font-semibold',
          highlightedClass
        )}
      >
        {strength == wantsKidsLabelsWithIcon.no_preference.strength
          ? mobile
            ? wantsKidsLabelsWithIcon.no_preference.shortName
            : wantsKidsLabelsWithIcon.no_preference.name
          : strength == wantsKidsLabelsWithIcon.wants_kids.strength
            ? mobile
              ? wantsKidsLabelsWithIcon.wants_kids.shortName
              : wantsKidsLabelsWithIcon.wants_kids.name
            : mobile
              ? wantsKidsLabelsWithIcon.doesnt_want_kids.shortName
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

  return (
    <ChoicesToggleGroup
      currentChoice={filters.wants_kids_strength ?? 0}
      choicesMap={generateChoicesMap(wantsKidsLabelsWithIcon)}
      setChoice={(c) => updateFilter({wants_kids_strength: Number(c)})}
      toggleClassName="w-1/3 justify-center"
    />
  )
}
