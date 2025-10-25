import {useState} from 'react'
import {useRouter} from 'next/router'
import Head from 'next/head'
import {PageBase} from 'web/components/page-base'
import {useProfileByUser} from 'web/hooks/use-profile'
import {Col} from 'web/components/layout/col'
import {SEO} from 'web/components/SEO'
import {useUser} from 'web/hooks/use-user'
import {useTracking} from 'web/hooks/use-tracking'
import {BackButton} from 'web/components/back-button'
import {useSaveReferral} from 'web/hooks/use-save-referral'
import {getProfileOgImageUrl} from 'common/profiles/og-image'
import {getProfileRow, ProfileRow} from 'common/profiles/profile'
import {db} from 'web/lib/supabase/db'
import {ProfileInfo} from 'web/components/profile/profile-info'
import {User} from 'common/user'
import {getUserForStaticProps} from 'common/supabase/users'
import {type GetStaticProps} from 'next'
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import Custom404 from '../404'

export const getStaticProps: GetStaticProps<
  UserPageProps,
  { username: string }
> = async (props) => {
  // console.log('Starting getStaticProps in /[username]')
  const {username} = props.params!

  const user = await getUserForStaticProps(db, username)

  console.debug('getStaticProps', {user})

  if (!user) {
    console.debug('No user')
    return {
      props: {
        notFoundCustomText:
          'The profile you are looking for is not on this site... or perhaps you just mistyped?',
      },
      revalidate: 15,
    }
  }

  if (user.username !== username) {
    console.debug('Found a case-insensitive match')
    // Found a case-insensitive match, redirect to correct casing
    return {
      redirect: {
        destination: `/${user.username}`,
        permanent: true,
      },
    }
  }

  if (user.userDeleted) {
    console.debug('User deleted')
    return {
      props: {
        user: false,
        username,
      },
      revalidate: 15,
    }
  }

  const profile = await getProfileRow(user.id, db)
  if (!profile) {
    console.debug('No profile', `${user.username} hasn't created a profile yet.`)
    return {
      props: {
        notFoundCustomText: `${user.username} hasn't created a profile yet.`,
      },
      revalidate: 15,
    }
  }
  // console.debug('profile', profile)
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

type UserPageProps = DeletedUserPageProps | ActiveUserPageProps | NotFoundPageProps

type DeletedUserPageProps = {
  user: false
  username: string
}
type ActiveUserPageProps = {
  user: User
  username: string
  profile: ProfileRow
}
type NotFoundPageProps = {
  notFoundCustomText: string
}

export default function UserPage(props: UserPageProps) {
  // console.debug('Starting UserPage in /[username]')
  if ('notFoundCustomText' in props) {
    return <Custom404 customText={props.notFoundCustomText}/>
  }

  if (!props.user) {
    return <PageBase
      trackPageView={'user page'}
      className={'relative p-2 sm:pt-0'}
    >
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          This account has been deleted.
        </div>
      </Col>
    </PageBase>
  }

  if (props.user.isBannedFromPosting) {
    return <PageBase
      trackPageView={'user page'}
      className={'relative p-2 sm:pt-0'}
    >
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          This account has been suspended.
        </div>
      </Col>
    </PageBase>
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
  // const isCurrentUser = currentUser?.id === user?.id

  useSaveReferral(currentUser, {defaultReferrerUsername: username})
  useTracking('viewprofile', {username: user?.username})

  const [staticProfile] = useState(
    props.profile && user ? {...props.profile, user: user} : null
  )
  const {profile: clientProfile, refreshProfile} = useProfileByUser(user)
  // Show previous profile while loading another one
  const profile = clientProfile ?? staticProfile
  // console.debug('profile:', user?.username, profile, clientProfile, staticProfile)

  return (
    <PageBase
      trackPageView={'user page'}
      trackPageProps={{username: user.username}}
      className={'relative p-2 sm:pt-0'}
    >
      <SEO
        title={`${user.name}`}
        description={user.bio ?? ''}
        url={`/${user.username}`}
        image={getProfileOgImageUrl(user, profile)}
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
          ) : (
            <CompassLoadingIndicator/>
          )}
        </Col>
      )}
    </PageBase>
  )
}
