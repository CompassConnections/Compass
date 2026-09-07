import {hasKidsLabels} from 'common/has-kids'

export type KidLabel = {
  name: string
  shortName: string
  strength: number
}

export type KidsLabelsMap = Record<string, KidLabel>

/**
 * Deprecated and ignored — the three-option vocabulary of the old kid-desire filter ("Either" /
 * "Wants kids" / "Doesn't want kids"), which collapsed the profile's five-point answer onto three
 * points and then swept everything above or below the one that was picked.
 *
 * The filter is an interval over the five answers themselves now
 * (`WANTS_KIDS_STRENGTH_NAMES`, `wants_kids_range_min` / `wants_kids_range_max`), so nothing below
 * this comment has a caller. Kept rather than deleted because these are the shapes any stored
 * three-option value would have to be read back through.
 *
 * @deprecated use {@link WANTS_KIDS_STRENGTH_NAMES} and {@link getWantsKidsRange}.
 */
export const wantsKidsLabels: KidsLabelsMap = {
  no_preference: {
    name: 'Either',
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
/** @deprecated part of the retired three-option kid-desire filter; see {@link wantsKidsLabels}. */
export const wantsKidsNames = Object.values(wantsKidsLabels).reduce<Record<number, string>>(
  (acc, {strength, name}) => {
    acc[strength] = name
    return acc
  },
  {},
)
export type wantsKidsDatabase = 0 | 1 | 2 | 3 | 4

/** @deprecated part of the retired three-option kid-desire filter; see {@link wantsKidsLabels}. */
export function wantsKidsToHasKidsFilter(wantsKidsStrength: wantsKidsDatabase) {
  if (wantsKidsStrength >= 0 && wantsKidsStrength < wantsKidsLabels.wants_kids.strength) {
    return hasKidsLabels.doesnt_have_kids.value
  }
  return null // hasKidsLabels.no_preference.value
}

/** @deprecated part of the retired three-option kid-desire filter; see {@link wantsKidsLabels}. */
export function wantsKidsDatabaseToWantsKidsFilter(wantsKidsStrength: wantsKidsDatabase) {
  // console.debug(wantsKidsStrength)
  if (wantsKidsStrength == wantsKidsLabels.no_preference.strength) {
    return null // wantsKidsLabels.no_preference.strength
  }
  if (wantsKidsStrength > wantsKidsLabels.wants_kids.strength) {
    return wantsKidsLabels.wants_kids.strength
  }
  if (wantsKidsStrength < wantsKidsLabels.wants_kids.strength) {
    return wantsKidsLabels.doesnt_want_kids.strength
  }
  return wantsKidsLabels.no_preference.strength
}

/** @deprecated part of the retired three-option kid-desire filter; see {@link wantsKidsLabels}. */
export const generateChoicesMap = (labels: KidsLabelsMap): Record<string, number> => {
  return Object.values(labels).reduce((acc: Record<string, number>, label: KidLabel) => {
    acc[label.name] = label.strength
    return acc
  }, {})
}

/**
 * How far apart two answers to "I would like to have kids" may sit and still count as compatible.
 *
 * The answers span a five-point scale, so a tolerance of 2 means "does not want children" still sees
 * "neutral or open" but not "Leaning towards": neighbouring positions are a
 * difference of degree, opposite halves of the scale are the actual dealbreaker.
 */
export const WANTS_KIDS_TOLERANCE = 2

export const WANTS_KIDS_MIN_STRENGTH = 0
export const WANTS_KIDS_MAX_STRENGTH = 4

/**
 * The five answers to "I would like to have kids", keyed by the strength stored on the profile.
 *
 * The question used to be asked on the generic 0-4 agreement scale (`MultipleChoiceOptions`), which
 * left the answers reading as "Strongly disagree" — fine directly under the statement, meaningless
 * anywhere else, and the profile page and the search panel are both anywhere else. Naming the
 * answers themselves lets all three surfaces say the same thing; they already shared the
 * `profile.wants_kids_<n>` translation keys.
 */
export const WANTS_KIDS_STRENGTH_NAMES: Record<number, string> = {
  0: 'Does not want children',
  1: 'Leaning against',
  2: 'Neutral',
  3: 'Leaning towards',
  4: 'Wants children',
}

/** The same five answers at tick-mark width, for the axis of the range slider. */
export const WANTS_KIDS_STRENGTH_SHORT_NAMES: Record<number, string> = {
  0: 'No',
  1: 'Lean no',
  2: 'Neutral',
  3: 'Lean yes',
  4: 'Yes',
}

/**
 * The band of kid-desire answers compatible with `strength`, or `undefined` when there is nothing to
 * narrow by — either the member never answered (`null`, or the -1 "no preference" the form stores),
 * or their answer sits centrally enough that the band spans the whole scale anyway and would filter
 * nobody out.
 *
 * Symmetric by construction (|a - b| <= 2), so the same band answers both "do they suit me?" and "do
 * I suit them?" — which is why the two-way search reuses it rather than mirroring it.
 */
export const getWantsKidsRange = (strength: number | null | undefined) => {
  if (strength == null || strength < WANTS_KIDS_MIN_STRENGTH) return undefined
  const min = Math.max(WANTS_KIDS_MIN_STRENGTH, strength - WANTS_KIDS_TOLERANCE)
  const max = Math.min(WANTS_KIDS_MAX_STRENGTH, strength + WANTS_KIDS_TOLERANCE)
  if (min === WANTS_KIDS_MIN_STRENGTH && max === WANTS_KIDS_MAX_STRENGTH) return undefined
  return {min, max}
}
