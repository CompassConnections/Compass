import {Lover, LoverRow} from 'common/love/lover'
import {Column} from 'common/supabase/utils'
import {User} from 'common/user'
import {OptionalLoveUserForm} from 'web/components/optional-lover-form'
import {RequiredLoveUserForm} from 'web/components/required-lover-form'
import {useLoverByUser} from 'web/hooks/use-lover'
import Router from 'next/router'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {LovePage} from "web/components/love-page";

export default function ProfilePage() {
  const user = useUser()
  const {lover} = useLoverByUser(user ?? undefined)

  useEffect(() => {
    if (user === null || lover === null) {
      Router.replace('/')
    }
  }, [user])

  return user && lover && <ProfilePageInner user={user} lover={lover}/>
}

function ProfilePageInner(props: { user: User; lover: Lover }) {
  const {user} = props

  const [lover, setLover] = useState<Lover>({
    ...props.lover,
    user,
  })

  const setLoverState = <K extends Column<'profiles'>>(key: K, value: LoverRow[K] | undefined) => {
    setLover((prevState) => ({...prevState, [key]: value}))
  }

  const [displayName, setDisplayName] = useState(user.name)
  const [username, setUsername] = useState(user.username)

  return (
    <LovePage trackPageView={'profile'}>
      <Col className="items-center">
        <Col className={'w-full px-6 py-4'}>
          <RequiredLoveUserForm
            user={user}
            setLover={setLoverState}
            lover={lover}
            loverCreatedAlready={true}
            isSubmitting={false}
            setEditUsername={setUsername}
            setEditDisplayName={setDisplayName}
          />
          <div className={'h-4'}/>
          <OptionalLoveUserForm
            lover={lover}
            user={user}
            setLover={setLoverState}
            buttonLabel={'Save'}
            onSubmit={async () => {
              api('me/update', {
                name: displayName === user.name ? undefined : displayName,
                username: username === user.username ? undefined : username,
              })
            }}
          />
        </Col>
      </Col>
    </LovePage>
  )
}
