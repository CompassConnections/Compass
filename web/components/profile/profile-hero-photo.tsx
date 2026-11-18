import {ArrowLeftIcon, ArrowRightIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {clamp} from 'lodash'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useSafeLayoutEffect} from 'web/hooks/use-safe-layout-effect'
import {useT} from 'web/lib/locale'

import {MediaTile} from './profile-photos'

const MIN_SIZE = 200
/** A square as tall as a long text column would leave nothing beside it. */
const MAX_WIDTH_RATIO = 0.46
const FALLBACK_SIZE = 300
/**
 * Deadband on the measured size. Widening the photo narrows the text, which can make the text
 * taller, which widens the photo again — so a threshold too small to swallow one line of text lets
 * the two chase each other forever. Anything under this is left alone.
 */
const SETTLE_PX = 8

/**
 * The single hero photo, square, sized to the height of the text beside it.
 *
 * Square rather than the photo's own shape: it makes the band the same at every profile regardless
 * of what people upload, and the crop is centred, which is where faces are.
 */
export default function ProfileHeroPhoto(props: {
  url: string
  /** Measured height of the text column — what the photo is matched to. */
  textHeight: number | undefined
  /** Measured width of the whole hero row, so a tall text column cannot crowd it out. */
  bandWidth: number | undefined
  onClick?: () => void
  className?: string
  /** Above the text rather than beside it; undefined leaves it to the `md` breakpoint. */
  stacked?: boolean
}) {
  const {url, textHeight, bandWidth, onClick, className, stacked} = props

  const size = useHeroPhotoSize(textHeight, bandWidth)

  return (
    <div
      className={clsx(
        'border-canvas-300 relative aspect-square flex-none overflow-hidden rounded-xl border',
        // Stacked above the text, a full-width square is as tall as the screen is wide, which on a
        // phone pushes everything that says who this is below the fold. Capping the width caps the
        // height with it (the square follows), so the photo never takes more than 40% of the
        // viewport. Lifted at `md`, where the width is driven by the text column instead.
        // Each branch carries its own width: an unprefixed `w-[…]` next to a base `w-full` is a tie
        // that `w-full` wins (stylesheet order), which stretched the square across the whole band.
        stacked === undefined
          ? 'w-full max-w-[40dvh] md:max-w-none md:w-[var(--hero-photo-size)] md:self-start'
          : stacked
            ? 'w-full max-w-[40dvh]'
            : 'w-[var(--hero-photo-size)] self-start',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{['--hero-photo-size' as string]: `${size ?? FALLBACK_SIZE}px`}}
    >
      <MediaTile url={url} priority sizes="(max-width: 768px) 100vw, 40vw" onClick={onClick} />
    </div>
  )
}

/** Above this window width the hero shows every photo, and the strip under the bio goes away. */
export const HERO_GALLERY_MIN_WIDTH_PX = 1600

/** Same floor and ceiling as the strip under the bio. */
const MIN_ASPECT = 4 / 5
const MAX_ASPECT = 16 / 9

/** The square's side: the height of the text beside it, within bounds. */
function useHeroPhotoSize(textHeight: number | undefined, bandWidth: number | undefined) {
  const [size, setSize] = useState<number | null>(null)

  useSafeLayoutEffect(() => {
    if (!textHeight || !bandWidth) return
    const target = clamp(textHeight, MIN_SIZE, bandWidth * MAX_WIDTH_RATIO)
    setSize((prev) => (prev != null && Math.abs(prev - target) < SETTLE_PX ? prev : target))
  }, [textHeight, bandWidth])

  return size
}

/**
 * Every photo in the hero, as one sideways strip at the height the single square would have had.
 *
 * Only on very wide windows: there the space right of the text was empty, and the photos further
 * down sat under the bio, a long scroll away from the first. Each keeps its own shape (within the
 * same bounds as the strip it replaces) since they no longer need to match a square.
 */
export function ProfileHeroGallery(props: {
  urls: string[]
  textHeight: number | undefined
  bandWidth: number | undefined
  onSelect?: (index: number) => void
  className?: string
  /** Full width above the text, at the stacked photo's height, instead of beside it. */
  stacked?: boolean
}) {
  const {urls, textHeight, bandWidth, onSelect, className, stacked} = props
  const size = useHeroPhotoSize(textHeight, bandWidth) ?? FALLBACK_SIZE
  // Stacked there is no text beside it to match, so it takes the height the single stacked photo
  // would have (40% of the viewport), capped so a tall window doesn't make it a wall of photo.
  const tileHeight = stacked ? STACKED_GALLERY_HEIGHT : size

  const t = useT()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState({back: false, forward: false})

  const measure = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // 4px of slack, so a sub-pixel layout at either end does not leave an arrow that does nothing.
    const back = el.scrollLeft > 4
    const forward = el.scrollWidth - el.clientWidth - el.scrollLeft > 4
    setCanScroll((prev) =>
      prev.back === back && prev.forward === forward ? prev : {back, forward},
    )
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, {passive: true})
    // The tiles too, not just the strip: each one takes its real shape only once its photo has
    // loaded, which changes how far there is to scroll without changing the strip's own box.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure, urls.length])

  // Most of a screenful, so the photo cut off at the edge is the first one fully in view after.
  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({left: direction * el.clientWidth * 0.8, behavior: 'smooth'})
  }

  return (
    <div
      // At least as wide as the square it replaces; the text column gives up width before it does.
      className={clsx(
        'group/gallery relative min-w-0 self-start',
        // In a column `flex-1` would set its *height* from a zero basis, so stacked it is just full width.
        stacked ? 'w-full flex-none' : 'flex-1',
        className,
      )}
      style={stacked ? undefined : {minWidth: size}}
    >
      <div
        ref={scrollRef}
        // Scroll overrides match ProfilePhotoCarousel, where the reasons are written down.
        className="scrollbar-visible flex snap-x gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain !overscroll-y-auto pb-2"
        data-testid="profile-hero-gallery"
      >
        {urls.map((url, i) => (
          <GalleryTile
            key={url}
            url={url}
            height={tileHeight}
            priority={i === 0}
            onClick={onSelect && (() => onSelect(i))}
          />
        ))}
      </div>
      {canScroll.back && (
        <GalleryArrow
          direction="back"
          label={t('profile.photos.previous', 'Previous photos')}
          onClick={() => scrollByPage(-1)}
        />
      )}
      {canScroll.forward && (
        <GalleryArrow
          direction="forward"
          label={t('profile.photos.next', 'More photos')}
          onClick={() => scrollByPage(1)}
        />
      )}
    </div>
  )
}

/**
 * A round button over the edge of the strip, shown only while there is somewhere to go that way.
 *
 * For a mouse: a sideways strip is awkward to scroll with a wheel, and the cut-off photo at the edge
 * is the only other sign there is more. Hidden where there is no hover — a finger swipes the strip
 * directly, and the button would sit on top of the photo it is trying to reveal.
 */
function GalleryArrow(props: {direction: 'back' | 'forward'; label: string; onClick: () => void}) {
  const {direction, label, onClick} = props
  const Icon = direction === 'back' ? ArrowLeftIcon : ArrowRightIcon
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      data-testid={`profile-hero-gallery-${direction}`}
      className={clsx(
        // Centred on the photos rather than on the box, which is 8px taller for the scrollbar.
        'absolute top-[calc(50%-4px)] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full',
        'bg-canvas-950/70 text-white hover:bg-canvas-950/90',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
        '[@media(hover:none)]:hidden',
        // Only while the pointer is over the strip, or the button itself has keyboard focus: at rest
        // the photos are unobstructed.
        'opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover/gallery:opacity-100',
        direction === 'back' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

const STACKED_GALLERY_HEIGHT = 'min(40dvh, 22rem)'

function GalleryTile(props: {
  url: string
  height: number | string
  priority?: boolean
  onClick?: () => void
}) {
  const {url, height, priority, onClick} = props
  const [aspect, setAspect] = useState<number | null>(null)

  return (
    <div
      className={clsx(
        'border-canvas-300 relative flex-none snap-start overflow-hidden rounded-xl border',
        onClick && 'cursor-pointer',
      )}
      style={{height, aspectRatio: clamp(aspect ?? MIN_ASPECT, MIN_ASPECT, MAX_ASPECT)}}
    >
      <MediaTile
        url={url}
        priority={priority}
        sizes={`${Math.round((typeof height === 'number' ? height : 352) * MAX_ASPECT)}px`}
        onAspect={setAspect}
        onClick={onClick}
      />
    </div>
  )
}
