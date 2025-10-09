import {LovePage} from 'web/components/love-page'
import {Col} from 'web/components/layout/col'
import {useUser} from 'web/hooks/use-user'
import {LoggedOutHome} from "web/components/home/home";
import {ProfilesHome} from "web/components/profiles/profiles-home";


export default function ProfilesPage() {
  const user = useUser();
  console.debug('user:', user)

  return (
    <LovePage trackPageView={'user profiles'}>
      <Col className="items-center">
        <Col className={'w-full rounded px-3 py-4 sm:px-6'}>
          {user ? <ProfilesHome/> : <LoggedOutHome/>}
        </Col>
      </Col>
    </LovePage>
  )
}
