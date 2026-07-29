import {PlayIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {useT} from 'web/lib/locale'

/**
 * A video shown as a still cover frame with a play affordance.
 *
 * Nothing plays in place here, so the element paints only what the browser has decoded:
 * `preload="metadata"` on its own leaves Chrome and the Android WebView with an empty grey box.
 * The `#t=` media fragment asks for the frame at that timestamp, and the seek on loadedmetadata
 * covers the browsers that load the metadata but ignore the fragment.
 */
export function VideoThumbnail(props: {src: string; className?: string; onClick?: () => void}) {
  const {src, className, onClick} = props
  const t = useT()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('media.play_video', 'Play video')}
      className="relative inline-block cursor-pointer align-middle leading-none"
    >
      <video
        src={firstFrameSrc(src)}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget
          // Only nudge a video parked at the very start: a fragment the browser did honour has
          // already moved it, and re-seeking would throw that frame away.
          if (el.currentTime === 0) el.currentTime = FIRST_FRAME_TIME
        }}
        className={clsx('object-contain', className)}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 ring-1 ring-white/50">
          <PlayIcon className="ml-0.5 h-5 w-5 text-white" />
        </span>
      </span>
    </button>
  )
}

/** Not 0: a request for exactly the start is what a browser showing a blank poster already did. */
const FIRST_FRAME_TIME = 0.001

/** Media fragment asking the browser to show the opening frame rather than an empty box. */
export function firstFrameSrc(src: string) {
  return src.includes('#') ? src : `${src}#t=${FIRST_FRAME_TIME}`
}
