import {useEffect, useRef, useState} from 'react'

/** How long a touch has to stay down before it reveals the hidden actions. */
export const LONG_PRESS_MS = 400

/** A press that drifts further than this is a scroll, not a hold. */
const MOVE_TOLERANCE_PX = 10

/**
 * Reveals actions that are otherwise hidden behind hover, for devices that have no hover: a press
 * and hold uncovers them, and the next press anywhere else puts them away again.
 *
 * The caller owns the markup — attach `containerRef` to the element that should count as "inside"
 * for the dismiss-on-outside-press, spread `handlers` onto it, and drive the actions' visibility
 * from `revealed`. Consumers with their own pointer logic (press feedback, navigation) can call
 * `start` / `move` / `cancel` from inside their own handlers instead of spreading `handlers`.
 */
export function useLongPressReveal<T extends HTMLElement = HTMLElement>() {
  const containerRef = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startRef = useRef<{x: number; y: number} | null>(null)
  /** Set once the hold fires, so the release that follows opens the actions instead of the link. */
  const longPressedRef = useRef(false)

  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Any press outside puts them away again — including a press on a sibling, which reveals its own.
  useEffect(() => {
    if (!revealed) return
    const onDocumentPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setRevealed(false)
    }
    document.addEventListener('pointerdown', onDocumentPointerDown)
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown)
  }, [revealed])

  useEffect(() => cancel, [])

  const start = (e: React.PointerEvent) => {
    longPressedRef.current = false
    // Mouse users get the actions on hover, so holding the button down shouldn't hijack their click.
    if (e.pointerType === 'mouse') return
    // A press that lands on one of the revealed actions is that action's, not a fresh hold.
    const target = e.target as HTMLElement | null
    if (!target || target.closest('button, [role="button"]')) return

    startRef.current = {x: e.clientX, y: e.clientY}
    cancel()
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      longPressedRef.current = true
      setRevealed(true)
    }, LONG_PRESS_MS)
  }

  const move = (e: React.PointerEvent) => {
    const start = startRef.current
    if (!start || !timeoutRef.current) return
    if (
      Math.abs(e.clientX - start.x) > MOVE_TOLERANCE_PX ||
      Math.abs(e.clientY - start.y) > MOVE_TOLERANCE_PX
    )
      cancel()
  }

  // Browsers still fire a click after the hold, which would act on whatever sits under the finger.
  const onClick = (e: React.MouseEvent) => {
    if (longPressedRef.current) {
      e.preventDefault()
      longPressedRef.current = false
    }
  }

  // The hold would otherwise also pop the browser's own menu on top of the actions. Only suppressed
  // for a touch hold — right-click ("open in new tab") stays intact.
  const onContextMenu = (e: React.MouseEvent) => {
    if (longPressedRef.current) e.preventDefault()
  }

  return {
    containerRef,
    revealed,
    setRevealed,
    /** True between the hold firing and the click it produces — check before acting on that click. */
    longPressedRef,
    start,
    move,
    cancel,
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onClick,
      onContextMenu,
    },
  }
}
