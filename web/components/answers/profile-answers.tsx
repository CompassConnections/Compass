import {User} from 'common/user'
import {Col} from 'web/components/layout/col'
import {CompatibilityQuestionsDisplay} from './compatibility-questions-display'
import {Profile} from 'common/love/profile'

export function ProfileAnswers(props: {
  isCurrentUser: boolean
  user: User
  profile: Profile
  fromSignup?: boolean
  fromProfilePage?: Profile
}) {
  const {isCurrentUser, user, fromSignup, fromProfilePage, profile} = props

  return (
    <Col className={'mt-2 gap-5'}>
      <CompatibilityQuestionsDisplay
        isCurrentUser={isCurrentUser}
        user={user}
        profile={profile}
        fromSignup={fromSignup}
        fromProfilePage={fromProfilePage}
      />
      {/*<FreeResponseDisplay*/}
      {/*  isCurrentUser={isCurrentUser}*/}
      {/*  user={user}*/}
      {/*  fromProfilePage={fromProfilePage}*/}
      {/*/>*/}
    </Col>
  )
}
