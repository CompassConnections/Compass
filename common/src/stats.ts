/** One row of the country breakdown. `country` is the display name stored on `profiles.country`. */
export type CountryCount = {
  country: string
  count: number
}

// ─── Demographic distributions ──────────────────────────────────────────────
//
// The profile fields the /stats page breaks down ("who's on Compass"). Listed once here so the backend
// (which aggregates them) and the frontend (which labels and orders them) agree on the set and can't
// drift apart. `multi` marks the array-valued columns: their percentages are of *respondents*, not of
// the whole population, and don't sum to 100 because one profile can select several.
export const DEMOGRAPHIC_FIELDS = {
  age: {multi: false},
  gender: {multi: false},
  education_level: {multi: false},
  political_beliefs: {multi: true},
  religion: {multi: true},
  mbti: {multi: false},
  diet: {multi: true},
  ethnicity: {multi: true},
  orientation: {multi: true},
  pref_relation_styles: {multi: true},
  relationship_status: {multi: true},
  languages: {multi: true},
} as const

export type DemographicField = keyof typeof DEMOGRAPHIC_FIELDS

/** One bar of a distribution: a raw stored value (e.g. `'bachelors'`) and how many profiles have it. */
export type DistributionItem = {value: string; count: number}

export type Distribution = {
  /**
   * Profiles that answered this field — the denominator for every bar's percentage. For a multi-select
   * field it is the number of *distinct* profiles with at least one selection, so the percentages read
   * as "share of members who told us" rather than a fraction of a fraction.
   */
  base: number
  /** True for array-valued fields; percentages are of respondents and don't sum to 100. */
  multi: boolean
  /** Top values, most common first (age buckets are ordered by age instead). Long tail is dropped. */
  items: DistributionItem[]
}

export type Stats = {
  users: number
  profiles: number
  upcomingEvents: number
  messages: number
  /** Message channels that carry at least one message — empty channels aren't conversations. */
  conversations: number
  genderRatio: Record<string, number>
  genderCounts: Record<string, number>
  /** Every country with at least one member, by profile count descending. Profiles with no country set
   *  are excluded. The full list (not a top-N) so the map can shade every one; consumers slice their own. */
  countries: CountryCount[]
  /** Distinct countries represented — same as `countries.length`, kept for callers that only need the number. */
  countryCount: number
  /**
   * Per-field breakdowns of the member base. A field is omitted entirely when too few members answered
   * it to publish (see the floor in the handler) — a distribution built on a handful of people is both
   * noise and a soft privacy leak, so the card simply doesn't render rather than showing a weak bar.
   */
  demographics: Partial<Record<DemographicField, Distribution>>
}

/**
 * Open-source activity for the public repo. Every field is nullable: the about page evidences the
 * "community owned" claim with these, and a number we could not actually fetch is worse than no
 * number, so the UI renders nothing rather than a zero when GitHub is unreachable.
 */
export type RepoStats = {
  stars: number | null
  forks: number | null
  contributors: number | null
  openIssues: number | null
  lastCommitTime: Date | null
}
