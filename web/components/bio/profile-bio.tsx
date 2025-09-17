import { Profile } from 'common/love/profile'
import { useState } from 'react'
import { Col } from 'web/components/layout/col'
import { Subtitle } from '../widgets/profile-subtitle'
import { BioBlock } from './profile-bio-block'

export function ProfileBio(props: {
  isCurrentUser: boolean
  profile: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
}) {
  const { isCurrentUser, profile, refreshProfile, fromProfilePage } = props
  const [edit, setEdit] = useState(false)

  if (!isCurrentUser && !profile.bio) return null
  if (fromProfilePage && !profile.bio) return null

  return (
    <Col>
      <Subtitle className="mb-4">About Me</Subtitle>
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
