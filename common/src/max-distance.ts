/**
 * `profiles.pref_max_distance` — the absolute maximum distance, in miles, a member is willing to
 * have between their city and someone else's.
 *
 * This is *not* the search radius. The radius in the filters is a knob the person browsing turns to
 * widen or narrow one search; this is a standing fact about the member, read off the *other* side by
 * the two-way search to drop candidates who have already said someone this far away is out of range.
 *
 * `null` — the default, and what everyone starts with — means no limit at all. That default is
 * deliberate: a stated ceiling only ever removes people, so it is worth setting only when distance is
 * a genuine dealbreaker rather than a mild preference.
 */
export const PREF_MAX_DISTANCE_CHOICES = [100, 250, 500, 1000, 2000] as const

export const MIN_PREF_MAX_DISTANCE = PREF_MAX_DISTANCE_CHOICES[0]
export const MAX_PREF_MAX_DISTANCE = PREF_MAX_DISTANCE_CHOICES[
  PREF_MAX_DISTANCE_CHOICES.length - 1
] as number

/**
 * The sentinel the profile form's single-choice control uses for "no limit". The control's values
 * have to be primitives, and `null` is what it already sends when an option is deselected, so the
 * "any distance" option needs a value of its own that maps back to `null` on the way to the database.
 */
export const NO_MAX_DISTANCE = 0
