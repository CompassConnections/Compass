import { Profile } from 'common/love/lover'
import { useState } from 'react'
import { Col } from 'web/components/layout/col'
import { Subtitle } from '../widgets/lover-subtitle'
import { BioBlock } from './lover-bio-block'

export function ProfileBio(props: {
  isCurrentUser: boolean
  lover: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
}) {
  const { isCurrentUser, lover, refreshProfile, fromProfilePage } = props
  const [edit, setEdit] = useState(false)

  if (!isCurrentUser && !lover.bio) return null
  if (fromProfilePage && !lover.bio) return null

  return (
    <Col>
      <Subtitle className="mb-4">About Me</Subtitle>
      <BioBlock
        isCurrentUser={isCurrentUser}
        lover={lover}
        refreshProfile={refreshProfile}
        edit={edit || (isCurrentUser && !lover.bio)}
        setEdit={setEdit}
      />
    </Col>
  )
}
