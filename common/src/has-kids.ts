export interface HasKidLabel {
  name: string
  shortName: string
  value: number
}

export interface HasKidsLabelsMap {
  [key: string]: HasKidLabel
}

export const hasKidsLabels: HasKidsLabelsMap = {
  no_preference: {
    name: 'Any kids',
    shortName: 'Either',
    value: -1,
  },
  has_kids: {
    name: 'Has kids',
    shortName: 'Yes',
    value: 1,
  },
  doesnt_have_kids: {
    name: `Doesn't have kids`,
    shortName: 'No',
    value: 0,
  },
}
export const hasKidsNames = Object.values(hasKidsLabels).reduce<Record<number, string>>(
  (acc, {value, name}) => {
    acc[value] = name
    return acc
  },
  {},
)

export const generateChoicesMap = (labels: HasKidsLabelsMap): Record<string, number> => {
  return Object.values(labels).reduce((acc: Record<string, number>, label: HasKidLabel) => {
    acc[label.name] = label.value
    return acc
  }, {})
}

// export const NO_PREFERENCE_STRENGTH = -1
// export const WANTS_KIDS_STRENGTH = 2
// export const DOESNT_WANT_KIDS_STRENGTH = 0
