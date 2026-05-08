import {getGoogleMapsUrl, getLocationText} from 'common/geodb'
import {Profile} from 'common/profiles/profile'
import React from 'react'
import {IoLocationOutline} from 'react-icons/io5'
import {IconWithInfo} from 'web/components/icons'
import {CustomLink} from 'web/components/links'

export function ProfileLocation(props: {profile: Profile; prefix?: string}) {
  const {profile, prefix} = props

  const text = getLocationText(profile, prefix)

  if (!text) {
    return null
  }

  return (
    <IconWithInfo
      icon={<IoLocationOutline className="text-ink-300" style={{width: '14px', height: '14px'}} />}
    >
      <CustomLink href={getGoogleMapsUrl(text)} className={'hover:text-primary-500'}>
        {text}
      </CustomLink>
    </IconWithInfo>
  )
}
