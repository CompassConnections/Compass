import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {buildArray} from 'common/util/array'
import Image from 'next/image'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import {MediaModal} from 'web/components/media-modal'
import {SignUpButton} from 'web/components/nav/sidebar'
import {useUser} from 'web/hooks/use-user'
import {isVideo} from 'web/lib/firebase/storage'
import {useT} from 'web/lib/locale'

/**
 * Square photo gallery for the profile hero: one main tile plus a thumbnail strip.
 *
 * Photos are the second thing a visitor checks, so they sit at the top — but the tile is capped at a
 * modest size on purpose. A full-bleed hero image would push the bio, which ranks right behind them,
 * off the first screen.
 */
const MAIN_SIZE = 300
const THUMB_SIZE = 64

export default function ProfileGallery(props: {profile: Profile; className?: string}) {
  const {profile, className} = props
  const t = useT()
  const currentUser = useUser()

  const urls = buildArray(profile.pinned_url, profile.photo_urls)
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (urls.length === 0) return null

  // Signed-out visitors on a members-only profile see the pinned photo and a locked count.
  const isLocked = !currentUser && profile.visibility !== 'public'
  const visibleUrls = isLocked ? urls.slice(0, 1) : urls

  const selectedUrl = visibleUrls[Math.min(selected, visibleUrls.length - 1)]

  // Every photo gets a thumbnail — they wrap onto as many rows as it takes. The only "+N" left is the
  // locked one, where the count is all a signed-out visitor is allowed to know.
  const lockedCount = isLocked ? urls.length - 1 : 0

  return (
    <Col className={clsx('flex-none gap-3', className)} style={{width: MAIN_SIZE}}>
      <div
        className="border-canvas-300 relative aspect-square w-full overflow-hidden rounded-[4px] border"
        style={{maxWidth: MAIN_SIZE}}
      >
        <MediaTile
          url={selectedUrl}
          priority
          onClick={() => !isLocked && setLightboxOpen(true)}
          className={isLocked ? 'cursor-default' : 'cursor-pointer'}
        />
      </div>

      {(visibleUrls.length > 1 || lockedCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {!isLocked &&
            visibleUrls.map((url, i) => (
              <button
                key={url}
                onClick={() => setSelected(i)}
                aria-label={t('profile.gallery.show_photo', 'Show photo {number}', {number: i + 1})}
                className={clsx(
                  'overflow-hidden rounded-[3px] border transition-colors',
                  i === selected
                    ? 'border-primary-500'
                    : 'border-canvas-300 hover:border-primary-400',
                )}
                style={{width: THUMB_SIZE, height: THUMB_SIZE}}
              >
                <MediaTile url={url} />
              </button>
            ))}
          {lockedCount > 0 && (
            <div
              className="bg-canvas-100 border-canvas-300 text-ink-500 flex items-center justify-center rounded-[3px] border border-dashed text-sm"
              style={{width: THUMB_SIZE, height: THUMB_SIZE}}
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
      )}

      {/* The whole set goes to the modal, not just the tile that was clicked, so it can page through
          them and show each one's description. Descriptions live only there — under the grid they
          changed height as you moved between thumbnails and shoved the hero around. */}
      <MediaModal
        urls={visibleUrls}
        index={Math.min(selected, visibleUrls.length - 1)}
        setIndex={setSelected}
        descriptions={profile.image_descriptions as Record<string, string>}
        open={lightboxOpen}
        setOpen={setLightboxOpen}
      />
    </Col>
  )
}

function MediaTile(props: {
  url: string
  priority?: boolean
  onClick?: () => void
  className?: string
}) {
  const {url, priority, onClick, className} = props

  if (isVideo(url)) {
    return (
      <video
        src={url}
        className={clsx('h-full w-full object-cover', className)}
        autoPlay
        muted
        loop
        playsInline
        onClick={onClick}
      />
    )
  }

  return (
    <Image
      priority={priority}
      src={url}
      height={MAIN_SIZE}
      width={MAIN_SIZE}
      sizes={`${MAIN_SIZE}px`}
      alt=""
      className={clsx('h-full w-full object-cover', className)}
      onClick={onClick}
    />
  )
}
