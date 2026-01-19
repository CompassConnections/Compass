import {hasKidsLabels} from "common/has-kids";

export type KidLabel = {
  name: string
  shortName: string
  strength: number
}

export type KidsLabelsMap = Record<string, KidLabel>

export const wantsKidsLabels: KidsLabelsMap = {
  no_preference: {
    name: 'Any preference',
    shortName: 'Either',
    strength: -1,
  },
  wants_kids: {
    name: 'Wants kids',
    shortName: 'Yes',
    strength: 2,
  },
  doesnt_want_kids: {
    name: `Doesn't want kids`,
    shortName: 'No',
    strength: 0,
  },
}
export const wantsKidsNames = Object.values(wantsKidsLabels).reduce<Record<number, string>>(
  (acc, {strength, name}) => {
    acc[strength] = name
    return acc
  },
  {}
)
export type wantsKidsDatabase = 0 | 1 | 2 | 3 | 4

export function wantsKidsToHasKidsFilter(wantsKidsStrength: wantsKidsDatabase) {
  if (wantsKidsStrength < wantsKidsLabels.wants_kids.strength) {
    return hasKidsLabels.doesnt_have_kids.value
  }
  return hasKidsLabels.no_preference.value
}

export function wantsKidsDatabaseToWantsKidsFilter(
  wantsKidsStrength: wantsKidsDatabase
) {
  // console.debug(wantsKidsStrength)
  if (wantsKidsStrength == wantsKidsLabels.no_preference.strength) {
    return wantsKidsLabels.no_preference.strength
  }
  if (wantsKidsStrength > wantsKidsLabels.wants_kids.strength) {
    return wantsKidsLabels.wants_kids.strength
  }
  if (wantsKidsStrength < wantsKidsLabels.wants_kids.strength) {
    return wantsKidsLabels.doesnt_want_kids.strength
  }
  return wantsKidsLabels.no_preference.strength
}

export const generateChoicesMap = (labels: KidsLabelsMap): Record<string, number> => {
  return Object.values(labels).reduce(
    (acc: Record<string, number>, label: KidLabel) => {
      acc[label.name] = label.strength
      return acc
    },
    {}
  )
}