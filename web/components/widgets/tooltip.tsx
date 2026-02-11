import {
  arrow,
  autoUpdate,
  flip,
  offset,
  Placement,
  safePolygon,
  shift,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import {Transition} from '@headlessui/react'
import {ReactNode, useEffect, useRef, useState} from 'react'

// See https://floating-ui.com/docs/react-dom

export function Tooltip(props: {
  text: string | false | undefined | null | ReactNode
  children: ReactNode
  className?: string
  placement?: Placement
  noTap?: boolean
  noFade?: boolean
  hasSafePolygon?: boolean
  suppressHydrationWarning?: boolean
}) {
  const {
    text,
    children,
    className,
    noTap,
    noFade,
    hasSafePolygon,
    suppressHydrationWarning,
  } = props

  const arrowRef = useRef(null)

  const [open, setOpen] = useState(false)

  // --- Mobile tap suppression to prevent accidental neighbor tooltips ---
  // After a tap/click on touch devices, browsers may emit hover/focus events on elements
  // that appear under the finger due to layout shifts (e.g., when a card is removed).
  // We keep a short global cooldown window during which tooltip "open" requests are ignored.
  // This helps avoid ghost tooltips appearing on adjacent cards after actions like hide/remove.
  const nowFn = () => Date.now()
  // Module-level shared state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = (globalThis as any)
  if (g.__tooltipLastTapTs === undefined) g.__tooltipLastTapTs = 0 as number
  if (g.__tooltipListenersSetup === undefined) g.__tooltipListenersSetup = false as boolean

  useEffect(() => {
    if (g.__tooltipListenersSetup) return
    if (typeof window === 'undefined') return
    const markTap = () => {
      g.__tooltipLastTapTs = nowFn()
    }
    // Mark taps/pointerdowns (especially touch) globally
    window.addEventListener('touchstart', markTap, {passive: true})
    window.addEventListener('pointerdown', markTap, {passive: true})
    // Fallback for some browsers
    window.addEventListener('mousedown', markTap, {passive: true})
    g.__tooltipListenersSetup = true
    return () => {
      // We intentionally do not remove listeners to avoid duplicating across many instances.
      // If component unmounts entirely (hot reload), listeners will be garbage-collected with the page.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    x,
    y,
    reference,
    floating,
    strategy,
    middlewareData,
    context,
    placement,
  } = useFloating({
    open: open,
    onOpenChange: (next) => {
      if (next) {
        const dt = nowFn() - g.__tooltipLastTapTs
        // Ignore open requests shortly after a tap/click (mobile gesture)
        if (dt >= 0 && dt < 400) return
      }
      setOpen(next)
    },
    whileElementsMounted: autoUpdate,
    placement: props.placement ?? 'top',
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 4 }),
      arrow({ element: arrowRef }),
    ],
  })

  const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {}

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, {
      mouseOnly: noTap,
      handleClose: hasSafePolygon ? safePolygon({ buffer: -0.5 }) : null,
    }),
    useRole(context, { role: 'tooltip' }),
  ])
  // which side of tooltip arrow is on. like: if tooltip is top-left, arrow is on bottom of tooltip
  const arrowSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[placement.split('-')[0]] as string

  return text ? (
    <>
      <span
        suppressHydrationWarning={suppressHydrationWarning}
        className={className}
        ref={reference}
        {...getReferenceProps()}
      >
        {children}
      </span>
      {/* conditionally render tooltip and fade in/out */}
      <Transition
        show={open}
        enter="transition ease-out duration-50"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave={noFade ? '' : 'transition ease-in duration-150'}
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        // div attributes
        role="tooltip"
        ref={floating}
        style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
        className="text-ink-1000 bg-canvas-50 z-20 w-max max-w-xs whitespace-normal rounded px-2 py-1 text-center text-sm font-medium"
        suppressHydrationWarning={suppressHydrationWarning}
        {...getFloatingProps()}
      >
        {text}
        <div
          ref={arrowRef}
          className="bg-canvas-50 absolute h-2 w-2 rotate-45"
          style={{
            top: arrowY != null ? arrowY : '',
            left: arrowX != null ? arrowX : '',
            right: '',
            bottom: '',
            [arrowSide]: '-4px',
          }}
        />
      </Transition>
    </>
  ) : (
    <>{children}</>
  )
}
