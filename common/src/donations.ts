import {YEAR_MS} from 'common/util/time'

/**
 * Donations and the supporter badge.
 *
 * Compass runs on donations, and a member who keeps it running may say so on their profile. The badge
 * shows one number: what they gave over the trailing year. A rolling window rather than a lifetime
 * total, so that the badge says "is supporting" and not "once supported", and so that it lapses on its
 * own without anyone having to revoke anything.
 *
 * Rows are entered by hand from /admin/donations — there is no payment webhook — and the member can
 * take the badge off their profile from Settings → Data & Privacy (`profiles.donor_badge_hidden`).
 *
 * Amounts are integer cents end to end; only the display layer turns them into dollars.
 */

/** How far back the badge looks. */
export const DONOR_BADGE_WINDOW_MS = YEAR_MS

/** Sanity ceiling on a single hand-entered donation, in dollars. A typo, not a policy. */
export const MAX_DONATION_USD = 1_000_000

export const MAX_DONATION_NOTE_LENGTH = 500

/** How many rows the admin page lists. Newest first; older history stays in the table. */
export const ADMIN_DONATIONS_LIMIT = 500

/** What the profile page gets: nothing more than the number it will draw. */
export type DonorBadge = {
  /** Sum over the window. Zero when there is nothing to show, including when the member opted out. */
  amountCents: number
}

/** One donation as the admin page sees it. */
export type AdminDonation = {
  id: number
  userId: string
  name: string
  username: string
  avatarUrl: string | null
  amountCents: number
  /** ISO timestamp. */
  donatedAt: string
  note: string | null
  adminId: string | null
  createdTime: string
}

export const dollarsToCents = (usd: number) => Math.round(usd * 100)

/**
 * Sum the donations that fall inside the badge window, as of `now`.
 *
 * The same rule the API applies in SQL (`donated_at > now() - interval '365 days'`), kept here so
 * the admin page can show the number the badge is about to show without a second request, and so
 * the rule has a unit test.
 */
export function sumPastYearCents(
  donations: {amountCents: number; donatedAt: string | Date}[],
  now: number = Date.now(),
) {
  const since = now - DONOR_BADGE_WINDOW_MS
  return donations
    .filter((d) => new Date(d.donatedAt).getTime() > since)
    .reduce((sum, d) => sum + d.amountCents, 0)
}

/**
 * "$1,250" or "$12.50": whole dollars when the amount is whole, cents otherwise. Donations are
 * almost always round numbers, and "$50.00" reads as an invoice where "$50" reads as a gift.
 */
export function formatDonationAmount(amountCents: number, locale?: string) {
  const whole = amountCents % 100 === 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountCents / 100)
}
