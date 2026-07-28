import clsx from 'clsx'
import {clamp} from 'lodash'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SignUpButton} from 'web/components/nav/sidebar'
import {useT} from 'web/lib/locale'

import {MediaTile} from './profile-photos'

const CARD_HEIGHT_CLASS = 'h-[220px] md:h-[300px]'
/** Same floor as the hero: a sliver of a photo is worse than a centred crop of it. */
const MIN_ASPECT = 4 / 5
/** One panorama should not be the whole strip. */
const MAX_ASPECT = 16 / 9

/**
 * The rest of the photos, as one sideways strip under the bio.
 *
 * A thumbnail rail next to the hero made every photo but one a 64px afterthought. Down here each
 * one is shown at a size worth looking at, at a shared height so the row reads as a single line,
 * and with its description as a caption — the one place descriptions are legible without opening
 * anything.
 */
export default function ProfilePhotoCarousel(props: {
  urls: string[]
  descriptions?: Record<string, string>
  lockedCount?: number
  /** Index within the full photo set, so the lightbox opens on the photo that was clicked. */
  indexOffset?: number
  onSelect?: (index: number) => void
  className?: string
}) {
  const {urls, descriptions, lockedCount = 0, indexOffset = 0, onSelect, className} = props
  const t = useT()

  const scrollRef = useRef<HTMLDivElement>(null)
  // Kept measured while the hint above the strip is commented out, so re-enabling it is one edit.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasMore, setHasMore] = useState(false)

  const measure = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // 4px of slack keeps the hint from sticking on at the very end of a sub-pixel layout.
    setHasMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, {passive: true})
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure, urls.length])

  if (urls.length === 0 && lockedCount === 0) return null

  return (
    <Col className={clsx('gap-4', className)} data-testid="profile-photo-carousel">
      <Row className="items-baseline justify-between">
        <div
          className="text-ink-400 font-dm-sans uppercase"
          style={{fontSize: '10px', letterSpacing: '0.18em'}}
        >
          {t('profile.photos', 'Photos')}
        </div>
        {/*<div*/}
        {/*  aria-hidden*/}
        {/*  className={clsx(*/}
        {/*    'text-ink-400 text-sm transition-opacity duration-200',*/}
        {/*    hasMore ? 'opacity-100' : 'opacity-0',*/}
        {/*  )}*/}
        {/*>*/}
        {/*  {t('profile.photos.scroll_sideways', 'Scroll sideways')} →*/}
        {/*</div>*/}
      </Row>

      {/* Two overrides here, both load-bearing for scrolling the *page* with the cursor over the
          strip. `overflow-y-hidden`: a non-visible `overflow-x` makes the browser compute
          `overflow-y` as auto too, so a stray pixel of vertical overflow would make this a vertical
          scroller. `!overscroll-y-auto`: `.scrollbar-visible` sets `overscroll-behavior: contain`,
          which is right for ScrollPanel and wrong here — it stops the wheel chaining to the page.
          Contain is kept on the x axis, where it prevents a sideways swipe going back a page. */}
      <div
        ref={scrollRef}
        className="scrollbar-visible -mx-1 flex snap-x gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain !overscroll-y-auto px-1 pb-3"
      >
        {urls.map((url, i) => (
          <PhotoCard
            key={url}
            url={url}
            caption={descriptions?.[url]}
            onClick={onSelect && (() => onSelect(indexOffset + i))}
          />
        ))}
        {lockedCount > 0 && (
          <div
            className={clsx(
              'bg-canvas-100 border-canvas-300 text-ink-500 flex flex-none snap-start items-center justify-center rounded-[4px] border border-dashed',
              CARD_HEIGHT_CLASS,
            )}
            style={{aspectRatio: MIN_ASPECT}}
          >
            <SignUpButton
              text={`+${lockedCount}`}
              size="xs"
              color="none"
              className="dark:text-ink-500 hover:text-primary-500"
            />
          </div>
        )}
      </div>
    </Col>
  )
}

function PhotoCard(props: {url: string; caption?: string; onClick?: () => void}) {
  const {url, caption, onClick} = props
  const [aspect, setAspect] = useState<number | null>(null)

  return (
    <Col className="flex-none snap-start gap-2">
      <div
        className={clsx(
          'border-canvas-300 relative overflow-hidden rounded-[4px] border',
          CARD_HEIGHT_CLASS,
          onClick && 'cursor-pointer',
        )}
        style={{aspectRatio: clamp(aspect ?? MIN_ASPECT, MIN_ASPECT, MAX_ASPECT)}}
      >
        <MediaTile
          url={url}
          sizes="(max-width: 768px) 60vw, 300px"
          onAspect={setAspect}
          onClick={onClick}
        />
      </div>
      {caption && (
        <div className="text-primary-800 max-w-[34ch] text-sm leading-snug">{caption}</div>
      )}
    </Col>
  )
}
