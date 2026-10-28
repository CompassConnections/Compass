import {type JSONContent} from '@tiptap/core'
import {useSyncExternalStore} from 'react'

/**
 * First messages the sender has sent but the API has not yet accepted.
 *
 * A first message goes through the deterministic checks and a model review before it is stored,
 * and the review takes a few seconds. Rather than make the sender wait on the send button, the
 * composer records the message here, moves to the conversation at once, and lets the API call finish
 * behind it: the conversation page draws the pending message in the sender's own bubble, then either
 * swaps it for the stored one or shows why it was refused. The recipient sees nothing until the
 * API has accepted it — see `backend/api/src/helpers/first-message.ts`.
 *
 * Its own store rather than `usePersistentInMemoryState` because the composer that starts the send
 * is unmounted by the time the API answers, and that hook's writes go through a component's state
 * setter; this one needs a write from nowhere in particular to reach whichever page is showing the
 * conversation.
 */
export type PendingOpener = {
  content: JSONContent
  status: 'checking' | 'sent' | 'rejected'
  /** The API's explanation, when refused. */
  reason?: string
  /** The refusal put the account on hold; there is nothing to edit and resend. */
  hold?: boolean
}

const store = new Map<number, PendingOpener>()
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

export function setPendingOpener(channelId: number, pending: PendingOpener) {
  store.set(channelId, pending)
  emit()
}

export function clearPendingOpener(channelId: number) {
  store.delete(channelId)
  emit()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePendingOpener(channelId: number): PendingOpener | undefined {
  return useSyncExternalStore(
    subscribe,
    () => store.get(channelId),
    () => undefined,
  )
}
