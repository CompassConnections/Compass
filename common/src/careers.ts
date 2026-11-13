/**
 * The positions listed on `/careers`.
 *
 * Only the ids and the answer limits live here, because the API validates against them. The wording of
 * each listing is in `web/components/careers/`, where it can be translated.
 *
 * To close a position, remove its id: the page stops listing it and the API stops accepting applications
 * for it. Rows already in `job_applications` are kept.
 */
export const OPEN_POSITIONS = ['community-growth-lead'] as const

export type PositionId = (typeof OPEN_POSITIONS)[number]

/** English titles, for the staff notification. The page has its own translated copy. */
export const POSITION_TITLES: Record<PositionId, string> = {
  'community-growth-lead': 'Community Growth Lead',
}

/**
 * Answer limits, in characters. Shared so the form can show the same limit the API enforces.
 *
 * `plan` is sized for the "under 300 words" the listing asks for, with room for a long-worded language.
 */
export const MAX_APPLICATION_ABOUT_LENGTH = 1500
export const MAX_APPLICATION_PLAN_LENGTH = 2500
export const MAX_APPLICATION_RATE_LENGTH = 200
export const MAX_APPLICATION_AVAILABILITY_LENGTH = 300

export type JobApplication = {
  position: string
  about: string
  plan: string
  rate: string
  availability: string
  /** ISO timestamp of the last time the applicant sent or changed their answers. */
  updatedTime: string
}
