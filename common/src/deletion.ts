import {openCollectiveLink} from 'common/constants'

/**
 * The deletion reason that means Compass worked: the member is leaving because they found someone
 * here. It is the one reason where the leaving screen celebrates rather than apologises, and where it
 * asks for something — a donation, a testimonial, a follow-up — instead of pitching a reason to stay.
 */
export const FOUND_ON_COMPASS_DELETION_REASON = 'found_connection_on_compass'

/** The follow-up email is only offered, and only honoured, for that reason. */
export const FOLLOW_UP_EMAIL_DELETION_REASON = FOUND_ON_COMPASS_DELETION_REASON

/** Preset donation amounts on the leaving screen, in dollars. The first one is preselected. */
export const PARTING_DONATION_PRESETS_USD = [50, 100] as const

/** Ceiling on the custom amount field — a typo guard, not a policy. */
export const MAX_PARTING_DONATION_USD = 10_000

/**
 * Open Collective's contribution flow with the amount filled in. There is no checkout of our own, so
 * this is as close to one tap as it gets: the page opens on a one-time gift of that size.
 * See https://docs.opencollective.com/help/collectives/contribution-flow for the parameters.
 */
export const partingDonationUrl = (amountUsd: number) =>
  `${openCollectiveLink}/donate?amount=${amountUsd}`

/**
 * What the custom amount field resolves to: a whole number of dollars within bounds, or null when the
 * field is empty or holds something that is not an amount.
 */
export const parsePartingDonationAmount = (raw: string): number | null => {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const amount = Number(trimmed)
  if (amount < 1 || amount > MAX_PARTING_DONATION_USD) return null
  return amount
}
