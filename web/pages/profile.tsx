import {Profile, ProfileWithoutUser} from 'common/profiles/profile'
import {User} from 'common/user'
import {OptionalProfileUserForm} from 'web/components/optional-profile-form'
import {RequiredProfileUserForm} from 'web/components/required-profile-form'
import {useProfileByUser} from 'web/hooks/use-profile'
import Router from 'next/router'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {PageBase} from "web/components/page-base";
import {SEO} from "web/components/SEO";
import {useT} from 'web/lib/locale'

export default function ProfilePage() {
  const user = useUser()
  const {profile} = useProfileByUser(user ?? undefined)

  useEffect(() => {
    if (user === null || profile === null) {
      Router.replace('/')
    }
  }, [user])

  return user && profile && <ProfilePageInner user={user} profile={profile}/>
}

function ProfilePageInner(props: { user: User; profile: Profile }) {
  const {user} = props
  const t = useT()

  const [profile, setProfile] = useState<Profile>({
    ...props.profile,
    user,
  })

  const setProfileState = <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K] | undefined) => {
    setProfile((prevState) => ({...prevState, [key]: value}))
  }

  const [displayName, setDisplayName] = useState(user.name)
  const [username, setUsername] = useState(user.username)

  return (
    <PageBase trackPageView={'profile'}>
      <SEO
        title={t('profile.seo.title','Profile')}
        description={t('profile.seo.description','Your Profile')}
        url={`/profile`}
      />
      <Col className="items-center">
        <Col className={'w-full px-6 py-4'}>
          <RequiredProfileUserForm
            user={user}
            setProfile={setProfileState}
            profile={profile}
            profileCreatedAlready={true}
            isSubmitting={false}
            setEditUsername={setUsername}
            setEditDisplayName={setDisplayName}
          />
          <div className={'h-4'}/>
          <OptionalProfileUserForm
            profile={profile}
            user={user}
            setProfile={setProfileState}
            buttonLabel={t('profile.save','Save')}
            onSubmit={async () => {
              api('me/update', {
                name: displayName === user.name ? undefined : displayName,
                username: username === user.username ? undefined : username,
              })
            }}
          />
        </Col>
      </Col>
    </PageBase>
  )
}
