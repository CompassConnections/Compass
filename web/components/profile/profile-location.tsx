import {Profile} from 'common/profiles/profile'
import {IoLocationOutline} from 'react-icons/io5'
import {IconWithInfo} from 'web/components/icons'

export function getLocationText(profile: Profile, prefix?: string) {
  const city = profile[`${prefix}city` as keyof Profile]
  const country = profile[`${prefix}country` as keyof Profile]
  const regionCode = profile[`${prefix}region_code` as keyof Profile]

  const stateOrCountry = country === 'United States of America' ? regionCode : country

  if (!city) {
    return null
  }

  return `${city}${stateOrCountry && ', '}${stateOrCountry}`
}

export function ProfileLocation(props: {profile: Profile; prefix?: string}) {
  const {profile, prefix = ''} = props

  const text = getLocationText(profile, prefix)

  if (!text) {
    return null
  }

  return <IconWithInfo text={text} icon={<IoLocationOutline className="h-4 w-4" />} />
}
