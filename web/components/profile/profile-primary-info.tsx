import {convertGender, Gender} from 'common/gender'
import {Profile} from 'common/profiles/profile'
import {capitalize} from 'lodash'
import {ReactNode} from 'react'
import {IoLocationOutline} from 'react-icons/io5'
import {MdHeight} from 'react-icons/md'
import {Row} from 'web/components/layout/row'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {useT} from 'web/lib/locale'

import GenderIcon from '../gender-icon'
import {formatProfileValue} from '../profile-about'

export default function ProfilePrimaryInfo(props: {profile: Profile}) {
  const {profile} = props
  const t = useT()
  const {measurementSystem} = useMeasurementSystem()
  const stateOrCountry =
    profile.country === 'United States of America' ? profile.region_code : profile.country
  return (
    <Row className="text-ink-700 gap-4 text-sm" data-testid="profile-gender-location-height-inches">
      {profile.city && (
        <IconWithInfo
          text={`${profile.city ?? ''}, ${stateOrCountry ?? ''}`}
          icon={<IoLocationOutline className="h-4 w-4" />}
        />
      )}
      {profile.gender && (
        <IconWithInfo
          text={capitalize(
            t(`profile.gender.${profile.gender}`, convertGender(profile.gender as Gender)),
          )}
          icon={<GenderIcon gender={profile.gender as Gender} className="h-4 w-4 " />}
        />
      )}
      {profile.height_in_inches != null && (
        <IconWithInfo
          text={formatProfileValue('height_in_inches', profile.height_in_inches, measurementSystem)}
          icon={<MdHeight className="h-4 w-4 " />}
        />
      )}
    </Row>
  )
}

function IconWithInfo(props: {text: string; icon: ReactNode}) {
  const {text, icon} = props
  return (
    <Row className="items-center gap-0.5">
      <div className="text-ink-500">{icon}</div>
      {text}
    </Row>
  )
}
