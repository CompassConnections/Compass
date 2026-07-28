// Max number of new conversations a user may start within a rolling 24h window.
// Creating one more than this auto-bans them for suspected spam (see
// `backend/api/src/create-private-user-message-channel.ts`).
export const MAX_NEW_CHANNELS_PER_DAY = 5

// Machine-readable marker on the APIError details, so the frontend can tell an automatic
// "account on hold, pending human review" ban apart from a deliberate admin ban and show the
// reassuring copy instead of a bare "You are banned".
export const AUTO_BAN_UNDER_REVIEW_CODE = 'auto-ban-under-review'

// Rough promise we make to auto-banned users about how long the manual review takes.
export const AUTO_BAN_REVIEW_HOURS = 24

/**
 * Why an account is banned — stored in `users.ban_reason`, null when the account is in good
 * standing. This drives what the banned member is told, which differs sharply by case:
 *
 * - `auto_rate_limit` / `under_review`: provisional. Nobody has judged them yet, so we explain what
 *   happened and promise a human review — most are genuine and get restored.
 * - `confirmed_abuse`: a moderator confirmed a scam, spam or harassment. Permanent, and the copy
 *   says so plainly: no duration, no review promise (there is nothing left to review), and no hint
 *   at what gave them away — scammers just work around whatever signal you name.
 */
export const BAN_REASONS = ['auto_rate_limit', 'under_review', 'confirmed_abuse'] as const

export type BanReason = (typeof BAN_REASONS)[number]

/** Bans that are final: the decision is made and we don't invite the user to wait for a review. */
export function isPermanentBan(reason: BanReason | null | undefined) {
  return reason === 'confirmed_abuse'
}
