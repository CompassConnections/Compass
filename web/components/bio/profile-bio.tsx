import {Profile} from 'common/profiles/profile'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'

import {BioBlock} from './profile-bio-block'

export function ProfileBio(props: {
  isCurrentUser: boolean
  profile: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
}) {
  const {isCurrentUser, profile, refreshProfile, fromProfilePage} = props
  const [edit, setEdit] = useState(false)

  if (!isCurrentUser && !profile.bio) return null
  if (fromProfilePage && !profile.bio) return null

  return (
    <Col>
      <BioBlock
        isCurrentUser={isCurrentUser}
        profile={profile}
        refreshProfile={refreshProfile}
        edit={edit || (isCurrentUser && !profile.bio)}
        setEdit={setEdit}
      />
    </Col>
  )
}
