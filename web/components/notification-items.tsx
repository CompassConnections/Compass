import { SparklesIcon } from '@heroicons/react/solid'
import clsx from 'clsx'
import { Notification } from 'common/notifications'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { useIsMobile } from 'web/hooks/use-is-mobile'
import { Col } from './layout/col'
import { Row } from './layout/row'
import { RelativeTimestampNoTooltip } from './relative-timestamp'
import { Linkify } from './widgets/linkify'
import { UserLink } from './widgets/user-link'
import { Avatar } from './widgets/avatar'
import { MultiUserReactionModal } from './multi-user-reaction-link'
import { sortBy } from 'lodash'
import { ENV_CONFIG } from 'common/envs/constants'

export function NotificationItem(props: { notification: Notification }) {
  const { notification } = props
  const { sourceType, reason } = notification

  const [highlighted, setHighlighted] = useState(!notification.isSeen)

  const params = {
    notification,
    highlighted,
    setHighlighted,
  }

  if (sourceType === 'comment_on_lover') {
    return <CommentOnProfileNotification {...params} />
  } else if (sourceType === 'new_match') {
    return <NewMatchNotification {...params} />
  } else if (reason === 'new_love_like') {
    return <LoveLikeNotification {...params} />
  } else if (reason === 'new_love_ship') {
    return <LoveShipNotification {...params} />
  } else {
    return <>unknown notification: {sourceType}</>
  }
}

export function CommentOnProfileNotification(props: {
  notification: Notification
  highlighted: boolean
  setHighlighted: (highlighted: boolean) => void
  isChildOfGroup?: boolean
}) {
  const { notification, isChildOfGroup, highlighted, setHighlighted } = props
  const { sourceUserName, sourceUserUsername, sourceText } = notification
  const reasonText = `commented `
  return (
    <NotificationFrame
      notification={notification}
      isChildOfGroup={isChildOfGroup}
      highlighted={highlighted}
      setHighlighted={setHighlighted}
      icon={
        <AvatarNotificationIcon notification={notification} symbol={'💬'} />
      }
      subtitle={
        <div className="line-clamp-2">
          <Linkify text={sourceText} />
        </div>
      }
      link={notification.sourceSlug}
    >
      <div className="line-clamp-3">
        <NotificationUserLink
          name={sourceUserName}
          username={sourceUserUsername}
        />{' '}
        {reasonText}
        {!isChildOfGroup && <span>on your profile</span>}
      </div>
    </NotificationFrame>
  )
}

export function NewMatchNotification(props: {
  notification: Notification
  highlighted: boolean
  setHighlighted: (highlighted: boolean) => void
  isChildOfGroup?: boolean
}) {
  const { notification, isChildOfGroup, highlighted, setHighlighted } = props
  const {
    sourceContractTitle,
    sourceText,
    sourceUserName,
    sourceUserUsername,
  } = notification
  return (
    <NotificationFrame
      notification={notification}
      isChildOfGroup={isChildOfGroup}
      highlighted={highlighted}
      setHighlighted={setHighlighted}
      icon={
        <AvatarNotificationIcon notification={notification} symbol={'🌟'} />
      }
      link={getSourceUrl(notification)}
      subtitle={
        <div className="line-clamp-2">
          <Linkify text={sourceText} />
        </div>
      }
    >
      <div className="line-clamp-3">
        <NotificationUserLink
          name={sourceUserName}
          username={sourceUserUsername}
        />{' '}
        <span>
          proposed a new match:{' '}
          <PrimaryNotificationLink text={sourceContractTitle} />
        </span>
      </div>
    </NotificationFrame>
  )
}

function LoveLikeNotification(props: {
  notification: Notification
  highlighted: boolean
  setHighlighted: (highlighted: boolean) => void
  isChildOfGroup?: boolean
}) {
  const { notification, highlighted, setHighlighted, isChildOfGroup } = props
  const [open, setOpen] = useState(false)
  const { sourceUserName, sourceUserUsername } = notification
  const relatedNotifications: Notification[] = notification.data
    ?.relatedNotifications ?? [notification]
  const reactorsText =
    relatedNotifications.length > 1
      ? `${sourceUserName} & ${relatedNotifications.length - 1} other${
          relatedNotifications.length > 2 ? 's' : ''
        }`
      : sourceUserName
  return (
    <NotificationFrame
      notification={notification}
      isChildOfGroup={isChildOfGroup}
      highlighted={highlighted}
      setHighlighted={setHighlighted}
      icon={
        <MultipleAvatarIcons
          notification={notification}
          symbol={'💖'}
          setOpen={setOpen}
        />
      }
      link={`https://${ENV_CONFIG.domain}/${sourceUserUsername}`}
      subtitle={<></>}
    >
      {reactorsText && <PrimaryNotificationLink text={reactorsText} />} liked
      you!
      <MultiUserReactionModal
        similarNotifications={relatedNotifications}
        modalLabel={'Who liked it?'}
        open={open}
        setOpen={setOpen}
      />
    </NotificationFrame>
  )
}

function LoveShipNotification(props: {
  notification: Notification
  highlighted: boolean
  setHighlighted: (highlighted: boolean) => void
  isChildOfGroup?: boolean
}) {
  const { notification, highlighted, setHighlighted, isChildOfGroup } = props
  const [open, setOpen] = useState(false)
  const { sourceUserName, sourceUserUsername } = notification
  const relatedNotifications: Notification[] = notification.data
    ?.relatedNotifications ?? [notification]
  const reactorsText =
    relatedNotifications.length > 1
      ? `${sourceUserName} & ${relatedNotifications.length - 1} other${
          relatedNotifications.length > 2 ? 's' : ''
        }`
      : sourceUserName
  const { creatorId, creatorName, creatorUsername } = notification.data ?? {}

  return (
    <NotificationFrame
      notification={notification}
      isChildOfGroup={isChildOfGroup}
      highlighted={highlighted}
      setHighlighted={setHighlighted}
      icon={
        <MultipleAvatarIcons
          notification={notification}
          symbol={'💖'}
          setOpen={setOpen}
        />
      }
      link={`https://${ENV_CONFIG.domain}/${sourceUserUsername}`}
      subtitle={<></>}
    >
      You and {reactorsText && <PrimaryNotificationLink text={reactorsText} />}{' '}
      are being shipped by{' '}
      <NotificationUserLink
        name={creatorName}
        username={creatorUsername}
        userId={creatorId}
        hideBadge
      />
      !
      <MultiUserReactionModal
        similarNotifications={relatedNotifications}
        modalLabel={'Who liked it?'}
        open={open}
        setOpen={setOpen}
      />
    </NotificationFrame>
  )
}

const getSourceUrl = (notification: Notification) => {
  const { sourceSlug, sourceId } = notification
  if (sourceSlug) {
    return `${
      sourceSlug.startsWith('/') ? sourceSlug : '/' + sourceSlug
    }#${sourceId}`
  }
  return ''
}

// TODO: fix badges (id based)
export function NotificationUserLink(props: {
  userId?: string
  name?: string
  username?: string
  className?: string
  hideBadge?: boolean
}) {
  const { userId, name, username, className, hideBadge } = props
  return (
    <UserLink
      user={{ id: userId || '', name: name || '', username: username || '' }}
      className={clsx(
        className ?? 'hover:text-primary-500 relative flex-shrink-0'
      )}
      hideBadge={hideBadge}
    />
  )
}

export function AvatarNotificationIcon(props: {
  notification: Notification
  symbol: string | ReactNode
}) {
  const { notification, symbol } = props
  const { sourceUserName, sourceUserAvatarUrl, sourceUserUsername } =
    notification
  const href = `/${sourceUserUsername}`
  return (
    <div className="relative">
      <Link
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        onClick={(e) => e.stopPropagation}
      >
        <Avatar
          username={sourceUserName}
          avatarUrl={sourceUserAvatarUrl}
          size={'md'}
          noLink={true}
        />
        <div className="absolute -bottom-2 -right-1 text-lg">{symbol}</div>
      </Link>
    </div>
  )
}

export function MultipleAvatarIcons(props: {
  notification: Notification
  symbol: string
  setOpen: (open: boolean) => void
}) {
  const { notification, symbol, setOpen } = props
  const relatedNotifications: Notification[] = sortBy(
    notification.data?.relatedNotifications ?? [notification],
    (n) => n.createdTime
  )

  const combineAvatars = (notifications: Notification[]) => {
    const totalAvatars = notifications.length
    const maxToShow = Math.min(totalAvatars, 3)
    const avatarsToCombine = notifications.slice(
      totalAvatars - maxToShow,
      totalAvatars
    )
    const max = avatarsToCombine.length
    const startLeft = -0.35 * (max - 1)
    return avatarsToCombine.map((n, index) => (
      <div
        key={index}
        className={'absolute'}
        style={
          index === 0
            ? {
                left: `${startLeft}rem`,
              }
            : {
                left: `${startLeft + index * 0.5}rem`,
              }
        }
      >
        <AvatarNotificationIcon
          notification={n}
          symbol={index === max - 1 ? symbol : ''}
        />
      </div>
    ))
  }

  return (
    <div
      onClick={(event) => {
        if (relatedNotifications.length === 1) return
        event.preventDefault()
        setOpen(true)
      }}
    >
      {relatedNotifications.length > 1 ? (
        <Col
          className={`pointer-events-none relative items-center justify-center`}
        >
          {/* placeholder avatar to set the proper size*/}
          <Avatar size="md" />
          {combineAvatars(relatedNotifications)}
        </Col>
      ) : (
        <AvatarNotificationIcon notification={notification} symbol={symbol} />
      )}
    </div>
  )
}

export function PrimaryNotificationLink(props: { text: string | undefined }) {
  const { text } = props
  if (!text) {
    return <></>
  }
  return (
    <span className="hover:text-primary-500 font-semibold transition-colors">
      {text}
    </span>
  )
}

// the primary skeleton for notifications
export function NotificationFrame(props: {
  notification: Notification
  highlighted: boolean
  setHighlighted: (highlighted: boolean) => void
  children: React.ReactNode
  icon: ReactNode
  link?: string
  onClick?: () => void
  subtitle?: string | ReactNode
  isChildOfGroup?: boolean
  customBackground?: ReactNode
}) {
  const {
    notification,
    highlighted,
    setHighlighted,
    children,
    icon,
    subtitle,
    onClick,
    link,
    customBackground,
  } = props
  const isMobile = useIsMobile()

  const frameObject = (
    <Row className="cursor-pointer text-sm md:text-base">
      <Row className="w-full items-start gap-3">
        <Col className="relative h-full w-10 items-center">{icon}</Col>
        <Col className="font w-full">
          <span>{children}</span>
          <div className="mt-1 line-clamp-3 text-xs md:text-sm">{subtitle}</div>
        </Col>

        <Row className="mt-1 items-center justify-end gap-1 pr-1 sm:w-36">
          {highlighted && !isMobile && (
            <SparklesIcon className="text-primary-600 h-4 w-4" />
          )}
          <RelativeTimestampNoTooltip
            time={notification.createdTime}
            shortened={isMobile}
            className={clsx(
              'text-xs',
              highlighted ? 'text-primary-600' : 'text-ink-700'
            )}
          />
        </Row>
      </Row>
    </Row>
  )

  return (
    <Row className={clsx('hover:bg-primary-100 group p-2 transition-colors')}>
      {customBackground}
      {link && (
        <Col className={'w-full'}>
          <Link
            href={link}
            className={clsx('flex w-full flex-col')}
            onClick={() => {
              if (highlighted) {
                setHighlighted(false)
              }
            }}
          >
            {frameObject}
          </Link>
        </Col>
      )}
      {!link && (
        <Col
          className={'w-full'}
          onClick={() => {
            if (highlighted) {
              setHighlighted(false)
            }
            if (onClick) {
              onClick()
            }
          }}
        >
          {frameObject}
        </Col>
      )}
    </Row>
  )
}
