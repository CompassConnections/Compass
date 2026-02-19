import {CheckIcon, ClipboardCopyIcon, DuplicateIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import {ComponentProps, useState} from 'react'
import toast from 'react-hot-toast'
import {Button, ColorType, IconButton, SizeType} from 'web/components/buttons/button'
import LinkIcon from 'web/lib/icons/link-icon.svg'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {copyToClipboard} from 'web/lib/util/copy'

import {Tooltip} from '../widgets/tooltip'

export function CopyLinkOrShareButton(props: {
  url: string
  eventTrackingName: string // was type ShareEventName — why??
  tooltip?: string
  className?: string
  iconClassName?: string
  size?: SizeType
  children?: React.ReactNode
  color?: ColorType
  trackingInfo?: {
    contractId: string
  }
}) {
  const {url, size, children, className, iconClassName, tooltip, color} = props
  const [isSuccess, setIsSuccess] = useState(false)
  const t = useT()

  const onClick = () => {
    if (!url) return
    copyToClipboard(url)
    setIsSuccess(true)
    setTimeout(() => setIsSuccess(false), 2000) // Reset after 2 seconds
  }

  const content = isSuccess ? t('about.settings.copied', 'Copied!') : children

  return (
    <ToolTipOrDiv
      hasChildren={!!children}
      text={tooltip ?? t('copy_link_button.copy_link', 'Copy link')}
      noTap
      placement="bottom"
    >
      <Button
        onClick={onClick}
        className={clsx(
          className,
          'active:text-white',
          isSuccess && 'text-green-500 duration-[25ms] hover:text-green-200',
        )}
        disabled={!url}
        size={size}
        color={color ?? 'gray-white'}
      >
        {isSuccess ? (
          <CheckIcon
            strokeWidth={'3'}
            className={clsx(iconClassName ?? 'h-[1.1rem]')}
            aria-hidden="true"
          />
        ) : (
          <LinkIcon
            strokeWidth={'2.5'}
            className={clsx(iconClassName ?? 'h-[1.1rem]')}
            aria-hidden="true"
          />
        )}
        {content}
      </Button>
    </ToolTipOrDiv>
  )
}

const ToolTipOrDiv = (props: {hasChildren: boolean} & ComponentProps<typeof Tooltip>) =>
  props.hasChildren ? (
    <>{props.children}</>
  ) : (
    <Tooltip text={props.text} noTap placement="bottom">
      {' '}
      {props.children}
    </Tooltip>
  )

export const CopyLinkRow = (props: {
  url?: string // required if not loading
  eventTrackingName: string
  linkBoxClassName?: string
  linkButtonClassName?: string
}) => {
  const {url, linkBoxClassName, linkButtonClassName} = props

  // "copied" success state animations
  const [bgPressed, setBgPressed] = useState(false)
  const [iconPressed, setIconPressed] = useState(false)
  const t = useT()

  const onClick = () => {
    if (!url) return

    setBgPressed(true)
    setIconPressed(true)
    setTimeout(() => setBgPressed(false), 300)
    setTimeout(() => setIconPressed(false), 1000)
    copyToClipboard(url)
    toast.success(t('copy_link_button.link_copied', 'Link copied!'))
  }

  // remove any http:// prefix
  const displayUrl = url?.replace(/^https?:\/\//, '') ?? ''

  return (
    <button
      className={clsx(
        'border-ink-300 flex select-none items-center justify-between rounded border px-4 py-2 text-sm transition-colors duration-700',
        bgPressed ? 'bg-primary-50 text-primary-500 transition-none' : 'bg-canvas-50 text-ink-500',
        'disabled:h-9 disabled:animate-pulse',
        linkBoxClassName,
      )}
      disabled={!url}
      onClick={onClick}
    >
      <div className={'select-all truncate'}>{displayUrl}</div>
      {url && (
        <div className={linkButtonClassName}>
          {!iconPressed ? <DuplicateIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
        </div>
      )}
    </button>
  )
}

export function SimpleCopyTextButton(props: {
  text: string
  eventTrackingName: string // was type ShareEventName — why??
  tooltip?: string
  className?: string
}) {
  const {text, eventTrackingName, className, tooltip} = props
  const t = useT()

  const onClick = () => {
    if (!text) return

    copyToClipboard(text)
    toast.success(t('copy_link_button.link_copied', 'Link copied!'))
    track(eventTrackingName, {text})
  }

  return (
    <IconButton onClick={onClick} className={className} disabled={!text}>
      <Tooltip
        text={tooltip ?? t('copy_link_button.copy_link', 'Copy link')}
        noTap
        placement="bottom"
      >
        <ClipboardCopyIcon className={'h-5'} aria-hidden="true" />
      </Tooltip>
    </IconButton>
  )
}
