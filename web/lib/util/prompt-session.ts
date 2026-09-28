/**
 * One prompt per session, across every kind of prompt we show: the store review card
 * (`web/hooks/use-review-prompt.ts`) and the share-or-donate video (`web/hooks/use-share-prompt.ts`).
 *
 * Module-level, like each hook's own per-session flag, because "this session" is exactly the lifetime
 * of this module. Only a prompt actually shown claims it — a server that said no leaves it free.
 */
export type SessionPromptKind = 'review' | 'share'

let shown: SessionPromptKind | null = null

export function promptShownThisSession() {
  return shown
}

export function markPromptShown(kind: SessionPromptKind) {
  shown = kind
}
