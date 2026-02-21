import {convertGender, Gender} from 'common/gender'
import {Profile} from 'common/profiles/profile'
import {capitalize} from 'lodash'
import {MdHeight} from 'react-icons/md'
import {IconWithInfo} from 'web/components/icons'
import {Row} from 'web/components/layout/row'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {useT} from 'web/lib/locale'

import GenderIcon from '../gender-icon'
import {formatProfileValue} from '../profile-about'
import {ProfileLocation} from './profile-location'

export default function ProfilePrimaryInfo(props: {profile: Profile}) {
  const {profile} = props
  const t = useT()
  const {measurementSystem} = useMeasurementSystem()
  return (
    <Row className="text-ink-700 gap-4 text-sm" data-testid="profile-gender-location-height-inches">
      <ProfileLocation profile={profile} />
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
