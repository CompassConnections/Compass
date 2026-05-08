import {convertGender, Gender} from 'common/gender'
import {Profile} from 'common/profiles/profile'
import {capitalize} from 'lodash'
import {Calendar} from 'lucide-react'
import {MdHeight} from 'react-icons/md'
import {IconWithInfo} from 'web/components/icons'
import {Row} from 'web/components/layout/row'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {useT} from 'web/lib/locale'

import GenderIcon from '../gender-icon'
import {formatProfileValue} from '../profile-about'
import {ProfileLocation} from './profile-location'

export default function ProfilePrimaryInfo(props: {profile: Profile; short?: boolean}) {
  const {profile, short = false} = props
  const t = useT()
  const {measurementSystem} = useMeasurementSystem()
  return (
    <Row
      className="text-ink-500 gap-4 flex-wrap"
      data-testid="profile-gender-location-height-inches"
      style={{fontSize: '13.5px', gap: '6px 18px'}}
    >
      <ProfileLocation profile={profile} />
      {profile.age && (
        <IconWithInfo
          text={t('profile.header.age', '{age} years old', {age: profile.age})}
          icon={<Calendar className="text-ink-300" style={{width: '14px', height: '14px'}} />}
        />
      )}
      {!short && profile.height_in_inches != null && (
        <IconWithInfo
          text={formatProfileValue('height_in_inches', profile.height_in_inches, measurementSystem)}
          icon={<MdHeight className="text-ink-300" style={{width: '14px', height: '14px'}} />}
        />
      )}
      {!short && profile.gender && (
        <IconWithInfo
          text={capitalize(
            t(`profile.gender.${profile.gender}`, convertGender(profile.gender as Gender)),
          )}
          icon={
            <GenderIcon
              gender={profile.gender as Gender}
              className="text-ink-300"
              // style={{width: '14px', height: '14px'}}
            />
          }
        />
      )}
    </Row>
  )
}
