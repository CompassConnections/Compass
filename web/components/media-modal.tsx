import {Dialog, Transition} from '@headlessui/react'
import {XMarkIcon} from '@heroicons/react/24/outline'
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
import {isVideo} from 'web/lib/firebase/storage'

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5
const DOUBLE_TAP_MAX_DELAY_MS = 300
const DOUBLE_TAP_MAX_DIST_PX = 30
const ZOOM_ANIMATION_MS = 200

type Point = {x: number; y: number}

// Enlarges an image or video to the largest size that fits within 90% of the
// viewport in both dimensions, without cropping (aspect ratio preserved).
export function MediaModal(props: {url: string; open: boolean; setOpen: (open: boolean) => void}) {
  const {url, open, setOpen} = props

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
            <Dialog.Panel className="relative flex h-full w-full items-center justify-center">
              {isVideo(url) ? (
                <video
                  src={url}
                  controls
                  autoPlay
                  playsInline
                  className="h-auto max-h-full w-auto max-w-full rounded object-contain"
                />
              ) : (
                <ZoomableImage url={url} active={open} />
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
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
function ZoomableImage(props: {url: string; active: boolean}) {
  const {url, active} = props
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
