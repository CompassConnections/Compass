import type {AppProps} from 'next/app'
import Head from 'next/head'
import {useEffect} from 'react'
import {Router} from 'next/router'
import posthog from 'posthog-js'
import {PostHogProvider} from 'posthog-js/react'
import {AuthProvider, AuthUser} from 'web/components/auth-context'
import {useHasLoaded} from 'web/hooks/use-has-loaded'
import '../styles/globals.css'
import {Major_Mono_Display} from 'next/font/google'
import clsx from 'clsx'
import {initTracking} from 'web/lib/service/analytics'
import WebPush from "web/lib/service/web-push";
import AndroidPush from "web/lib/service/android-push";
import {GoogleAuthProvider, signInWithCredential} from "firebase/auth";
import {auth} from "web/lib/firebase/users";

// See https://nextjs.org/docs/basic-features/font-optimization#google-fonts
// and if you add a font, you must add it to tailwind config as well for it to work.

function firstLine(msg: string) {
  return msg.replace(/\r?\n[\s\S]*/, '')
}

const logoFont = Major_Mono_Display({
  weight: ['400'],
  variable: '--font-logo',
  subsets: ['latin'],
})

// const mainFont = Figtree({
//   weight: ['300', '400', '500', '600', '700'],
//   variable: '--font-main',
//   subsets: ['latin'],
// })

function printBuildInfo() {
  // These are undefined if e.g. dev server
  if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
    const env = process.env.NEXT_PUBLIC_VERCEL_ENV
    const msg = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE
    const owner = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER
    const repo = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG
    const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    const url = `https://github.com/${owner}/${repo}/commit/${sha}`
    console.info(`Build: ${env} / ${firstLine(msg || '???')} / ${url}`)
  }
}

// specially treated props that may be present in the server/static props
type PageProps = { auth?: AuthUser }

function MyApp({Component, pageProps}: AppProps<PageProps>) {
  useEffect(printBuildInfo, [])
  useHasLoaded()

  useEffect(() => {
    initTracking()

    const handleRouteChange = () => posthog?.capture('$pageview')
    Router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    async function oauthRedirect(event: any) {
      const {idToken, accessToken} = event
      // Create a Firebase credential from the Google tokens
      const credential = GoogleAuthProvider.credential(idToken, accessToken)

      // Sign in with Firebase using the credential
      const userCredential = await signInWithCredential(auth, credential)

      console.log('Firebase user:', userCredential.user)

      return userCredential
    }

    // Expose globally for native bridge
    (window as any).oauthRedirect = oauthRedirect;
  }, []);

  const title = 'Compass'
  const description = 'The platform for intentional connections'

  return (
    <>
      <Head>
        <title>{title}</title>

        <meta
          property="og:title"
          name="twitter:title"
          content={title}
          key="title"
        />
        <meta name="description" content={description} key="description1"/>
        <meta
          property="og:description"
          name="twitter:description"
          content={description}
          key="description2"
        />
        <meta property="og:url" content="https://compassmeet.com" key="url"/>
        <meta property="og:site_name" content="Compass"/>
        <meta name="twitter:card" content="summary" key="card"/>
        {/*<meta name="twitter:site" content="@compassmeet"/>*/}
        <meta
          name="twitter:image"
          content="https://www.compassmeet.com/favicon.ico"
          key="image2"
        />
        <meta
          property="og:image"
          content="https://www.compassmeet.com/favicon.ico"
          key="image1"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1,maximum-scale=1, user-scalable=no"
        />
      </Head>
      <PostHogProvider client={posthog}>
        <div
          className={clsx(
            'contents font-normal',
            logoFont.variable,
            // mainFont.variable
          )}
        >
          <AuthProvider serverUser={pageProps.auth}>
            <WebPush/>
            <AndroidPush/>
            <Component {...pageProps} />
          </AuthProvider>
          {/* Workaround for https://github.com/tailwindlabs/headlessui/discussions/666, to allow font CSS variable */}
          <div id="headlessui-portal-root">
            <div/>
          </div>
        </div>
      </PostHogProvider>
      {/* TODO: Re-enable one tap setup */}
      {/* <GoogleOneTapSetup /> */}
    </>
  )
}

export default MyApp
