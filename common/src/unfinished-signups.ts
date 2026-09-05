/**
 * The retention rule for logins that never became accounts.
 *
 * Signing up is two steps: a Firebase login is created first, and the `users` row only once the
 * profile form is submitted. Anyone who stops between the two has handed over an email address and
 * nothing else — no profile, no name, nothing visible to anyone — and that address then sits in
 * Firebase indefinitely with nothing to justify keeping it.
 *
 * The rule, which the privacy policy quotes by number, is: one notice, a grace period, then
 * deletion. The numbers live here so the job, the email, the endpoint and the policy all agree.
 */

/**
 * How long after a login is created before it counts as abandoned. Someone who signed up tonight
 * may well finish tomorrow; only after this many days do we say anything.
 */
export const UNFINISHED_SIGNUP_NOTICE_AFTER_DAYS = 3

/**
 * How long after the notice the login is deleted if still unfinished. The email quotes this number,
 * so the deletion must not happen a day sooner than it says.
 */
export const UNFINISHED_SIGNUP_GRACE_DAYS = 30

/**
 * Logins older than this that were never finished are deleted without a notice. Whoever created one
 * six months ago has long since forgotten it, and an unexpected email from a site they do not
 * remember visiting reads as spam rather than as courtesy. Deleting silently is the more private
 * outcome of the two.
 */
export const UNFINISHED_SIGNUP_STALE_AFTER_DAYS = 180

/**
 * Why a login was deleted, kept on the ledger row so the numbers on it can be read back later.
 *
 * - `grace_expired`  the notice went out and the grace period passed
 * - `stale`          older than `UNFINISHED_SIGNUP_STALE_AFTER_DAYS`, deleted without a notice
 * - `no_email`       no address to notify, deleted once the notice-plus-grace window had passed
 * - `self`           deleted by the person through the link in the notice
 */
export const UNFINISHED_SIGNUP_DELETE_REASONS = [
  'grace_expired',
  'stale',
  'no_email',
  'self',
] as const
export type UnfinishedSignupDeleteReason = (typeof UNFINISHED_SIGNUP_DELETE_REASONS)[number]

/** Where the delete link in the notice lands: a page that asks once, then calls the API. */
export const DELETE_UNFINISHED_SIGNUP_PATH = '/delete-unfinished-signup'
