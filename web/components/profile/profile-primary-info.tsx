import { ReactNode } from 'react'
import { capitalize } from 'lodash'
import { IoLocationOutline } from 'react-icons/io5'
import { MdHeight } from 'react-icons/md'

import { Row } from 'web/components/layout/row'
import GenderIcon from '../gender-icon'
import { Gender, convertGender } from 'common/gender'
import { formatProfileValue } from '../profile-about'
import { Profile } from 'common/love/profile'

export default function ProfilePrimaryInfo(props: { profile: Profile }) {
  const { profile } = props
  const stateOrCountry =
    profile.country === 'United States of America'
      ? profile.region_code
      : profile.country
  return (
    <Row className="text-ink-700 gap-4 text-sm">
      <IconWithInfo
        text={`${profile.city ?? ''}, ${stateOrCountry ?? ''}`}
        icon={<IoLocationOutline className="h-4 w-4" />}
      />
      <IconWithInfo
        text={capitalize(convertGender(profile.gender as Gender))}
        icon={
          <GenderIcon gender={profile.gender as Gender} className="h-4 w-4 " />
        }
      />
      {profile.height_in_inches != null && (
        <IconWithInfo
          text={formatProfileValue('height_in_inches', profile.height_in_inches)}
          icon={<MdHeight className="h-4 w-4 " />}
        />
      )}
    </Row>
  )
}

function IconWithInfo(props: { text: string; icon: ReactNode }) {
  const { text, icon } = props
  return (
    <Row className="items-center gap-0.5">
      <div className="text-ink-500">{icon}</div>
      {text}
    </Row>
  )
}
