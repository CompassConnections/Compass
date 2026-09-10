// Max number of new conversations a user may start within a rolling 24h window.
// Creating one more than this auto-bans them for suspected spam (see
// `backend/api/src/create-private-user-message-channel.ts`).
export const MAX_NEW_CHANNELS_PER_DAY = 10

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

/**
 * Whether a member under this ban may still look around the site.
 *
 * A provisional hold is not a verdict — nobody has looked at the account yet, and most of them turn
 * out to be genuine. Locking such a member out of the profile grid entirely punishes them for
 * something we haven't established, and it's the part they'd notice most. So a hold takes away what
 * can hurt other people (messaging, posting) and leaves browsing alone; a confirmed ban takes
 * everything.
 *
 * A null reason keeps the old full lockout on purpose: those are the hand-curated repeat abusers in
 * `create-user-and-profile.ts`, not automatic holds.
 */
export function canBrowseWhileBanned(reason: BanReason | null | undefined) {
  return reason === 'auto_rate_limit' || reason === 'under_review'
}

/**
 * Locked out of the site, as opposed to merely unable to act. Use this for anything that decides
 * whether a member sees content at all; use `isBannedFromPosting` directly for whether they may
 * write, which stays blocked under every ban.
 */
export function isFullyBanned(user: {isBannedFromPosting?: boolean; banReason?: BanReason | null}) {
  return !!user.isBannedFromPosting && !canBrowseWhileBanned(user.banReason)
}

/**
 * What to tell a member who tried to write something while banned.
 *
 * This fires on every attempt *after* the ban, which is the moment that actually shapes how someone
 * feels about it — the explanation at the moment of the auto-ban is seen once, this is seen every
 * time they try again. A bare "You are banned" is wrong for most of the people who see it: a
 * provisional hold is not a verdict, nobody has looked at the account yet, and most turn out to be
 * genuine.
 *
 * So the copy splits on whether anyone has actually judged them:
 *
 * - Provisional (`auto_rate_limit`, `under_review`): say it is a hold and not a decision, say a
 *   person will look, give the rough timeframe, and say plainly that nothing they wrote is lost —
 *   that last one is the fear, and it is cheap to answer. Tagged with `AUTO_BAN_UNDER_REVIEW_CODE`
 *   so the client can render it as a hold rather than as a ban.
 * - Confirmed (`confirmed_abuse`) and hand-curated bans (`null`): short and plain. No review
 *   promise, because there is nothing left to review, and no hint at what gave them away — naming
 *   the signal only teaches the next scammer to avoid it.
 *
 * Deliberately not apologetic in either case. The hold exists to protect other members, and copy
 * that sounds sorry about it reads as though the rule were negotiable.
 */
export function bannedFromWritingError(reason: BanReason | null | undefined) {
  if (isPermanentBan(reason) || !canBrowseWhileBanned(reason)) {
    return {
      message: 'Your account has been suspended and cannot send messages or post.',
      details: {
        resolution: 'If you believe this is a mistake, contact us at /contact.',
      },
    }
  }

  return {
    message:
      `Your account is on hold while we check it, so you can't send messages just yet. ` +
      `This is automatic and it isn't a decision about you — a person reviews every case within ` +
      `${AUTO_BAN_REVIEW_HOURS} hours and restores accounts that look genuine. Nothing you've ` +
      `written has been lost, and you can keep browsing in the meantime.`,
    details: {
      context: AUTO_BAN_UNDER_REVIEW_CODE,
      resolution: "Contact us at /contact if there's anything you'd like us to know.",
    },
  }
}
