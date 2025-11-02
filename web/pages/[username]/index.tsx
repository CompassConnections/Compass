import {useEffect, useState} from 'react'
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
import {GetStaticPropsContext} from 'next'
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import Custom404 from '../404'
import {sleep} from "common/util/time";
import {isNativeMobile} from "web/lib/util/webview";
import {getPixelHeight} from "web/lib/util/css";

async function getUser(username: string) {
  const user = await getUserForStaticProps(db, username)
  return user
}

async function getProfile(userId: string) {
  let profile
  let i = 0
  while (!profile) {
    profile = await getProfileRow(userId, db)
    if (i > 0) await sleep(500)
    i++
    if (i >= 8) {
      break
    }
  }
  console.debug(`Profile loaded after ${i} tries`)
  return profile;
}

// getServerSideProps is a Next.js function that can be used to fetch data and render the contents of a page at request time.
// export async function getServerSideProps(context: any) {
//   if (!isNativeMobile()) {
//     // Not mobile → let SSG handle it
//     return {notFound: true};
//   }
//
//   // Mobile path: server-side fetch
//   const username = context.params.username;
//   const user = await getUser(username);
//
//   if (!user) {
//     return {props: {notFoundCustomText: 'User not found'}};
//   }
//
//   const profile = await getProfile(user.id);
//
//   console.log('getServerSideProps', {user, profile, username})
//
//   return {props: {user, profile, username}};
// }

// SSG: static site generation
// Next.js will pre-render this page at build time using the props returned by getStaticProps
export const getStaticProps = async (props: GetStaticPropsContext<{
  username: string
}>) => {
  const {username} = props.params!

  console.log('Starting getStaticProps in /[username]')

  const user = await getUser(username)

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
        username,
      },
      revalidate: 15,
    }
  }

  const profile = await getProfile(user.id)

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

// Runs at build time for SSG (native mobile), or at runtime for ISR fallback in web
export const getStaticPaths = () => {
  console.log('Starting getStaticPaths in /[username]', isNativeMobile())
  return {paths: [], fallback: 'blocking'}
}

type UserPageProps = Partial<ActiveUserPageProps> & {
  username: string // to override Partial’s optional
  notFoundCustomText?: string
}

type ActiveUserPageProps = {
  username: string
  user: User
  profile: ProfileRow
}

export default function UserPage(props: UserPageProps) {
  // console.log('Starting UserPage in /[username]')

  useEffect(() => {
    console.log('safe-area-inset-bottom:', getPixelHeight('safe-area-inset-bottom'))
    console.log('safe-area-inset-top:', getPixelHeight('safe-area-inset-top'))
  }, []);

  const nativeMobile = isNativeMobile()
  const router = useRouter()
  const username = (nativeMobile ? router.query.username : props.username) as string
  const [user, setUser] = useState<User | undefined>(props.user)
  const [profile, setProfile] = useState<ProfileRow | undefined>(props.profile)
  const [notFoundCustomText, setNotFoundCustomText] = useState(props.notFoundCustomText)
  const [loading, setLoading] = useState(nativeMobile)

  console.log('UserPage state:', {username, user, profile, notFoundCustomText, loading, nativeMobile})

  useEffect(() => {
    if (nativeMobile) {
      // Mobile/WebView scenario: fetch profile dynamically
      async function load() {
        setLoading(true)
        const fetchedUser = await getUser(username)
        if (!fetchedUser) return
        if (fetchedUser.username !== username) {
          console.debug('Found a case-insensitive match for native mobile')
          await router.push(`/${fetchedUser.username}`)
        }
        setUser(fetchedUser)
        console.debug('fetched user for native mobile:', fetchedUser)
        const fetchedProfile = await getProfile(fetchedUser.id)
        if (!fetchedProfile) {
          setNotFoundCustomText(`${username} hasn't created a profile yet.`)
        } else {
          setProfile(fetchedProfile)
          console.debug('fetched profile for native mobile:', fetchedProfile)
        }
        setLoading(false)
      }

      load()
    }
    // On web, initialProfile from SSR/ISR is already loaded
  }, [username, nativeMobile]);

  if (loading) {
    return <PageBase
      trackPageView={'user page'}
    >
      <CompassLoadingIndicator/>
    </PageBase>
  }

  if (notFoundCustomText) {
    return <Custom404 customText={notFoundCustomText}/>
  }

  if (!user) {
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

  if (user.isBannedFromPosting) {
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

  if (!profile) {
    return <PageBase
      trackPageView={'user page'}
      className={'relative p-2 sm:pt-0'}
    >
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          This user hasn't created a profile yet.
        </div>
      </Col>
    </PageBase>
  }

  return <UserPageInner
    user={user}
    username={username}
    profile={profile}
  />
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
  useTracking('view profile', {username: user?.username})

  const [staticProfile] = useState(
    props.profile && user ? {...props.profile, user: user} : null
  )
  const {profile: clientProfile, refreshProfile} = useProfileByUser(user)
  // Show the previous profile while loading another one
  const profile = clientProfile ?? staticProfile
  // console.debug('profile:', user?.username, profile, clientProfile, staticProfile)

  if (!isCurrentUser && profile?.disabled) {
    return <PageBase
      trackPageView={'user page'}
      className={'relative p-2 sm:pt-0'}
    >
      <Col className="items-center justify-center h-full">
        <div className="text-xl font-semibold text-center mt-8">
          The user disabled their profile.
        </div>
      </Col>
    </PageBase>
  }

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
