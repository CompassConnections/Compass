import { User } from 'common/user'
import { Col } from 'web/components/layout/col'
import { CompatibilityQuestionsDisplay } from './compatibility-questions-display'
import { FreeResponseDisplay } from './free-response-display'
import { Profile } from 'common/love/lover'

export function ProfileAnswers(props: {
  isCurrentUser: boolean
  user: User
  lover: Profile
  fromSignup?: boolean
  fromProfilePage?: Profile
}) {
  const { isCurrentUser, user, fromSignup, fromProfilePage, lover } = props

  return (
    <Col className={'mt-2 gap-5'}>
      <CompatibilityQuestionsDisplay
        isCurrentUser={isCurrentUser}
        user={user}
        lover={lover}
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
