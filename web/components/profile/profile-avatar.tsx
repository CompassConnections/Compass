import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import Image from 'next/image'

/**
 * Warm duotones picked to sit on both the light and dark canvas. Seeded off the user id so a
 * photoless profile keeps the same mark across sessions instead of looking like a missing image.
 */
const AVATAR_GRADIENTS: Array<[string, string]> = [
  ['#C79A5B', '#7A4A1F'],
  ['#A88C6A', '#4A3524'],
  ['#8FA07C', '#3A4A33'],
  ['#7C93A0', '#2E4049'],
  ['#A07C8F', '#492E3D'],
  ['#BFA05A', '#5C4318'],
  ['#8C8FA8', '#33364F'],
]

function hashString(s: string) {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** First letter of the first and last word — `Array.from` so emoji/accents don't get sliced. */
function getInitials(name: string | undefined) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const first = Array.from(words[0])[0] ?? ''
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/**
 * The profile photo when there is one, otherwise a generated monogram. Both render in the same
 * round frame so cards keep an identical rhythm whether or not someone uploaded a picture.
 */
export function ProfileAvatar(props: {
  profile: Profile
  sizePx: number
  /** Ignore the uploaded photo and always draw the monogram (used by the "photos off" toggle). */
  hidePhoto?: boolean
  className?: string
}) {
  const {profile, sizePx, hidePhoto, className} = props
  const {user} = profile

  // Deliberately not falling back to `user.avatarUrl`: signup generates one, so it would mask the
  // fact that a profile has no real photo.
  const photoUrl = hidePhoto ? null : profile.pinned_url
  const [from, to] = AVATAR_GRADIENTS[hashString(profile.user_id) % AVATAR_GRADIENTS.length]

  return (
    <div
      className={clsx(
        'relative shrink-0 overflow-hidden rounded-full',
        'ring-1 ring-inset ring-ink-900/10 dark:ring-white/10',
        className,
      )}
      style={{width: sizePx, height: sizePx}}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          fill
          sizes={`${sizePx}px`}
          alt=""
          className="object-cover object-center"
          loading="lazy"
          priority={false}
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{backgroundImage: `linear-gradient(140deg, ${from}, ${to})`}}
          />
          {/* Top-left sheen: keeps the flat fill from reading as an unloaded placeholder. */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/20" />
          <span
            className="main-font absolute inset-0 grid select-none place-items-center font-medium text-white/95"
            style={{fontSize: sizePx * 0.36, letterSpacing: '0.03em'}}
            aria-hidden
          >
            {getInitials(user?.name)}
          </span>
        </>
      )}
    </div>
  )
}
