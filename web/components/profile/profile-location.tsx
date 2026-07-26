import clsx from 'clsx'
import {getGoogleMapsUrl, getLocationText} from 'common/geodb'
import {Profile} from 'common/profiles/profile'
import React from 'react'
import {IoLocationOutline} from 'react-icons/io5'
import {IconWithInfo} from 'web/components/icons'
import {CustomLink} from 'web/components/links'

export function ProfileLocation(props: {
  profile: Profile
  prefix?: string
  /** Drop the pin icon and let the caller size the text — used on profile cards. */
  hideIcon?: boolean
  className?: string
}) {
  const {profile, prefix, hideIcon, className} = props

  const text = getLocationText(profile, prefix)

  if (!text) {
    return null
  }

  const link = (
    <CustomLink href={getGoogleMapsUrl(text)} className={'hover:text-primary-500'}>
      {text}
    </CustomLink>
  )

  if (hideIcon) {
    return <span className={clsx('truncate', className)}>{link}</span>
  }

  return (
    <IconWithInfo
      icon={<IoLocationOutline className="text-ink-300" style={{width: '14px', height: '14px'}} />}
    >
      {link}
    </IconWithInfo>
  )
}
