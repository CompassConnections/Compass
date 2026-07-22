/** One row of the country breakdown. `country` is the display name stored on `profiles.country`. */
export type CountryCount = {
  country: string
  count: number
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
  /** Top countries by profile count, descending. Profiles with no country set are excluded. */
  countries: CountryCount[]
  /** Distinct countries represented, including any outside the `countries` top-N. */
  countryCount: number
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
