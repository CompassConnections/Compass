import {IS_LOCAL} from 'common/hosting/constants'

/**
 * Render the message composer for an unverified account.
 *
 * Needed by `media-creator/scripts/capture-search.mjs`: the marketing clip ends on someone reaching
 * out, and against a fresh local seed the viewer account has no verified email, so the payoff shot
 * would otherwise be the "verify your email" error state.
 *
 * This only changes which UI is drawn. The real enforcement is server-side in
 * `backend/api/src/create-private-user-message-channel.ts`, which still rejects unverified senders with
 * a 403 — so this cannot be used to actually message anyone, here or anywhere else.
 *
 * Enable with NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=1 in a local .env, running `yarn dev`.
 */
export const skipEmailVerification =
  IS_LOCAL && process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === '1'
