import {InAppReview} from '@capacitor-community/in-app-review'
import {debug} from 'common/logger'
import {
  isInstallEligible,
  ReviewMoment,
  ReviewPlatform,
  storeReviewUrl,
} from 'common/reviews/prompt'
import {safeJsonParse} from 'common/util/json'
import {useEffect} from 'react'
import {api} from 'web/lib/api'
import {track} from 'web/lib/service/analytics'
import {safeLocalStorage} from 'web/lib/util/local'
import {isNativeApp, nativePlatform} from 'web/lib/util/webview'

import {useUser} from './use-user'

/**
 * Asking for an App Store / Play Store review, from the app's side.
 *
 * The rules themselves are in `common/src/reviews/prompt.ts` and `docs/app-store-reviews.md`; this
 * file is the plumbing around them — the install-local counters, the calm-moment check, and the one
 * call to the plugin.
 *
 * The plugin call is the last thing that happens and it is fire-and-forget by necessity: it resolves
 * identically whether a review was written, the card was dismissed, or the store never rendered
 * anything because the member's yearly quota was spent. The attempt is already recorded server-side
 * by the time we get here, which is the only record there is.
 */

const INSTALL_KEY = 'review-prompt-install-v1'

/**
 * How long to let a moment settle before asking. The trigger is "they saw the good thing happen", not
 * "a page mounted", and a card that appears on top of what they navigated to reads as an interruption
 * of it rather than a response to it.
 */
const DEFAULT_SETTLE_MS = 6000

/** How long after a notification tap a profile view still counts as having come from it. */
const NOTIFICATION_WINDOW_MS = 2 * 60 * 1000

type InstallRecord = {
  /** ISO. First launch we ever saw on this install. */
  firstSeen: string
  sessions: number
  /** Backfill is a one-shot, so the ask itself is too — see `docs/app-store-reviews.md` §4. */
  quietAsked?: boolean
}

/**
 * At most one ask per launch, however many moments occur. Module-level rather than stored, because
 * "this session" is exactly the lifetime of this module.
 */
let askedThisSession = false
let sessionCounted = false
let notificationOpenedAt = 0

function readInstall(): InstallRecord | null {
  const parsed = safeJsonParse(safeLocalStorage?.getItem(INSTALL_KEY) ?? null)
  if (!parsed || typeof parsed !== 'object') return null
  const record = parsed as InstallRecord
  return typeof record.firstSeen === 'string' && typeof record.sessions === 'number' ? record : null
}

function writeInstall(record: InstallRecord) {
  safeLocalStorage?.setItem(INSTALL_KEY, JSON.stringify(record))
}

/**
 * Count this launch. Losing the record to cleared WebView storage restarts the wait, which is the
 * safe direction to fail in — it delays a prompt, it can never duplicate one, because the count that
 * must not be lost is `review_prompts` on the server.
 */
function countSession() {
  if (sessionCounted) return
  sessionCounted = true

  const existing = readInstall()
  writeInstall(
    existing
      ? {...existing, sessions: existing.sessions + 1}
      : {firstSeen: new Date().toISOString(), sessions: 1},
  )
}

/**
 * A notification tap happened. Called from `handleAppLink` in `web/pages/_app.tsx`, which every deep
 * link funnels through on both platforms — push taps, email links, universal/app links.
 */
export function markNotificationOpened() {
  notificationOpenedAt = Date.now()
}

export function cameFromNotification() {
  return Date.now() - notificationOpenedAt < NOTIFICATION_WINDOW_MS
}

/**
 * Nothing on screen that a store card would be landing on top of.
 *
 * Checked at the moment of asking rather than when the timer was set, because the six seconds in
 * between are exactly when someone opens a photo or starts typing a reply.
 */
function isCalmMoment() {
  if (typeof document === 'undefined') return false
  if (document.visibilityState !== 'visible') return false
  if (document.body.classList.contains('keyboard-open')) return false
  if (document.querySelector('[role="dialog"]')) return false
  return true
}

function appPlatform(): ReviewPlatform | null {
  if (!isNativeApp()) return null
  const platform = nativePlatform()
  return platform === 'ios' || platform === 'android' ? platform : null
}

/** What the current device can tell us about itself, for the admin diagnostics card. */
export function reviewEnvironment() {
  return {
    isApp: isNativeApp(),
    platform: nativePlatform(),
    reviewPlatform: appPlatform(),
    calm: isCalmMoment(),
  }
}

/**
 * Invoke the store's review card **right now**, bypassing every rule in this file.
 *
 * Diagnostics only — `web/components/admin/review-card-tester.tsx`. It exists to answer "is the
 * Capacitor plugin wired into this build at all", which is a question about the native project, not
 * about the prompt policy. So: no eligibility check, no server call, and deliberately **no**
 * `review_prompts` row — an admin testing the plumbing must not burn one of their own three yearly
 * asks, and must not put a row in the table that the yield numbers would later be read out of.
 *
 * Resolving means only that the call did not throw. That is worth much less than it sounds, and it is
 * worth different amounts per platform — see the tester's own copy.
 */
export async function showReviewCardNow() {
  await InAppReview.requestReview()
}

/**
 * Ask the server whether this moment has earned a review card, and show it if so.
 *
 * Safe to call from anywhere: everything that would disqualify the ask is checked here, and a member
 * on the web, in their first session, or with a modal open never reaches the network.
 *
 * `delayMs` exists because the natural place to call this is often inside the thing that has to go
 * away first — a modal's close handler runs while its own `[role="dialog"]` is still in the DOM
 * mid-transition, and the calm-moment check would count that as "not calm" and drop the ask.
 */
export async function requestReviewPrompt(moment: ReviewMoment, delayMs = 0) {
  const platform = appPlatform()
  if (!platform) return
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
  if (askedThisSession) return
  if (!isCalmMoment()) return

  const install = readInstall()
  if (!install) return
  if (
    !isInstallEligible(moment, {
      sessions: install.sessions,
      firstSeen: new Date(install.firstSeen),
      now: new Date(),
    })
  ) {
    return
  }

  // Claim the session's single ask before awaiting, so two moments firing together can't both pass.
  askedThisSession = true
  if (moment === 'quiet') writeInstall({...install, quietAsked: true})

  try {
    const {trigger} = await api('request-review-prompt', {moment, platform})
    if (!trigger) return
    // The state of the screen six seconds ago is not the state of it now.
    if (!isCalmMoment()) return

    debug('Requesting store review', {moment, trigger, platform})
    track('review prompt shown', {trigger, platform})
    await InAppReview.requestReview()
  } catch (e) {
    // Never surface this. A member who is not getting a review card should not learn that one was
    // considered, and there is nothing they could do about the failure either way.
    debug('Review prompt failed', e)
  }
}

/**
 * Ask on a page, once the moment has had time to settle.
 *
 * `enabled` is the page's own answer to "is this actually the moment" — the inbox has rendered a
 * conversation, the profile came from a notification tap. Whether that *earns* a prompt is the
 * server's call, not the page's.
 */
export function useReviewPromptMoment(
  moment: ReviewMoment,
  enabled: boolean,
  settleMs = DEFAULT_SETTLE_MS,
) {
  useEffect(() => {
    if (!enabled || !isNativeApp()) return
    const timeout = setTimeout(() => requestReviewPrompt(moment), settleMs)
    return () => clearTimeout(timeout)
  }, [moment, enabled, settleMs])
}

/**
 * Counts the launch, and takes the one backfill shot this install gets.
 *
 * Mounted once, from `<ReviewPrompts/>` in `web/pages/_app.tsx`. The quiet ask is limited to once per
 * install rather than once per session because backfill can only ever succeed once — re-asking the
 * server on every launch would be a query per launch, forever, to be told no.
 */
export function useQuietReviewPrompt() {
  const user = useUser()

  useEffect(() => {
    if (!isNativeApp()) return
    countSession()
  }, [])

  useEffect(() => {
    if (!user?.id || !isNativeApp()) return
    if (readInstall()?.quietAsked) return

    // Long enough that whatever they opened the app to do has happened first.
    const timeout = setTimeout(() => requestReviewPrompt('quiet'), 45_000)
    return () => clearTimeout(timeout)
  }, [user?.id])
}

/** Where a member-initiated "Rate Compass" control goes on this device, or null if nowhere. */
export function useStoreReviewUrl() {
  const platform = appPlatform()
  return platform ? storeReviewUrl(platform) : null
}
