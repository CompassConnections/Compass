import {JSONContent} from '@tiptap/core'
import {RESERVED_PATHS} from 'common/envs/constants'
import {debug} from 'common/logger'
import {getProfileOgImageUrl} from 'common/profiles/og-image'
import {ProfileRow} from 'common/profiles/profile'
import {User} from 'common/user'
import {parseJsonContentToText} from 'common/util/parse'
import {GetStaticPropsContext} from 'next'
import Head from 'next/head'
import {useRouter} from 'next/router'
import {useEffect, useMemo, useState} from 'react'
import {BackButton} from 'web/components/back-button'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {ProfileInfo} from 'web/components/profile/profile-info'
import {SEO} from 'web/components/SEO'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useProfileByUser} from 'web/hooks/use-profile'
import {useSaveReferral} from 'web/hooks/use-save-referral'
import {useTracking} from 'web/hooks/use-tracking'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {safeLocalStorage} from 'web/lib/util/local'
import {getPageData} from 'web/lib/util/page-data'
import {isNativeMobile} from 'web/lib/util/webview'

import Custom404 from '../404'

async function getUserAndProfile(username: string) {
  try {
    return await api('get-user-and-profile', {username})
  } catch (e) {
    console.error('Error in getUserAndProfile:', e)
  }
  return {profile: null, user: null}
}

// getServerSideProps is a Next.js function that can be used to fetch data and render the contents of a page at request time.
// export async function getServerSideProps(context: any) {}

// SSG: static site generation
// Next.js will pre-render this page at build time using the props returned by getStaticProps
export const getStaticProps = async (
  props: GetStaticPropsContext<{
    username: string
  }>,
) => {
  const {username} = props.params!

  // Skip DB lookup entirely for known non-user routes
  // Also block file extension requests — these are never valid usernames
  if (RESERVED_PATHS.has(username.toLowerCase()) || username.includes('.')) {
    return {notFound: true}
  }

  console.log('Starting getStaticProps in /[username]', username)

  const {user, profile} = await getUserAndProfile(username)

  debug('getStaticProps', {user, profile})

  if (!user) {
    console.warn('No user found from getStaticProps:', username)
    return {
      props: {
        notFoundCustomText: null,
        username,
      },
      revalidate: 1,
    }
  }

  if (user.username !== username) {
    debug('Found a case-insensitive match', username)
    // Found a case-insensitive match, redirect to correct casing
    return {
      redirect: {
        destination: `/${user.username}`,
        permanent: true,
      },
    }
  }

  if (user.userDeleted) {
    debug('User deleted', username)
    return {
      props: {
        username,
      },
      revalidate: 15,
    }
  }

  if (!profile) {
    debug('No profile', user.username)
    return {
      props: {
        notFoundCustomText: null,
        username,
      },
      revalidate: 1,
    }
  }
  // debug('profile', profile)
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
  // console.log('Starting getStaticPaths in /[username]', isNativeMobile())
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
  const nativeMobile = isNativeMobile()
  const router = useRouter()
  const t = useT()
  const username = (props.username ?? router.query.username) as string
  const fromSignup = router?.query?.fromSignup === 'true'

  // Hydrate from localStorage if coming from registration,
  // before any null checks that would block UserPageInner
  const [fetchedProps, setFetchedProps] = useState<UserPageProps>(() => {
    if (fromSignup) {
      const fresh = safeLocalStorage?.getItem('freshSignup')
      if (fresh) {
        safeLocalStorage?.removeItem('freshSignup')
        const {user, profile} = JSON.parse(fresh)
        if (user && profile) {
          debug('Using fresh profile from signup')
          return {username: user.username, user, profile}
        }
      }
    }
    return props
  })

  const [loading, setLoading] = useState(!(fetchedProps.user && fetchedProps.profile))

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // Native mobile — fetch from remote web server (ISR)
      if (nativeMobile) {
        try {
          // console.log('Loading profile for native mobile', username)
          const _props = await getPageData(username)
          if (_props?.user && _props?.profile) {
            setFetchedProps(_props)
            setLoading(false)
            return // ✅ done
          }
        } catch (e) {
          console.error('Failed to fetch profile for native mobile', e)
        }
      }

      // ISR returned null — fetch directly from backend
      if (props.notFoundCustomText === null) {
        try {
          const {user, profile} = await getUserAndProfile(username)
          if (user && profile) {
            setFetchedProps({username, user, profile})
            setLoading(false)
            return // ✅ done
          }
        } catch (e) {
          console.error('Failed to load profile from backend', e)
        }
        // All fallbacks exhausted
        setFetchedProps({
          ...props,
          notFoundCustomText: 'profileNotFound',
        })
        setLoading(false)
        return
      }

      // Sync new SSR props on navigation
      setFetchedProps(props)
      setLoading(false)
    }

    load()
  }, [username, nativeMobile])

  debug(
    'UserPage state:',
    JSON.stringify(
      {
        username,
        fetchedProps,
        loading,
        nativeMobile,
      },
      null,
      2,
    ),
  )

  if (loading) {
    return (
      <PageBase trackPageView={'user page'}>
        <CompassLoadingIndicator />
      </PageBase>
    )
  }

  if (fetchedProps.notFoundCustomText) {
    return <Custom404 customText={fetchedProps.notFoundCustomText} />
  }

  if (!fetchedProps.user) {
    return (
      <PageBase trackPageView={'user page'} className={'relative p-2 sm:pt-0'}>
        <Col className="items-center justify-center h-full">
          <div className="text-xl font-semibold text-center mt-8">
            {t('userpage.accountDeleted', 'This account has been deleted.')}
          </div>
        </Col>
      </PageBase>
    )
  }

  if (fetchedProps.user?.isBannedFromPosting) {
    return (
      <PageBase trackPageView={'user page'} className={'relative p-2 sm:pt-0'}>
        <Col className="items-center justify-center h-full">
          <div className="text-xl font-semibold text-center mt-8">
            {t('userpage.accountSuspended', 'This account has been suspended.')}
          </div>
        </Col>
      </PageBase>
    )
  }

  if (!fetchedProps.profile) {
    return (
      <PageBase trackPageView={'user page'} className={'relative p-2 sm:pt-0'}>
        <Col className="items-center justify-center h-full">
          <div className="text-xl font-semibold text-center mt-8">
            {t('custom404.profileNotFound', 'Profile not found.')}
          </div>
        </Col>
      </PageBase>
    )
  }

  return <UserPageInner {...(fetchedProps as ActiveUserPageProps)} />
}

function UserPageInner(props: ActiveUserPageProps) {
  debug('Starting UserPageInner in /[username]', props)
  const {user, username} = props
  const router = useRouter()
  const t = useT()
  const {query} = router
  const fromSignup = query.fromSignup === 'true'

  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user?.id

  useSaveReferral(currentUser, {defaultReferrerUsername: username})
  useTracking('view profile', {username: user?.username})

  // Recalculates on every props change
  const staticProfile = useMemo(
    () => (props.profile && user ? {...props.profile, user} : null),
    [props.profile, user],
  )

  const {profile: clientProfile, refreshProfile} = useProfileByUser(user)

  // Show the previous profile while loading another one
  const profile = clientProfile ?? staticProfile

  // debug('profile:', user?.username, profile, clientProfile, staticProfile)

  if (!isCurrentUser && profile?.disabled) {
    return (
      <PageBase trackPageView={'user page'} className={'relative p-2 sm:pt-0'}>
        <Col className="items-center justify-center h-full">
          <div className="text-xl font-semibold text-center mt-8">
            {t('userpage.profileDisabled', 'The user disabled their profile.')}
          </div>
        </Col>
      </PageBase>
    )
  }

  const seoImage = getProfileOgImageUrl(user, profile)
  debug('SEO image:', seoImage)
  return (
    <PageBase
      trackPageView={'user page'}
      trackPageProps={{username: user.username}}
      className={'relative p-2 sm:pt-0'}
    >
      <SEO
        title={`${user.name}`}
        description={
          profile?.headline ||
          parseJsonContentToText(profile?.bio as JSONContent)?.slice(0, 250) ||
          `${user.name} is on Compass`
        }
        url={`/${user.username}`}
        image={seoImage}
      />
      {(user.isBannedFromPosting || user.userDeleted) && (
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
      )}
      <BackButton className="-ml-2 mb-2 self-start" />

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
            <CompassLoadingIndicator />
          )}
        </Col>
      )}
    </PageBase>
  )
}
