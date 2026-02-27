import {getLocationText} from 'common/geodb'
import {Profile} from 'common/profiles/profile'
import {IoLocationOutline} from 'react-icons/io5'
import {IconWithInfo} from 'web/components/icons'

export function ProfileLocation(props: {profile: Profile; prefix?: string}) {
  const {profile, prefix} = props

  const text = getLocationText(profile, prefix)

  if (!text) {
    return null
  }

  return <IconWithInfo text={text} icon={<IoLocationOutline className="h-4 w-4" />} />
}
