import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {generateChoicesMap, KidLabel, wantsKidsLabels} from 'common/wants-kids'
import {invert} from 'lodash'
import {ReactNode} from 'react'
import {MdNoStroller, MdOutlineStroller, MdStroller} from 'react-icons/md'
import {DropdownOptions} from 'web/components/comments/dropdown-menu'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

interface KidLabelWithIcon extends KidLabel {
  icon: ReactNode
}

interface KidsLabelsMapWithIcon {
  [key: string]: KidLabelWithIcon
}

const DEFAULT_KEY = -1

export const useWantsKidsLabelsWithIcon = () => {
  const t = useT()
  return {
    no_preference: {
      ...wantsKidsLabels.no_preference,
      name: t('filter.wants_kids.any_preference', 'Either'),
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
  const {highlightedClass} = props
  const wantsKidsLabelsWithIcon = useWantsKidsLabelsWithIcon()
  const t = useT()

  const strength = props.strength ? Number(props.strength) : DEFAULT_KEY

  return (
    <Row className="items-center gap-0.5">
      {/*<WantsKidsIcon strength={strength} className={clsx('')} />*/}
      <span
        className={clsx(
          strength != wantsKidsLabelsWithIcon.no_preference.strength && 'font-semibold',
          highlightedClass,
        )}
      >
        {strength === DEFAULT_KEY && t('filter.label.wants_kids_strength', 'Wants Kids') + ': '}
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
    <DropdownOptions
      items={invert(generateChoicesMap(wantsKidsLabelsWithIcon))}
      activeKey={String(filters.wants_kids_strength ?? DEFAULT_KEY)}
      translationPrefix="profile.wants_kids"
      onClick={(key) => {
        updateFilter({wants_kids_strength: Number(key) === DEFAULT_KEY ? undefined : key})
      }}
    />
  )
}
