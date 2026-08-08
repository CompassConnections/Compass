import clsx from 'clsx'
import {clamp} from 'lodash'
import {useState} from 'react'
import {useSafeLayoutEffect} from 'web/hooks/use-safe-layout-effect'

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
}) {
  const {url, textHeight, bandWidth, onClick, className} = props

  const [size, setSize] = useState<number | null>(null)

  useSafeLayoutEffect(() => {
    if (!textHeight || !bandWidth) return
    const target = clamp(textHeight, MIN_SIZE, bandWidth * MAX_WIDTH_RATIO)
    setSize((prev) => (prev != null && Math.abs(prev - target) < SETTLE_PX ? prev : target))
  }, [textHeight, bandWidth])

  return (
    <div
      className={clsx(
        'border-canvas-300 relative aspect-square w-full flex-none overflow-hidden rounded-xl border',
        // Stacked above the text, a full-width square is as tall as the screen is wide, which on a
        // phone pushes everything that says who this is below the fold. Capping the width caps the
        // height with it (the square follows), so the photo never takes more than 40% of the
        // viewport. Lifted at `md`, where the width is driven by the text column instead.
        'max-w-[40dvh] md:max-w-none',
        'md:w-[var(--hero-photo-size)] md:self-start',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{['--hero-photo-size' as string]: `${size ?? FALLBACK_SIZE}px`}}
    >
      <MediaTile url={url} priority sizes="(max-width: 768px) 100vw, 40vw" onClick={onClick} />
    </div>
  )
}
