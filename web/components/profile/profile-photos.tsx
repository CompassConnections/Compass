import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {buildArray} from 'common/util/array'
import {uniq} from 'lodash'
import Image from 'next/image'
import {useState} from 'react'
import {MediaModal} from 'web/components/media-modal'
import {useUser} from 'web/hooks/use-user'
import {isVideo} from 'web/lib/firebase/storage'

/**
 * Shared state for the two places a profile's photos appear: the hero portrait and the carousel
 * under the bio.
 *
 * They are one set, not two — clicking either opens the same lightbox at the right index — so the
 * urls and the lightbox live here rather than being duplicated on both sides.
 */
export function useProfilePhotos(profile: Profile) {
  const currentUser = useUser()
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // `photo_urls` holds the full ordered list including the profile picture, so without the dedupe
  // the first photo showed up twice in the carousel.
  const urls = uniq(buildArray(profile.pinned_url, profile.photo_urls))

  // Signed-out visitors on a members-only profile see the pinned photo and a locked count.
  const isLocked = !currentUser && profile.visibility !== 'public'
  const visibleUrls = isLocked ? urls.slice(0, 1) : urls
  const lockedCount = isLocked ? urls.length - 1 : 0

  const safeIndex = Math.min(index, Math.max(0, visibleUrls.length - 1))

  return {
    urls,
    visibleUrls,
    isLocked,
    lockedCount,
    /** Opens the lightbox on one photo of the set — same set from either component. */
    openAt: (i: number) => {
      setIndex(i)
      setLightboxOpen(true)
    },
    lightbox: (
      /* The whole set goes to the modal, not just the tile that was clicked, so it can page through
         them and show each one's description. */
      <MediaModal
        urls={visibleUrls}
        index={safeIndex}
        setIndex={setIndex}
        descriptions={profile.image_descriptions as Record<string, string>}
        open={lightboxOpen}
        setOpen={setLightboxOpen}
      />
    ),
  }
}

/**
 * A photo filling its box, reporting its intrinsic aspect ratio once decoded.
 *
 * Both callers size the box from that ratio, so the box starts at a fallback shape and settles when
 * the ratio arrives. `naturalWidth` is the intrinsic size, unaffected by the CSS stretching it here.
 */
export function MediaTile(props: {
  url: string
  priority?: boolean
  sizes?: string
  onAspect?: (aspect: number) => void
  onClick?: () => void
  className?: string
}) {
  const {url, priority, sizes, onAspect, onClick, className} = props

  if (isVideo(url)) {
    return (
      <video
        src={url}
        className={clsx('h-full w-full object-cover object-center', className)}
        autoPlay
        muted
        loop
        playsInline
        onLoadedMetadata={(e) => {
          const {videoWidth, videoHeight} = e.currentTarget
          if (videoHeight) onAspect?.(videoWidth / videoHeight)
        }}
        onClick={onClick}
      />
    )
  }

  return (
    <Image
      priority={priority}
      src={url}
      fill
      sizes={sizes ?? '(max-width: 768px) 100vw, 40vw'}
      alt=""
      className={clsx('object-cover object-center', className)}
      onLoad={(e) => {
        const {naturalWidth, naturalHeight} = e.currentTarget
        if (naturalHeight) onAspect?.(naturalWidth / naturalHeight)
      }}
      onClick={onClick}
    />
  )
}
