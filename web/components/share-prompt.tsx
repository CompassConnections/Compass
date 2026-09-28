import {HeartIcon, SpeakerWaveIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {SHARE_VIDEO_AVAILABLE, SHARE_VIDEO_FILE} from 'common/share/prompt'
import Link from 'next/link'
import {useRef, useState} from 'react'
import {buttonClass} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {Avatar} from 'web/components/widgets/avatar'
import {ShareCompassButton} from 'web/components/widgets/share-compass-button'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {
  setShareDialogOpen,
  useQuietSharePrompt,
  useShareDialogOpen,
} from 'web/hooks/use-share-prompt'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

/**
 * Always the deployed site, on every platform. At ~50 MB the file is kept out of the app bundle (see
 * `web/scripts/fetch-media.mjs`), so the apps have to stream it from the web; the web plays the same
 * URL rather than a relative one so both render identical markup. `NEXT_PUBLIC_MEDIA_BASE_URL`
 * overrides it, as for the home-page clips.
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || DEPLOYED_WEB_URL).replace(/\/$/, '')
const SHARE_VIDEO_URL = `${MEDIA_BASE}/videos/${SHARE_VIDEO_FILE}`

/**
 * The first frame, as a still. Needed because `preload="metadata"` only draws a first frame in desktop
 * browsers: the iOS web view shows nothing and Android's shows a grey placeholder until playback. It
 * is the full 1080×1920 frame (black band included), so the crop below applies to it unchanged.
 * Relative on purpose: small enough to ship in the app bundle, unlike the video.
 */
const SHARE_VIDEO_POSTER = '/images/share-ask-poster-v1.jpg'

/**
 * The recording carries a black band along its top (18px) and right edge (4px): the picture itself is
 * 1076×1902 inside a 1080×1920 frame, measured with ffmpeg's `cropdetect`. Rather than re-encode the
 * file, the box takes the picture's own proportions and the video is sized and shifted inside it so
 * the bands fall outside the clip. Re-measure if the video is ever re-recorded.
 */
const FRAME = {width: 1080, height: 1920}
const PICTURE = {width: 1076, height: 1902, top: 18}

/**
 * Martin asking members to share Compass or donate. Subtitles are burned into the video, so it
 * autoplays muted and still reads.
 *
 * Muted autoplay because the dialog opens on a timer, not on a tap: most browsers (Safari, the iOS
 * app) block sound there anyway, and a voice out of nowhere on a bus is how the dialog gets closed.
 * The native mute icon is too small to be found, so a "Tap for sound" button sits over the video
 * while it is muted, and restarts it from the top with sound — hearing it from mid-sentence would
 * waste the one sentence that sets it up.
 *
 * Portrait (filmed on a phone), so the height is what gets capped and the width follows — a
 * full-width portrait video would be taller than the screen. `className` sizes the box.
 */
export function ShareAskVideo(props: {autoPlay?: boolean; className?: string}) {
  const {autoPlay, className} = props
  const t = useT()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(!!autoPlay)

  const playWithSound = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.muted = false
    void video.play()
    track('share prompt unmute')
  }

  return (
    <div
      className={clsx(
        'bg-canvas-100 relative mx-auto h-[min(60dvh,640px)] w-auto overflow-hidden rounded-xl',
        className,
      )}
      style={{aspectRatio: `${PICTURE.width} / ${PICTURE.height}`}}
    >
      <video
        ref={videoRef}
        className="absolute left-0 max-w-none"
        style={{
          width: `${(FRAME.width / PICTURE.width) * 100}%`,
          height: `${(FRAME.height / PICTURE.height) * 100}%`,
          top: `${(-PICTURE.top / PICTURE.height) * 100}%`,
        }}
        src={SHARE_VIDEO_URL}
        poster={SHARE_VIDEO_POSTER}
        autoPlay={autoPlay}
        muted={autoPlay}
        controls
        playsInline
        preload="metadata"
        // Also catches the native speaker icon, so the button goes away however the sound came on.
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      />
      {muted && (
        // Top centre: the native controls own the bottom edge.
        <button
          type="button"
          onClick={playWithSound}
          className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/75"
        >
          <SpeakerWaveIcon className="h-4 w-4" aria-hidden="true" />
          {t('share_prompt.tap_for_sound', 'Tap for sound')}
        </button>
      )}
    </div>
  )
}

/** Whose video it is — same lookup /about uses for the founder photo. */
const FOUNDER_USERNAME = 'Martin'

/**
 * Martin's profile, right under the video: the person who just spoke is one tap away, and his profile
 * is where members message him. Renders the name alone until the avatar arrives, never a skeleton.
 */
export function FounderProfileLink(props: {source: 'prompt' | 'referrals'; onAction?: () => void}) {
  const {source, onAction} = props
  const t = useT()
  const {data} = useAPIGetter('get-user-and-profile', {username: FOUNDER_USERNAME})
  return (
    <Link
      href={`/${FOUNDER_USERNAME}`}
      className="hover:bg-canvas-50 flex items-center gap-3 self-start rounded-xl px-2 py-1.5 transition-colors"
      onClick={() => {
        track('share prompt founder profile', {source})
        onAction?.()
      }}
    >
      <Avatar username={FOUNDER_USERNAME} avatarUrl={data?.user?.avatarUrl} size="md" noLink />
      <div className="min-w-0">
        <div className="text-ink-900 text-sm font-semibold">{data?.user?.name ?? 'Martin'}</div>
        <div className="text-ink-500 text-sm">
          {t('share_prompt.founder_contact', 'Questions or ideas? Message me on my profile')}
        </div>
      </div>
    </Link>
  )
}

/**
 * Share first, donate second — the order the video asks in. On /referrals the share tools are already
 * on the page, so only Donate is left to offer there.
 */
export function ShareAskActions(props: {source: 'prompt' | 'referrals'; onAction?: () => void}) {
  const {source, onAction} = props
  const t = useT()
  const user = useUser()
  const referralUrl = user
    ? `${DEPLOYED_WEB_URL}/?referrer=${user.username}`
    : `${DEPLOYED_WEB_URL}/`
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-3',
        source === 'prompt' ? 'justify-center' : 'justify-start',
      )}
    >
      {/* The share panel itself rather than a link to /referrals: the member can share straight from
          the dialog, with their own ?referrer= link. It stays open while they do — the panel is
          portalled, and `useOutsideDismiss` does not count portals as outside the modal. */}
      {source === 'prompt' && (
        <ShareCompassButton
          url={referralUrl}
          trackingProps={{source: 'share-prompt'}}
          // The button sits at the bottom of the dialog, so the phone sheet rises from there.
          mobileSheet="bottom"
        />
      )}
      <Link
        href="/support"
        className={clsx(buttonClass('md', 'gray-outline'), 'gap-2 rounded-xl py-2.5')}
        onClick={() => {
          track('share prompt donate', {source})
          onAction?.()
        }}
      >
        <HeartIcon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
        {t('share_prompt.donate', 'Donate')}
      </Link>
    </div>
  )
}

/**
 * Mounted once, from `_app.tsx`. Counts the session, takes the quiet catch-up, and renders the dialog
 * whenever `requestSharePrompt` opens it.
 */
export function SharePrompts() {
  useQuietSharePrompt()
  const open = useShareDialogOpen()
  const t = useT()

  if (!SHARE_VIDEO_AVAILABLE) return null

  const close = () => setShareDialogOpen(false)

  return (
    <Modal
      open={open}
      setOpen={(o) => {
        if (!o) track('share prompt dismissed')
        setShareDialogOpen(o)
      }}
      size="md"
    >
      <Col className="bg-canvas-0 max-h-[90dvh] gap-5 overflow-auto rounded-2xl p-5 sm:p-8">
        <div className="text-ink-900 text-center text-xl font-semibold">
          {t('share_prompt.title', "Let's grow Compass together")}
        </div>
        {open && <ShareAskVideo autoPlay />}
        <FounderProfileLink source="prompt" onAction={close} />
        <ShareAskActions source="prompt" onAction={close} />
        <button
          type="button"
          className="text-ink-500 hover:text-ink-700 self-center text-sm"
          onClick={() => {
            track('share prompt dismissed')
            close()
          }}
        >
          {t('share_prompt.later', 'Maybe later')}
        </button>
      </Col>
    </Modal>
  )
}

/**
 * The video's permanent home, inside a section of /referrals under the member's share link. The page
 * gates it on `SHARE_VIDEO_AVAILABLE`, since the section heading around it is the page's own.
 *
 * From lg up the video has a fixed 20rem width, with its height following the 9:16 ratio; the page's
 * column may be wider (it is sized by its one-line title), so the video sits left rather than centred. Capping the height instead (the dialog's way) left the player box wider
 * than the picture, letterboxed, with a controls bar overhanging it.
 */
export function ShareAskReferralsBlock() {
  return (
    <Col className="mt-6 gap-5">
      <ShareAskVideo className="lg:mx-0 lg:h-auto lg:w-80" />
      <FounderProfileLink source="referrals" />
      <ShareAskActions source="referrals" />
    </Col>
  )
}
