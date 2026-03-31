import * as Sentry from '@sentry/node'
import {APIError} from 'common/api/utils'
import {debug} from 'common/logger'
import {Profile, ProfileWithoutUser} from 'common/profiles/profile'
import {BaseUser, User} from 'common/user'
import {filterDefined} from 'common/util/array'
import {removeUndefinedProps} from 'common/util/object'
import Router from 'next/router'
import {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import {BackButton} from 'web/components/back-button'
import {Col} from 'web/components/layout/col'
import {OptionalProfileUserForm} from 'web/components/optional-profile-form'
import {PageBase} from 'web/components/page-base'
import {RequiredProfileUserForm} from 'web/components/required-profile-form'
import {SEO} from 'web/components/SEO'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useProfileByUser} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {api, updateProfile, updateUser} from 'web/lib/api'
import {useT} from 'web/lib/locale'

export default function ProfilePage() {
  const user = useUser()
  const {profile} = useProfileByUser(user ?? undefined)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (user === null || profile === null) {
      Router.replace('/')
    }
  }, [user])

  useEffect(() => {
    if (!user || !profile) {
      const timer = setTimeout(() => {
        setShowLoading(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [user, profile])

  return user && profile ? (
    <ProfilePageInner user={user} profile={profile} />
  ) : (
    <PageBase trackPageView={'profile'}>
      <Col className="items-center">{showLoading ? <CompassLoadingIndicator /> : null}</Col>
    </PageBase>
  )
}

function ProfilePageInner(props: {user: User; profile: Profile}) {
  const {user} = props
  const t = useT()

  const [profile, setProfile] = useState<Profile>({
    ...props.profile,
    user,
  })

  const setProfileState = <K extends keyof ProfileWithoutUser>(
    key: K,
    value: ProfileWithoutUser[K] | undefined,
  ) => {
    setProfile((prevState) => ({...prevState, [key]: value}))
  }

  const [baseUser, setBaseUser] = useState<BaseUser>(user)

  const setBaseUserState = <K extends keyof BaseUser>(key: K, value: BaseUser[K] | undefined) => {
    setBaseUser((prevState) => ({...prevState, [key]: value}))
  }

  async function submitForm(finalProfile?: ProfileWithoutUser) {
    const {interests, causes, work, ...otherProfileProps} = finalProfile ?? profile
    const parsedProfile = removeUndefinedProps(otherProfileProps) as any
    debug('parsedProfile', parsedProfile)
    const promises: Promise<any>[] = filterDefined([
      updateProfile(parsedProfile),
      baseUser && updateUser({name: baseUser.name, username: baseUser.username}),
      interests && api('update-options', {table: 'interests', values: interests}),
      causes && api('update-options', {table: 'causes', values: causes}),
      work && api('update-options', {table: 'work', values: work}),
    ])
    try {
      await Promise.all(promises)
    } catch (error) {
      let message =
        'We ran into an issue saving your profile. Please try again or contact us if the issue persists.'
      if (error instanceof APIError) {
        message = `Error: ` + JSON.stringify(error.toJSON().error.details)
      }
      Sentry.captureException(error, {
        user: baseUser, // shows in the User section
        contexts: {'Error Info': {message}}, // only strings as values (not nested objects)
        extra: {parsedProfile, interests, causes, work}, // for the rest (nested, etc.)
      })
      toast.error(message)
      return
    }
    Router.push(`/${user.username}`)
  }

  return (
    <PageBase trackPageView={'profile'}>
      <SEO
        title={t('profile.seo.title', 'Profile')}
        description={t('profile.seo.description', 'Your Profile')}
        url={`/profile`}
      />
      <Col className="items-center">
        <BackButton className="-ml-2 mb-2 self-start" />
        <Col className={'w-full px-6 py-4'}>
          <RequiredProfileUserForm
            data={baseUser}
            setData={setBaseUserState}
            profileCreatedAlready
          />
          <div className={'h-4'} />
          <OptionalProfileUserForm
            profile={profile}
            setProfile={setProfileState}
            user={baseUser}
            buttonLabel={t('profile.save', 'Save')}
            onSubmit={submitForm}
          />
        </Col>
      </Col>
    </PageBase>
  )
}
