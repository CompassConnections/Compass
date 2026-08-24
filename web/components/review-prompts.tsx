import {useQuietReviewPrompt} from 'web/hooks/use-review-prompt'

/**
 * Mounted once, from `_app.tsx`, alongside the push registrations.
 *
 * Counts the app launch (which every other review trigger is gated on) and takes the one backfill
 * shot this install gets. Renders nothing — the only thing it can ever put on screen is the store's
 * own card, and that is drawn by the store.
 */
export function ReviewPrompts() {
  useQuietReviewPrompt()
  return null
}
