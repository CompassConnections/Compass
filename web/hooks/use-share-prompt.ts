import {debug, logger} from 'common/logger'
import {
  isShareInstallEligible,
  SHARE_VIDEO_AVAILABLE,
  ShareMoment,
  SharePlatform,
} from 'common/share/prompt'
import {safeJsonParse} from 'common/util/json'
import {useEffect, useRef, useSyncExternalStore} from 'react'
import {api} from 'web/lib/api'
import {track} from 'web/lib/service/analytics'
import {safeLocalStorage, safeSessionStorage} from 'web/lib/util/local'
import {markPromptShown, promptShownThisSession} from 'web/lib/util/prompt-session'
import {isNativeApp, nativePlatform} from 'web/lib/util/webview'

import {useUser} from './use-user'

/**
 * Showing Martin's "help Compass grow" video at the moments a member is most likely to share.
 *
 * The rules are in `common/src/share/prompt.ts`; this file is the plumbing, modelled on
 * `use-review-prompt.ts`: an install-local session count, a calm-moment check, one ask per session,
 * and the server call that grants and records the ask. Unlike the review card it runs on every
 * platform, and the thing it opens is our own dialog — `<SharePrompts/>` in `_app.tsx`.
 */

const INSTALL_KEY = 'share-prompt-install-v1'

/** Marks this browser tab as counted, so a page reload on the web is not a new session. */
const SESSION_KEY = 'share-prompt-session-counted'

/** A page the member just arrived at settles for this long before the quiet ask. */
const QUIET_DELAY_MS = 60_000

/** How long after leaving a conversation to ask. Matches the review prompt's exit settle. */
const EXIT_SETTLE_MS = 1000

/**
 * In the app, the store review card gets the first go at a shared moment — its quota is scarce and
 * the iOS launch window is short. The video waits this much longer and stands down if the card was
 * granted in between.
 */
const REVIEW_HEADSTART_MS = 3000

type InstallRecord = {
  sessions: number
  /** The quiet catch-up is a one-shot, so the ask itself is too. */
  quietAsked?: boolean
}

let askedThisSession = false
let sessionCounted = false
let inConversation = false
let pendingAsk: ReturnType<typeof setTimeout> | null = null

function shareLog(message: string, context?: Record<string, unknown>) {
  logger.info(`[share-prompt] ${message}`, context)
}

function readInstall(): InstallRecord | null {
  const parsed = safeJsonParse(safeLocalStorage?.getItem(INSTALL_KEY) ?? null)
  if (!parsed || typeof parsed !== 'object') return null
  const record = parsed as InstallRecord
  return typeof record.sessions === 'number' ? record : null
}

function writeInstall(record: InstallRecord) {
  safeLocalStorage?.setItem(INSTALL_KEY, JSON.stringify(record))
}

function countSession() {
  if (sessionCounted) return
  sessionCounted = true
  if (safeSessionStorage?.getItem(SESSION_KEY)) return
  safeSessionStorage?.setItem(SESSION_KEY, '1')

  const existing = readInstall()
  writeInstall(existing ? {...existing, sessions: existing.sessions + 1} : {sessions: 1})
}

function sharePlatform(): SharePlatform {
  return isNativeApp() ? nativePlatform() : 'web'
}

function calmBlocker(): string | null {
  if (typeof document === 'undefined') return 'no-document'
  if (inConversation) return 'in-conversation'
  if (document.visibilityState !== 'visible') return `visibility:${document.visibilityState}`
  if (document.body.classList.contains('keyboard-open')) return 'keyboard-open'
  if (document.querySelector('[role="dialog"]')) return 'dialog-open'
  return null
}

// The dialog's open state, shared between the imperative ask below and `<SharePrompts/>`.
let dialogOpen = false
const listeners = new Set<() => void>()

export function setShareDialogOpen(open: boolean) {
  dialogOpen = open
  listeners.forEach((listener) => listener())
}

export function useShareDialogOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => dialogOpen,
    () => false,
  )
}

/**
 * Ask the server whether this moment has earned the video, and open it if so. Safe to call from
 * anywhere: a signed-out visitor, an early session or a busy screen never reaches the network.
 */
export async function requestSharePrompt(moment: ShareMoment, delayMs = 0) {
  if (!SHARE_VIDEO_AVAILABLE) return
  const platform = sharePlatform()
  const wait = delayMs + (platform === 'web' ? 0 : REVIEW_HEADSTART_MS)
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))

  if (askedThisSession) {
    shareLog('stopped: a moment already claimed this session', {moment})
    return
  }
  const otherPrompt = promptShownThisSession()
  if (otherPrompt) {
    shareLog('stopped: another prompt was shown this session', {moment, otherPrompt})
    return
  }
  const blocker = calmBlocker()
  if (blocker) {
    shareLog('stopped: not a calm moment', {moment, blocker})
    return
  }
  const install = readInstall()
  if (!install || !isShareInstallEligible(install.sessions)) {
    shareLog('stopped: install not eligible yet', {moment, sessions: install?.sessions})
    return
  }

  // Claim the slot before awaiting, so two moments firing together can't both pass.
  askedThisSession = true
  if (moment === 'quiet') writeInstall({...install, quietAsked: true})

  try {
    const {trigger} = await api('request-share-prompt', {moment, platform})
    if (!trigger) {
      shareLog('server declined', {moment, platform})
      return
    }
    markPromptShown('share')
    track('share prompt shown', {trigger, platform})
    setShareDialogOpen(true)
  } catch (e) {
    debug('Share prompt failed', e)
  }
}

/** The conversation page's side: leaving a thread with a reply in it is the moment. */
export function useSharePromptOnConversationExit(sawReply: boolean) {
  const sawReplyRef = useRef(sawReply)
  sawReplyRef.current = sawReply

  useEffect(() => {
    inConversation = true
    return () => {
      inConversation = false
      if (!sawReplyRef.current) return
      if (pendingAsk) clearTimeout(pendingAsk)
      // Not owned by the effect: the unmount is the event being waited out, so it must outlive it.
      pendingAsk = setTimeout(() => {
        pendingAsk = null
        void requestSharePrompt('conversation-exit')
      }, EXIT_SETTLE_MS)
    }
  }, [])
}

/** Counts the session and takes the one quiet catch-up this install gets. Mounted once. */
export function useQuietSharePrompt() {
  const user = useUser()

  useEffect(() => {
    countSession()
  }, [])

  useEffect(() => {
    if (!user?.id || !SHARE_VIDEO_AVAILABLE) return
    if (readInstall()?.quietAsked) return
    const timeout = setTimeout(() => requestSharePrompt('quiet'), QUIET_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [user?.id])
}
