import {MouseEvent, PointerEvent, useRef} from 'react'

/**
 * Tap-outside-to-close for the modals, wired by hand rather than left to Headless UI.
 *
 * Headless UI's Dialog does have its own outside-click detection, and on touch it is not dependable:
 * its pointer path opts out on mobile entirely, and the touch fallback it drops to ignores any
 * gesture that travelled more than ~30px — which a tap on a full-screen scrollable overlay very often
 * has, because the finger rolls. The symptom is a modal on a phone that cannot be dismissed by
 * tapping the blurred backdrop at all; the X is the only way out.
 *
 * Hanging a handler on the backdrop element instead would not help: the blurred `fixed inset-0` cover
 * is painted *behind* the container that holds the panel, so a tap on what looks like "the blurry
 * part" never actually lands on it. The overlay container is the element under the finger, so that is
 * what this attaches to — anything landing outside the panel counts as a dismissal.
 *
 * Spread `overlayProps` on the full-screen container and put `panelRef` on the panel:
 *
 *   const {panelRef, overlayProps} = useOutsideDismiss(setOpen && (() => setOpen(false)))
 *   <div className="fixed inset-0 ..." {...overlayProps}>
 *     <Dialog.Panel ref={panelRef}>{children}</Dialog.Panel>
 */
export const useOutsideDismiss = (onDismiss?: () => void) => {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const startedOutside = useRef(false)

  const isOutside = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el || panelRef.current?.contains(el)) return false
    // React portals bubble along the React tree, not the DOM one, so a dropdown or tooltip the modal
    // rendered out to document.body still reaches this handler. Those are not outside the modal.
    return !el.closest?.('[data-headlessui-portal]')
  }

  return {
    panelRef,
    overlayProps: {
      onPointerDown: (e: PointerEvent) => {
        startedOutside.current = isOutside(e.target)
      },
      onClick: (e: MouseEvent) => {
        // A gesture that began inside the panel — dragging a slider, selecting text, swiping a
        // carousel — must not dismiss just because the finger happened to lift outside it.
        if (!startedOutside.current) return
        if (!isOutside(e.target)) return
        onDismiss?.()
      },
    },
  }
}
