import {InAppReview} from '@capacitor-community/in-app-review'
import {debug, logger} from 'common/logger'
import {
  isInstallEligible,
  ReviewMoment,
  ReviewPlatform,
  storeReviewUrl,
} from 'common/reviews/prompt'
import {safeJsonParse} from 'common/util/json'
import {useEffect, useRef} from 'react'
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

/**
 * How long to wait after a conversation closes.
 *
 * Much shorter than `DEFAULT_SETTLE_MS`, and for the opposite reason. That one waits for a page the
 * member has just arrived at to stop being interesting; this one waits only for the screen they have
 * just left to finish leaving. The good feeling being traded on is the reply they read a few seconds
 * ago, and it does not improve with keeping — every extra second is only more time for them to open
 * another thread or put the phone down.
 */
const EXIT_SETTLE_MS = 1000

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

/**
 * Whether an open conversation is on screen, published by the thread page through
 * `useReviewPromptOnConversationExit`.
 *
 * A flag rather than a look at `location.pathname`, because in the app that path is not what it is on
 * the web: the static export ships this dynamic route as a literal `/messages/[channelId].html`.
 */
let inConversation = false

/**
 * An ask that has been scheduled but not yet made. Module-level, and deliberately not owned by a React
 * effect — see `armReviewPrompt`.
 */
let pendingAsk: ReturnType<typeof setTimeout> | null = null

const DAY_MS = 24 * 60 * 60 * 1000

const daysSince = (from: Date) => Math.round(((Date.now() - from.getTime()) / DAY_MS) * 100) / 100

/**
 * Diagnostics for a feature that by design leaves almost no trace: every rule below fails closed and
 * silently, and the store says nothing afterwards either. Without these lines the only observable is
 * a `review_prompts` row that isn't there, which is equally consistent with nine different causes.
 *
 * `logger.info` rather than `debug()` on purpose — `debug()` compiles to a no-op anywhere
 * `IS_DEPLOYED`/`NODE_ENV=production` holds, and the production app is the only build whose behaviour
 * is actually in question. Read them over USB: Safari's Web Inspector on iOS, `chrome://inspect` or
 * `adb logcat` on Android.
 */
function reviewLog(message: string, context?: Record<string, unknown>) {
  logger.info(`[review-prompt] ${message}`, context)
}

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
  const record: InstallRecord = existing
    ? {...existing, sessions: existing.sessions + 1}
    : {firstSeen: new Date().toISOString(), sessions: 1}
  writeInstall(record)

  // `fresh` is the line to look for when a device never prompts: a count that is 1 on every launch
  // means WebView storage is being cleared under us, and the session threshold can never be reached.
  reviewLog('session counted', {
    sessions: record.sessions,
    firstSeen: record.firstSeen,
    daysInstalled: daysSince(new Date(record.firstSeen)),
    quietAsked: !!record.quietAsked,
    fresh: !existing,
  })
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
 *
 * Names the blocker instead of returning a boolean: "not calm" is the least actionable line a log can
 * carry, and the causes are fixed in different places.
 */
function calmBlocker(): string | null {
  if (typeof document === 'undefined') return 'no-document'
  // The rule that lets an ask outlive the page that armed it: wherever the member has got to in the
  // meantime, it is never on top of an open conversation. Someone who left one thread and opened
  // another within the settle window is mid-conversation again, and gets asked when *that* one closes.
  if (inConversation) return 'in-conversation'
  if (document.visibilityState !== 'visible') return `visibility:${document.visibilityState}`
  if (document.body.classList.contains('keyboard-open')) return 'keyboard-open'
  if (document.querySelector('[role="dialog"]')) return 'dialog-open'
  return null
}

function isCalmMoment() {
  return calmBlocker() === null
}

function appPlatform(): ReviewPlatform | null {
  if (!isNativeApp()) return null
  const platform = nativePlatform()
  return platform === 'ios' || platform === 'android' ? platform : null
}

/** What the current device can tell us about itself, for the admin diagnostics card. */
export function reviewEnvironment() {
  const install = readInstall()
  return {
    isApp: isNativeApp(),
    platform: nativePlatform(),
    reviewPlatform: appPlatform(),
    calm: isCalmMoment(),
    /** *Which* check said "not calm" — the actionable half of `calm`, and null when it is calm. */
    calmBlocker: calmBlocker(),
    /** The install-local half of the rules as this device currently has it, or null if never written. */
    install,
    daysInstalled: install ? daysSince(new Date(install.firstSeen)) : null,
    askedThisSession,
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
 * Schedule an ask that outlives the component which armed it.
 *
 * Not a `setTimeout` inside an effect, because the event being waited out *is* the unmount: a timer
 * cleaned up on unmount cancels itself on exactly the thing it exists to observe. That was the bug —
 * six seconds on the inbox list is longer than it takes to tap a conversation, so the ask was
 * cancelled far more often than it fired.
 *
 * Letting it outlive the page is only safe because `calmBlocker` is re-read when it fires, and a
 * dropped ask costs nothing: `askedThisSession` is claimed after that check, so the next exit re-arms.
 */
function armReviewPrompt(moment: ReviewMoment, delayMs: number) {
  if (pendingAsk) clearTimeout(pendingAsk)
  reviewLog('ask armed', {moment, delayMs})
  pendingAsk = setTimeout(() => {
    pendingAsk = null
    void requestReviewPrompt(moment)
  }, delayMs)
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
  if (!platform) {
    // Expected on the web and in a browser-based dev session; never expected in the app.
    reviewLog('stopped: not the native app', {moment, platform: nativePlatform()})
    return
  }
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
  if (askedThisSession) {
    // Including an ask the server then declined: the session's single slot is spent either way, which
    // is why a `quiet` backfill that returns null still silences the inbox for the rest of the launch.
    reviewLog('stopped: a moment already claimed this session', {moment})
    return
  }
  const blocker = calmBlocker()
  if (blocker) {
    reviewLog('stopped: not a calm moment', {moment, blocker})
    return
  }

  const install = readInstall()
  if (!install) {
    reviewLog('stopped: no install record', {moment, key: INSTALL_KEY})
    return
  }
  const installFacts = {
    sessions: install.sessions,
    firstSeen: new Date(install.firstSeen),
    now: new Date(),
  }
  if (!isInstallEligible(moment, installFacts)) {
    reviewLog('stopped: install not eligible yet', {
      moment,
      sessions: install.sessions,
      firstSeen: install.firstSeen,
      daysInstalled: daysSince(installFacts.firstSeen),
    })
    return
  }

  // Claim the session's single ask before awaiting, so two moments firing together can't both pass.
  askedThisSession = true
  if (moment === 'quiet') writeInstall({...install, quietAsked: true})

  try {
    reviewLog('asking the server', {moment, platform, sessions: install.sessions})
    const {trigger} = await api('request-review-prompt', {moment, platform})
    if (!trigger) {
      // The server's own log line says which fact decided it — grep the API for the same moment.
      reviewLog('server declined; no row written', {moment, platform})
      return
    }
    // The state of the screen six seconds ago is not the state of it now. But before exiting,
    // need to undo the row in `review_prompts` that was added by the request. Otherwise, the user
    // won't be shown another prompt at the next calm moment.
    // if (!isCalmMoment()) return

    reviewLog('server granted; a review_prompts row now exists', {moment, trigger, platform})
    debug('Requesting store review', {moment, trigger, platform})
    track('review prompt shown', {trigger, platform})
    await InAppReview.requestReview()
    // Resolving says nothing about whether a card appeared — see the admin tester's copy. A row with
    // no matching line here, on the other hand, means the plugin threw.
    reviewLog('store call resolved', {moment, trigger, platform})
  } catch (e) {
    // Never surface this. A member who is not getting a review card should not learn that one was
    // considered, and there is nothing they could do about the failure either way.
    reviewLog('threw', {
      moment,
      platform,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    })
    debug('Review prompt failed', e)
  }
}

/**
 * Ask on a page, once the moment has had time to settle.
 *
 * `enabled` is the page's own answer to "is this actually the moment" — the profile came from a
 * notification tap. Whether that *earns* a prompt is the server's call, not the page's.
 *
 * Only for moments that are genuinely about *dwelling* on a page, which is why the cleanup cancels:
 * a member who navigated away did not dwell. A moment about *leaving* wants the opposite and belongs
 * in `useReviewPromptOnConversationExit`.
 */
/**
 * The best moment Compass has: a conversation with a reply in it, just closed.
 *
 * Not when the reply arrives — they have not read it yet, and a card on top of an incoming message is
 * an interruption of the thing it is congratulating them on. Not while they are reading it either, for
 * the same reason and because the keyboard is usually up. And not on the inbox list, which is a
 * corridor: most visits to it are on the way *into* a thread, not out of one.
 *
 * What is left is the first calm beat after the episode closes — they read what someone wrote back,
 * answered it or didn't, and stepped out. The value the app just delivered is the freshest thing in
 * their mind and nothing is waiting on them. Both stores' guidance says the same in the abstract
 * ("after a positive interaction completes, never mid-task"); this is where that lands here.
 *
 * `sawReply` is the page's own answer to "was there anything to feel good about" — a thread they are
 * talking into the void in is not a moment, however long they spent in it. Whether the exchange is
 * two-way *enough* remains the server's call.
 */
export function useReviewPromptOnConversationExit(sawReply: boolean, settleMs = EXIT_SETTLE_MS) {
  // Read at unmount rather than captured when the effect ran: the last message often arrives, or is
  // sent, while the thread is open, and the answer that matters is the one at the moment they leave.
  const sawReplyRef = useRef(sawReply)
  sawReplyRef.current = sawReply

  useEffect(() => {
    if (!isNativeApp()) return

    inConversation = true
    return () => {
      inConversation = false
      if (!sawReplyRef.current) {
        reviewLog('conversation closed with nothing to celebrate')
        return
      }
      armReviewPrompt('conversation-exit', settleMs)
    }
  }, [settleMs])
}

export function useReviewPromptMoment(
  moment: ReviewMoment,
  enabled: boolean,
  settleMs = DEFAULT_SETTLE_MS,
) {
  useEffect(() => {
    // Silent on the web on purpose: this hook mounts on pages every browser visitor sees.
    if (!isNativeApp()) return
    if (!enabled) {
      reviewLog('moment not armed', {moment})
      return
    }

    reviewLog('moment armed', {moment, settleMs})
    let settled = false
    const timeout = setTimeout(() => {
      settled = true
      requestReviewPrompt(moment)
    }, settleMs)
    return () => {
      // Correct for a dwell-based moment — they did not in fact stay — and the reason `got-reply` is
      // no longer one of these. See `useReviewPromptOnConversationExit`.
      if (!settled) reviewLog('moment cancelled before it settled', {moment, settleMs})
      clearTimeout(timeout)
    }
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
    if (readInstall()?.quietAsked) {
      reviewLog('quiet backfill already spent on this install')
      return
    }

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
