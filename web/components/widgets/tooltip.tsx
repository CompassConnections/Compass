import {
  arrow,
  autoUpdate,
  flip,
  offset,
  Placement,
  safePolygon,
  shift,
  useClick,
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
  testId?: string
}) {
  const {
    text,
    children,
    className,
    noTap,
    noFade,
    hasSafePolygon,
    suppressHydrationWarning,
    testId,
  } = props

  const arrowRef = useRef(null)
  const [open, setOpen] = useState(false)
  const touchOpenRef = useRef(false) // tracks whether open was triggered by touch

  const {x, y, refs, strategy, context} = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: props.placement ?? 'top',
    middleware: [offset(8), flip(), shift({padding: 4}), arrow({element: arrowRef})],
  })

  // Close tooltip when tapping outside on touch devices
  useEffect(() => {
    if (!open || !touchOpenRef.current) return

    const handleOutsideTouch = (e: TouchEvent) => {
      const ref = refs.reference.current as Element | null
      const floating = refs.floating.current as Element | null
      if (
        ref &&
        !ref.contains(e.target as Node) &&
        floating &&
        !floating.contains(e.target as Node)
      ) {
        setOpen(false)
        touchOpenRef.current = false
      }
    }

    document.addEventListener('touchstart', handleOutsideTouch, {passive: true})
    return () => document.removeEventListener('touchstart', handleOutsideTouch)
  }, [open, refs.reference, refs.floating])

  const {getReferenceProps, getFloatingProps} = useInteractions([
    useHover(context, {
      // Allow hover on all devices; touch devices will also use onTouchStart below
      mouseOnly: noTap,
      handleClose: hasSafePolygon ? safePolygon({buffer: -0.5}) : null,
    }),
    useClick(context),
    useRole(context, {role: 'tooltip'}),
  ])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (noTap) return
    e.stopPropagation()
    const next = !open
    touchOpenRef.current = next
    setOpen(next)
  }

  return text ? (
    <>
      <span
        data-testid={testId}
        suppressHydrationWarning={suppressHydrationWarning}
        className={className}
        ref={refs.setReference as any}
        onMouseEnter={() => {
          touchOpenRef.current = false
          setOpen(true)
        }}
        onMouseLeave={() => {
          if (!touchOpenRef.current) setOpen(false)
        }}
        onTouchStart={handleTouchStart}
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
        as="div"
        ref={refs.setFloating as any}
        style={{position: strategy, top: y ?? 0, left: x ?? 0}}
        className="text-ink-1000 bg-canvas-50 z-20 w-max max-w-xs whitespace-normal rounded-lg px-2 py-1 text-center text-sm font-medium border border-canvas-100 shadow shadow-canvas-100"
        suppressHydrationWarning={suppressHydrationWarning}
        {...getFloatingProps()}
      >
        <div role="tooltip">{text}</div>
      </Transition>
    </>
  ) : (
    <>{children}</>
  )
}
