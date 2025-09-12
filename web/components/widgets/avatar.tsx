import Router from 'next/router'
import clsx from 'clsx'
import {memo, MouseEvent, useEffect, useState} from 'react'
import {UserIcon, UsersIcon} from '@heroicons/react/solid'
import Image from 'next/image'
import {floor} from 'lodash'

export type AvatarSizeType = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export const Avatar = memo(
  (props: {
    username?: string
    avatarUrl?: string | null
    noLink?: boolean
    size?: AvatarSizeType
    className?: string
    preventDefault?: boolean
  }) => {
    const {username, noLink, size, className, preventDefault} = props
    const [avatarUrl, setAvatarUrl] = useState(props.avatarUrl)
    useEffect(() => setAvatarUrl(props.avatarUrl), [props.avatarUrl])
    const s =
      size == '2xs'
        ? 4
        : size == 'xs'
          ? 6
          : size == 'sm'
            ? 8
            : size == 'md'
              ? 10
              : size == 'lg'
                ? 12
                : size == 'xl'
                  ? 24
                  : 10
    const sizeInPx = s * 4

    const onClick = (e: MouseEvent) => {
      if (!noLink && username) {
        if (preventDefault) {
          e.preventDefault()
        }
        e.stopPropagation()
        Router.push(`/${username}`)
      }
    }

    const fallbackInitial = (username || 'U')[0]; // first character, not encoded string
    const url: string = avatarUrl && avatarUrl.length > 0
      ? avatarUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackInitial)}`;


    // console.log(url)

    // there can be no avatar URL or username in the feed, we show a "submit comment"
    // item with a fake grey user circle guy even if you aren't signed in
    // return url ? (
    return <div className="relative inline-block group">
      <Image
        width={sizeInPx}
        height={sizeInPx}
        className={clsx(
          'bg-canvas-0 my-0 flex-shrink-0 rounded-full object-cover',
          `w-${s} h-${s}`,
          !noLink && 'cursor-pointer',
          className
        )}
        style={{maxWidth: `${s * 0.25}rem`}}
        src={url}
        onClick={onClick}
        alt={`${username ?? 'Unknown user'} avatar`}
        onError={() => setAvatarUrl('')}
      />

      {/*<div className="absolute -top-8 left-1/2 -translate-x-1/2*/}
      {/*          rounded-md bg-gray-800 px-2 py-1 text-xs text-white*/}
      {/*          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100*/}
      {/*          transition-opacity pointer-events-none whitespace-nowrap">*/}
      {/*  {username ?? 'Unknown user'}*/}
      {/*</div>*/}
    </div>

    // ) : (
    //   <UserCircleIcon
    //     className={clsx(
    //       `bg-canvas-0 flex-shrink-0 rounded-full w-${s} h-${s} text-ink-500`,
    //       className
    //     )}
    //     aria-hidden="true"
    //   />
    // )
  }
)

export function EmptyAvatar(props: {
  className?: string
  size?: number
  multi?: boolean
}) {
  const {className, size = 8, multi} = props
  const insize = size - floor(size / 3)
  const Icon = multi ? UsersIcon : UserIcon

  return (
    <div
      className={clsx(
        `flex flex-shrink-0 h-${size} w-${size} bg-ink-200 items-center justify-center rounded-full`,
        className
      )}
    >
      <Icon className={`h-${insize} w-${insize} text-ink-500`} aria-hidden/>
    </div>
  )
}
