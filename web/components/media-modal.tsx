import {Dialog, Transition} from '@headlessui/react'
import {ChevronLeftIcon, ChevronRightIcon, XMarkIcon} from '@heroicons/react/24/outline'
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

// A drag only becomes a swipe once it has travelled this far, and mostly sideways — a tap or a
// vertical drag never moves the strip.
const SWIPE_LOCK_DIST_PX = 8
// Released past this share of the strip's width, the swipe moves on to the neighbour…
const SWIPE_COMMIT_RATIO = 0.2
// …and so does a short, fast flick.
const SWIPE_FLICK_MIN_DIST_PX = 30
const SWIPE_FLICK_MIN_VELOCITY_PX_PER_MS = 0.5
// Dragging past the first or last item follows the finger at this fraction, then springs back.
const SWIPE_EDGE_RESISTANCE = 0.3
const SLIDE_ANIMATION_MS = 250
// Items this close to the one on screen are mounted, so their media is already downloaded when they
// slide in. Further ones are empty placeholders that only hold their place in the strip.
const PRELOAD_RADIUS = 2
// Native video controls sit along the bottom edge; a drag starting there is a scrub, not a swipe.
const VIDEO_CONTROLS_HEIGHT_PX = 56

// Enlarges an image or video to the largest size that fits within 90% of the
// viewport in both dimensions, without cropping (aspect ratio preserved).
//
// Pass `url` for a single item, or `urls` + `index` to browse a gallery in place: arrow keys, the
// on-screen chevrons, and a horizontal swipe all move between items. Swiping is ignored while the
// image is zoomed in, where the same gesture pans.
//
// The gallery is one horizontal strip of full-width slides that follows the finger and settles on
// the nearest item on release, so the outgoing and incoming media travel together edge to edge.
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

  // Horizontal offset of the strip while a finger is dragging it, in px.
  const [dragX, setDragX] = useState(0)
  // Whether the strip's next move is animated: yes when settling after a swipe or paging to a
  // neighbour, no while it tracks the finger or jumps (opening on a photo, wrapping around).
  const [animate, setAnimate] = useState(false)

  // The caller may or may not own the index; follow it when it does, and keep our own when it doesn't.
  // Done during render rather than in an effect so that a jump from outside (the viewer opening on
  // another photo) lands without animation, while our own paging — which reports the same index back
  // through `setIndex` — keeps its slide.
  const [syncedIndex, setSyncedIndex] = useState(index)
  if (index !== syncedIndex) {
    setSyncedIndex(index)
    if (index != null && index !== internalIndex) {
      setInternalIndex(index)
      setAnimate(false)
    }
  }

  const shown = clamp(internalIndex, 0, Math.max(0, items.length - 1))
  const current = items[shown]
  const hasMultiple = items.length > 1
  const caption = current ? descriptions?.[current] : undefined

  const trackRef = useRef<HTMLDivElement>(null)
  const activePointers = useRef(new Set<number>())
  const swipe = useRef<{
    id: number
    x: number
    y: number
    time: number
    locked: boolean
  } | null>(null)
  const zoomed = useRef(false)
  const onZoomedChange = useEvent((isZoomed: boolean) => {
    zoomed.current = isZoomed
  })

  const go = useEvent((delta: number) => {
    if (!hasMultiple) return
    const next = (shown + delta + items.length) % items.length
    // Neighbours slide into place; wrapping from one end to the other jumps, rather than racing
    // back across every item in between.
    setAnimate(Math.abs(next - shown) === 1)
    setDragX(0)
    setInternalIndex(next)
    setIndex?.(next)
  })

  // The strip is unmounted while closed, so a gesture in flight never gets its pointerup.
  useEffect(() => {
    if (open) return
    activePointers.current.clear()
    swipe.current = null
    zoomed.current = false
    setDragX(0)
    setAnimate(false)
  }, [open])

  const cancelSwipe = () => {
    if (swipe.current?.locked) {
      setAnimate(true)
      setDragX(0)
    }
    swipe.current = null
  }

  const onTrackPointerDown = (e: ReactPointerEvent) => {
    activePointers.current.add(e.pointerId)
    // A second finger makes it a pinch, which belongs to the image.
    if (activePointers.current.size > 1) return cancelSwipe()
    if (!hasMultiple || zoomed.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = e.target
    if (
      target instanceof HTMLVideoElement &&
      e.clientY > target.getBoundingClientRect().bottom - VIDEO_CONTROLS_HEIGHT_PX
    )
      return
    swipe.current = {id: e.pointerId, x: e.clientX, y: e.clientY, time: e.timeStamp, locked: false}
  }

  const onTrackPointerMove = (e: ReactPointerEvent) => {
    const s = swipe.current
    if (!s || s.id !== e.pointerId) return
    // Only a lone pointer at rest scale is a swipe — at scale > 1 the same drag is a pan, and with two
    // pointers down it is a pinch.
    if (zoomed.current) return cancelSwipe()
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.locked) {
      if (Math.hypot(dx, dy) < SWIPE_LOCK_DIST_PX) return
      if (Math.abs(dy) > Math.abs(dx)) {
        swipe.current = null
        return
      }
      s.locked = true
      setAnimate(false)
    }
    // Swiping does not wrap: there is nothing beside the first and last items to drag into view.
    const atEdge = (shown === 0 && dx > 0) || (shown === items.length - 1 && dx < 0)
    setDragX(atEdge ? dx * SWIPE_EDGE_RESISTANCE : dx)
  }

  const onTrackPointerEnd = (e: ReactPointerEvent) => {
    activePointers.current.delete(e.pointerId)
    const s = swipe.current
    if (!s || s.id !== e.pointerId) return
    swipe.current = null
    if (!s.locked) return

    const dx = e.clientX - s.x
    const width = trackRef.current?.offsetWidth || window.innerWidth
    const velocity = Math.abs(dx) / Math.max(1, e.timeStamp - s.time)
    const committed =
      e.type !== 'pointercancel' &&
      (Math.abs(dx) > width * SWIPE_COMMIT_RATIO ||
        (Math.abs(dx) > SWIPE_FLICK_MIN_DIST_PX && velocity > SWIPE_FLICK_MIN_VELOCITY_PX_PER_MS))
    const delta = dx < 0 ? 1 : -1
    const target = shown + delta

    setAnimate(true)
    setDragX(0)
    if (committed && target >= 0 && target < items.length) go(delta)
  }

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
          className="text-ink-700 hover:text-primary-700 focus:text-primary-700 fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 cursor-pointer outline-none"
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
            <Dialog.Panel className="relative flex h-full w-full flex-col items-center justify-center gap-4 pb-6 pt-16">
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

              {/* The viewport of the strip. It spans the full panel width — the side padding lives on
                  the slides (desktop only) and the caption — so on a phone a photo leaves by one
                  screen edge exactly as the next arrives at the other. */}
              <div
                className="relative min-h-0 w-full flex-1 overflow-hidden"
                style={{touchAction: 'none'}}
                onPointerDown={onTrackPointerDown}
                onPointerMove={onTrackPointerMove}
                onPointerUp={onTrackPointerEnd}
                onPointerCancel={onTrackPointerEnd}
                onPointerLeave={onTrackPointerEnd}
              >
                <div
                  ref={trackRef}
                  className="flex h-full w-full will-change-transform"
                  style={{
                    transform: `translate3d(calc(${-shown * 100}% + ${dragX}px), 0, 0)`,
                    transition: animate ? `transform ${SLIDE_ANIMATION_MS}ms ease-out` : 'none',
                  }}
                >
                  {items.map((url, i) => (
                    <div
                      key={url}
                      aria-hidden={i !== shown}
                      className="flex h-full w-full shrink-0 items-center justify-center sm:px-16"
                    >
                      {Math.abs(i - shown) > PRELOAD_RADIUS ? null : isVideo(url) ? (
                        <SlideVideo url={url} active={open && i === shown} />
                      ) : (
                        <ZoomableImage
                          url={url}
                          active={open && i === shown}
                          onZoomedChange={i === shown ? onZoomedChange : undefined}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(caption || hasMultiple) && (
                <div className="flex w-full shrink-0 flex-col items-center gap-1.5 px-4 sm:px-16">
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
      className={`text-ink-700 hover:text-primary-700 focus:text-primary-700 bg-canvas-50/70 fixed top-1/2 z-10 -translate-y-1/2 rounded-full p-2 outline-none backdrop-blur transition-colors ${
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

// Mounted for the neighbours too, so it only plays while it is the slide on screen.
function SlideVideo(props: {url: string; active: boolean}) {
  const {url, active} = props
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (active) {
      // Rejects when the browser blocks autoplay; the controls are right there.
      video.play()?.catch(() => {})
    } else {
      video.pause()
    }
  }, [active])

  return (
    <video
      ref={ref}
      src={url}
      controls
      playsInline
      preload="metadata"
      className="h-auto max-h-full w-auto max-w-full rounded object-contain"
    />
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
  /** Reports whether the image is zoomed in — the gallery swipes only when it is not. */
  onZoomedChange?: (zoomed: boolean) => void
}) {
  const {url, active, onZoomedChange} = props
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

  const isZoomed = scale > 1
  useEffect(() => {
    onZoomedChange?.(isZoomed)
  }, [isZoomed, onZoomedChange])

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
      {/* A plain <img>, not next/image: the viewer shows one image at natural size inside a
          CSS-sized box, so the optimizer buys nothing here — and it refuses any host missing from
          `remotePatterns` in next.config.ts with a 400, which broke every image a profile imported
          from an external page. The inline renderer (components/editor/image.tsx) uses <img> for
          the same reason. */}
      <img
        ref={imageRef}
        src={url}
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
