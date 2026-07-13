import {
  arrow,
  autoUpdate,
  flip,
  offset,
  Placement,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import {Transition} from '@headlessui/react'
import {ReactNode, useRef, useState} from 'react'

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

  const {x, y, refs, strategy, context} = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: props.placement ?? 'top',
    middleware: [offset(8), flip(), shift({padding: 4}), arrow({element: arrowRef})],
  })

  const {getReferenceProps, getFloatingProps} = useInteractions([
    // Hover is a mouse-only concept; touch devices open via useClick below.
    useHover(context, {
      mouseOnly: true,
      handleClose: hasSafePolygon ? safePolygon({buffer: -0.5}) : null,
    }),
    // Tap/click toggles the tooltip (persists on touch) unless tapping is disabled.
    useClick(context, {enabled: !noTap}),
    // Tapping/clicking outside dismisses it, including on touch devices.
    useDismiss(context),
    useRole(context, {role: 'tooltip'}),
  ])

  return text ? (
    <>
      <span
        data-testid={testId}
        suppressHydrationWarning={suppressHydrationWarning}
        className={className}
        ref={refs.setReference as any}
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
        className="text-ink-1000 bg-primary-100 z-20 w-max max-w-xs whitespace-normal rounded-lg px-2 py-1 text-center text-sm font-medium border border-primary-300 shadow shadow-canvas-100"
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
