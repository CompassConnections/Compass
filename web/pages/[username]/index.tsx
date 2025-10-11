import {useState} from 'react'
import Router from 'next/router'
import Head from 'next/head'
import {useRouter} from 'next/router'
import {LovePage} from 'web/components/love-page'
import {useProfileByUser} from 'web/hooks/use-profile'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SEO} from 'web/components/SEO'
import {useUser} from 'web/hooks/use-user'
import {useTracking} from 'web/hooks/use-tracking'
import {BackButton} from 'web/components/back-button'
import {useSaveReferral} from 'web/hooks/use-save-referral'
import {getLoveOgImageUrl} from 'common/love/og-image'
import {getProfileRow, ProfileRow} from 'common/love/profile'
import {db} from 'web/lib/supabase/db'
import {ProfileInfo} from 'web/components/profile/profile-info'
import {User} from 'common/user'
import {getUserForStaticProps} from 'common/supabase/users'
import {type GetStaticProps} from 'next'

export const getStaticProps: GetStaticProps<
  UserPageProps,
  { username: string }
> = async (props) => {
  // console.debug('Starting getStaticProps in /[username]')
  const {username} = props.params!

  const user = await getUserForStaticProps(db, username)

  if (!user) {
    return {
      notFound: true,
      props: {
        customText:
          'The profile you are looking for is not on this site... or perhaps you just mistyped?',
      },
    }
  }

  if (user.username !== username) {
    // Found a case-insensitive match, redirect to correct casing
    return {
      redirect: {
        destination: `/${user.username}`,
        permanent: true,
      },
    }
  }

  if (user.userDeleted) {
    return {
      props: {
        user: false,
        username,
      },
    }
  }

  const profile = await getProfileRow(user.id, db)
  return {
    props: {
      user,
      username,
      profile,
    },
    revalidate: 15,
  }
}

export const getStaticPaths = () => {
  return {paths: [], fallback: 'blocking'}
}

type UserPageProps = DeletedUserPageProps | ActiveUserPageProps

type DeletedUserPageProps = {
  user: false
  username: string
}
type ActiveUserPageProps = {
  user: User
  username: string
  profile: ProfileRow
}

export default function UserPage(props: UserPageProps) {
  // console.debug('Starting UserPage in /[username]')
  if (!props.user) {
    return <LovePage
      trackPageView={'user page'}
      className={'relative p-2 sm:pt-0'}
    >
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          This account has been deleted.
        </div>
      </Col>
    </LovePage>
  }

  if (props.user.isBannedFromPosting) {
    return <LovePage
      trackPageView={'user page'}
      className={'relative p-2 sm:pt-0'}
    >
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          This account has been suspended.
        </div>
      </Col>
    </LovePage>
  }

  return <UserPageInner {...props} />
}

function UserPageInner(props: ActiveUserPageProps) {
  // console.debug('Starting UserPageInner in /[username]')
  const {user, username} = props
  const router = useRouter()
  const {query} = router
  const fromSignup = query.fromSignup === 'true'

  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user?.id

  useSaveReferral(currentUser, {defaultReferrerUsername: username})
  useTracking('view love profile', {username: user?.username})

  const [staticProfile] = useState(
    props.profile && user ? {...props.profile, user: user} : null
  )
  const {profile: clientProfile, refreshProfile} = useProfileByUser(user)
  // Show previous profile while loading another one
  const profile = clientProfile ?? staticProfile
  // console.debug('profile:', user?.username, profile, clientProfile, staticProfile)

  return (
    <LovePage
      trackPageView={'user page'}
      trackPageProps={{username: user.username}}
      className={'relative p-2 sm:pt-0'}
    >
      <SEO
        title={`${user.name}`}
        description={user.bio ?? ''}
        url={`/${user.username}`}
        image={getLoveOgImageUrl(user, profile)}
      />
      {(user.isBannedFromPosting || user.userDeleted) && (
        <Head>
          <meta name="robots" content="noindex, nofollow"/>
        </Head>
      )}
      <BackButton className="-ml-2 mb-2 self-start"/>

      {currentUser !== undefined && (
        <Col className={'gap-4'}>
          {profile ? (
            <ProfileInfo
              key={profile.user_id}
              profile={profile}
              user={user}
              refreshProfile={refreshProfile}
              fromSignup={fromSignup}
            />
          ) : isCurrentUser ? (
            <Col className={'mt-4 w-full items-center'}>
              <Row>
                <Button onClick={() => Router.push('/signup')}>
                  Create a profile
                </Button>
              </Row>
            </Col>
          ) : (
            <Col className="bg-canvas-0 rounded p-4 ">
              <div>{user.name} hasn't created a profile yet.</div>
              <Button
                className="mt-4 self-start"
                onClick={() => Router.push('/')}
              >
                See more profiles
              </Button>
            </Col>
          )}
        </Col>
      )}
    </LovePage>
  )
}
