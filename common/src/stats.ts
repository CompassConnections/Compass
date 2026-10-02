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

/**
 * "Share of members who picked *any* of these values" for multi-select fields.
 *
 * A per-value distribution can't answer this: one member who ticks both "vegan" and "vegetarian" counts
 * once in the base and twice in the bars, so adding the bars overstates. These groups are counted per
 * profile on the server instead (`profiles.field && values`), so each member counts once. They back the
 * claims the home page makes in prose ("secular", "more plant-based", "looking for a partner"), which is
 * why the set is small and named rather than open-ended.
 */
export const GROUP_SHARES = {
  secular: {field: 'religion', values: ['atheist', 'agnostic']},
  plantBased: {field: 'diet', values: ['vegan', 'veg']},
  seekingRelationship: {field: 'pref_relation_styles', values: ['relationship']},
} as const satisfies Record<string, {field: DemographicField; values: readonly string[]}>

export type GroupShareKey = keyof typeof GROUP_SHARES

/** Profiles matching a `GROUP_SHARES` entry, against the profiles that answered that field at all. */
export type GroupShare = {count: number; base: number}

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
  /** Members with a `user_activity.last_online_time` within the last 30 days. Aggregated server-side and
   *  cached here so the client no longer reads the whole `user_activity` table for a count. */
  activeMembers: number
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
  /**
   * The `GROUP_SHARES` counts. Omitted per group under the same respondent floor as `demographics`,
   * and also when the matching count itself is under it, so a small group is never pinned down.
   */
  groupShares: Partial<Record<GroupShareKey, GroupShare>>
  /**
   * Daily new-profile counts for the member-growth charts — one row per UTC day the platform gained a
   * profile, oldest first. `total` is all new profiles that day; `completed` is the subset with a
   * filled-out bio or occupation. Aggregated server-side and cached with the rest of /stats so the
   * client never pulls one row per profile (which also keeps it under the PostgREST max-rows cap as the
   * member base grows). `day` is an ISO `YYYY-MM-DD` string.
   */
  memberGrowth: {day: string; total: number; completed: number}[]
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
