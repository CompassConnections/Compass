import {Dialog, Transition} from '@headlessui/react'
import {ChevronLeftIcon, ChevronRightIcon, XMarkIcon} from '@heroicons/react/24/outline'
import Image from 'next/image'
import {
  Fragment,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import {useEvent} from 'web/hooks/use-event'
import {isVideo} from 'web/lib/firebase/storage'
import {useT} from 'web/lib/locale'

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5
const DOUBLE_TAP_MAX_DELAY_MS = 300
const DOUBLE_TAP_MAX_DIST_PX = 30
const ZOOM_ANIMATION_MS = 200

type Point = {x: number; y: number}

const SWIPE_MIN_DIST_PX = 50
const SWIPE_MAX_OFF_AXIS_RATIO = 0.8

// Enlarges an image or video to the largest size that fits within 90% of the
// viewport in both dimensions, without cropping (aspect ratio preserved).
//
// Pass `url` for a single item, or `urls` + `index` to browse a gallery in place: arrow keys, the
// on-screen chevrons, and a horizontal swipe all move between items. Swiping is ignored while the
// image is zoomed in, where the same gesture pans.
export function MediaModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  /** Single-item form. */
  url?: string
  /** Gallery form — supply every item plus the one currently shown. */
  urls?: string[]
  index?: number
  setIndex?: (index: number) => void
  /** Caption rendered under the media, keyed by url. */
  descriptions?: Record<string, string>
}) {
  const {open, setOpen, urls, index, setIndex, descriptions} = props
  const t = useT()

  const items = urls?.length ? urls : props.url ? [props.url] : []
  const [internalIndex, setInternalIndex] = useState(index ?? 0)

  // The caller may or may not own the index; follow it when it does, and keep our own when it doesn't.
  useEffect(() => {
    if (index != null) setInternalIndex(index)
  }, [index])

  const current = items[clamp(internalIndex, 0, Math.max(0, items.length - 1))]
  const hasMultiple = items.length > 1
  const caption = current ? descriptions?.[current] : undefined

  const go = useEvent((delta: number) => {
    if (!hasMultiple) return
    const next = (internalIndex + delta + items.length) % items.length
    setInternalIndex(next)
    setIndex?.(next)
  })

  useEffect(() => {
    if (!open || !hasMultiple) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, hasMultiple, go])

  if (!current) return null

  const url = current

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog className="relative z-50" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-linear duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-linear duration-75"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* background cover */}
          <div className="bg-canvas-100/75 fixed inset-0" />
        </Transition.Child>

        {/* close button, fixed so it stays visible whatever the media size */}
        <button
          onClick={() => setOpen(false)}
          className="text-ink-700 hover:text-primary-400 focus:text-primary-400 fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 cursor-pointer outline-none"
        >
          <XMarkIcon className="h-8 w-8" />
          <div className="sr-only">Close</div>
        </button>

        <div className="fixed inset-0 flex items-center justify-center p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            {/* A column, not a centred box: the caption needs its own row under the media, and the
                media area has to be allowed to shrink (`min-h-0`) so a long caption cannot push it
                past the bottom of the screen. */}
            <Dialog.Panel className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-4 pb-6 pt-16 sm:px-16">
              {/* Inside the panel, not beside it: Headless UI closes the dialog on any click that
                  lands outside the panel's subtree, which is what made paging dismiss the viewer.
                  They are `fixed`, so they still sit against the viewport edges. */}
              {hasMultiple && (
                <>
                  <NavButton
                    side="left"
                    label={t('media.previous', 'Previous')}
                    onClick={() => go(-1)}
                  />
                  <NavButton side="right" label={t('media.next', 'Next')} onClick={() => go(1)} />
                </>
              )}

              <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
                {isVideo(url) ? (
                  <video
                    src={url}
                    controls
                    autoPlay
                    playsInline
                    className="h-auto max-h-full w-auto max-w-full rounded object-contain"
                  />
                ) : (
                  <ZoomableImage
                    url={url}
                    active={open}
                    onSwipe={hasMultiple ? (direction) => go(direction) : undefined}
                  />
                )}
              </div>

              {(caption || hasMultiple) && (
                <div className="flex w-full shrink-0 flex-col items-center gap-1.5">
                  {caption && (
                    <p className="text-ink-800 max-w-2xl whitespace-pre-wrap text-center text-sm">
                      {caption}
                    </p>
                  )}
                  {hasMultiple && (
                    <div className="text-ink-500 text-xs tabular-nums">
                      {internalIndex + 1} / {items.length}
                    </div>
                  )}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

function NavButton(props: {side: 'left' | 'right'; label: string; onClick: () => void}) {
  const {side, label, onClick} = props
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`text-ink-700 hover:text-primary-400 focus:text-primary-400 bg-canvas-50/70 fixed top-1/2 z-10 -translate-y-1/2 rounded-full p-2 outline-none backdrop-blur transition-colors ${
        side === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'
      }`}
    >
      {side === 'left' ? (
        <ChevronLeftIcon className="h-6 w-6" />
      ) : (
        <ChevronRightIcon className="h-6 w-6" />
      )}
    </button>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Point, b: Point): Point {
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}
}

// Keeps `point` (a page coordinate, e.g. the cursor or pinch midpoint) visually
// fixed while the image scales from `fromScale` to `toScale` around `center`.
function anchoredTranslate(
  point: Point,
  center: Point,
  translate: Point,
  fromScale: number,
  toScale: number,
): Point {
  const vx = (point.x - center.x - translate.x) / fromScale
  const vy = (point.y - center.y - translate.y) / fromScale
  return {x: point.x - center.x - toScale * vx, y: point.y - center.y - toScale * vy}
}

// Pinch-to-zoom (mobile), scroll-to-zoom + drag-to-pan (desktop), and
// double-tap/double-click-to-zoom, all anchored under the cursor/fingers —
// the same interactions as WhatsApp's photo viewer.
function ZoomableImage(props: {
  url: string
  active: boolean
  /** Called with -1 (previous) or 1 (next) on a horizontal swipe, when not zoomed in. */
  onSwipe?: (direction: number) => void
}) {
  const {url, active, onSwipe} = props
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState<Point>({x: 0, y: 0})
  const [isAnimating, setIsAnimating] = useState(false)

  const pointers = useRef(new Map<number, Point>())
  const pinchDistance = useRef<number | null>(null)
  const dragStart = useRef<{pointer: Point; translate: Point} | null>(null)
  const lastTap = useRef<{time: number; point: Point} | null>(null)

  // Reset zoom whenever a new image is shown or the modal opens/closes.
  useEffect(() => {
    setScale(1)
    setTranslate({x: 0, y: 0})
    pointers.current.clear()
    pinchDistance.current = null
    dragStart.current = null
    lastTap.current = null
  }, [url, active])

  const clampTranslate = (s: number, t: Point): Point => {
    const img = imageRef.current
    if (!img || s <= 1) return {x: 0, y: 0}
    const maxX = (img.offsetWidth * (s - 1)) / 2
    const maxY = (img.offsetHeight * (s - 1)) / 2
    return {x: clamp(t.x, -maxX, maxX), y: clamp(t.y, -maxY, maxY)}
  }

  const zoomAt = (point: Point, toScale: number, animate = false) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const center = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
    const nextScale = clamp(toScale, MIN_SCALE, MAX_SCALE)
    const nextTranslate = clampTranslate(
      nextScale,
      anchoredTranslate(point, center, translate, scale, nextScale),
    )
    setScale(nextScale)
    setTranslate(nextTranslate)
    if (animate) {
      setIsAnimating(true)
      window.setTimeout(() => setIsAnimating(false), ZOOM_ANIMATION_MS)
    }
  }

  const toggleZoom = (point: Point) => {
    zoomAt(point, scale > 1 ? 1 : DOUBLE_TAP_SCALE, true)
  }

  const onWheel = (e: ReactWheelEvent) => {
    e.preventDefault()
    zoomAt({x: e.clientX, y: e.clientY}, scale * Math.exp(-e.deltaY * 0.002))
  }

  const onDoubleClick = (e: ReactMouseEvent) => {
    toggleZoom({x: e.clientX, y: e.clientY})
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY})

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      pinchDistance.current = distance(a, b)
      dragStart.current = null
    } else if (pointers.current.size === 1) {
      dragStart.current = {pointer: {x: e.clientX, y: e.clientY}, translate}

      if (e.pointerType === 'touch') {
        const now = Date.now()
        const point = {x: e.clientX, y: e.clientY}
        if (
          lastTap.current &&
          now - lastTap.current.time < DOUBLE_TAP_MAX_DELAY_MS &&
          distance(lastTap.current.point, point) < DOUBLE_TAP_MAX_DIST_PX
        ) {
          toggleZoom(point)
          lastTap.current = null
        } else {
          lastTap.current = {time: now, point}
        }
      }
    }
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY})

    if (pointers.current.size === 2 && pinchDistance.current) {
      const [a, b] = Array.from(pointers.current.values())
      const newDistance = distance(a, b)
      zoomAt(midpoint(a, b), scale * (newDistance / pinchDistance.current))
      pinchDistance.current = newDistance
    } else if (pointers.current.size === 1 && dragStart.current && scale > 1) {
      const {pointer, translate: startTranslate} = dragStart.current
      setTranslate(
        clampTranslate(scale, {
          x: startTranslate.x + (e.clientX - pointer.x),
          y: startTranslate.y + (e.clientY - pointer.y),
        }),
      )
    }
  }

  const endPointer = (e: ReactPointerEvent) => {
    // Only a lone pointer at rest scale is a swipe — at scale > 1 the same drag is a pan, and with two
    // pointers down it is a pinch.
    if (onSwipe && scale === 1 && pointers.current.size === 1 && dragStart.current) {
      const dx = e.clientX - dragStart.current.pointer.x
      const dy = e.clientY - dragStart.current.pointer.y
      if (
        Math.abs(dx) > SWIPE_MIN_DIST_PX &&
        Math.abs(dy) < Math.abs(dx) * SWIPE_MAX_OFF_AXIS_RATIO
      ) {
        onSwipe(dx < 0 ? 1 : -1)
      }
    }

    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchDistance.current = null

    if (pointers.current.size === 1) {
      const [remaining] = Array.from(pointers.current.values())
      dragStart.current = {pointer: remaining, translate}
    } else if (pointers.current.size === 0) {
      dragStart.current = null
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{touchAction: 'none'}}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={endPointer}
    >
      <Image
        ref={imageRef}
        src={url}
        width={2000}
        height={2000}
        alt=""
        draggable={false}
        className={`block h-auto max-h-full w-auto max-w-full select-none rounded object-contain ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: isAnimating ? `transform ${ZOOM_ANIMATION_MS}ms ease-out` : 'none',
        }}
      />
    </div>
  )
}
