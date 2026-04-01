import '../styles/globals.css'
import 'web/lib/dayjs'

import {App} from '@capacitor/app'
import {Capacitor} from '@capacitor/core'
import {Keyboard} from '@capacitor/keyboard'
import {StatusBar} from '@capacitor/status-bar'
import clsx from 'clsx'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {IS_VERCEL} from 'common/hosting/constants'
import {debug} from 'common/logger'
import type {AppProps} from 'next/app'
import {Major_Mono_Display} from 'next/font/google'
import Head from 'next/head'
import {useRouter} from 'next/navigation'
import {Router} from 'next/router'
import posthog from 'posthog-js'
import {PostHogProvider} from 'posthog-js/react'
import {useEffect, useState} from 'react'
import {AuthProvider, AuthUser} from 'web/components/auth-context'
import {ErrorBoundary} from 'web/components/error-boundary'
import {LiveRegionProvider} from 'web/components/live-region'
import {ChoicesProvider} from 'web/hooks/use-choices'
import {useFontPreferenceManager} from 'web/hooks/use-font-preference'
import {useHasLoaded} from 'web/hooks/use-has-loaded'
import {HiddenProfilesProvider} from 'web/hooks/use-hidden-profiles'
import {PinnedQuestionIdsProvider} from 'web/hooks/use-pinned-question-ids'
import {updateStatusBar} from 'web/hooks/use-theme'
import {updateBackendLocale} from 'web/lib/api'
import {DAYJS_LOCALE_IMPORTS, registerDatePickerLocale} from 'web/lib/dayjs'
import {I18nContext} from 'web/lib/locale'
import {getLocale, resetCachedLocale} from 'web/lib/locale-cookie'
import {initTracking} from 'web/lib/service/analytics'
import AndroidPush from 'web/lib/service/android-push'
import WebPush from 'web/lib/service/web-push'
import {isAndroidApp} from 'web/lib/util/webview'

if (Capacitor.isNativePlatform()) {
  // Only runs on iOS/Android native
  // Note sure it's doing anything, though. Need to check
  StatusBar.setOverlaysWebView({overlay: false}).catch(console.warn)

  App.addListener('backButton', () => {
    window.dispatchEvent(new CustomEvent('appBackButton'))
  })

  // Remove live update as the free plan is very limited (100 live updates per year). Do releases on Play Store instead.
  // App.addListener("resume", async () => {
  //   const newChannelName = 'default'
  //   try {
  //     await LiveUpdate.setChannel({channel: newChannelName})
  //     console.log(`Device channel set to: ${newChannelName}`)
  //   } catch (error) {
  //     console.error('Failed to set channel', error)
  //   }
  //   const {nextBundleId} = await LiveUpdate.sync()
  //   if (nextBundleId) {
  //     // Ask the user if they want to apply the update immediately
  //     const shouldReload = confirm("A new update is available. Would you like to install it?")
  //     if (shouldReload) {
  //       await LiveUpdate.reload()
  //     }
  //   }
  // })
}

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

function printBuildInfo() {
  if (IS_VERCEL) {
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
type PageProps = {auth?: AuthUser}

function MyApp(props: AppProps<PageProps>) {
  const {Component, pageProps} = props
  useEffect(printBuildInfo, [])
  useHasLoaded()
  useFontPreferenceManager()
  const router = useRouter()

  const [locale, setLocaleState] = useState<string>(getLocale())
  // console.log('_app locale', locale)
  const setLocale = (newLocale: string) => {
    debug('setLocale', newLocale)
    document.cookie = `lang=${newLocale}; path=/; max-age=31536000`
    setLocaleState(newLocale)
    resetCachedLocale()
    DAYJS_LOCALE_IMPORTS[newLocale]?.()
    registerDatePickerLocale(newLocale)
    updateBackendLocale(newLocale)
  }

  useEffect(() => {
    debug('isAndroidWebView app:', isAndroidApp())
    if (!Capacitor.isNativePlatform()) return
    const onShow = () => document.body.classList.add('keyboard-open')
    const onHide = () => document.body.classList.remove('keyboard-open')

    Keyboard.addListener('keyboardWillShow', onShow)
    Keyboard.addListener('keyboardWillHide', onHide)

    return () => {
      Keyboard.removeAllListeners()
    }
  }, [])

  useEffect(() => {
    updateStatusBar()
  }, [])

  useEffect(() => {
    initTracking()

    const handleRouteChange = () => posthog?.capture('$pageview')
    Router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    const handleBack = () => {
      router.back()
    }

    window.addEventListener('appBackButton', handleBack)
    return () => window.removeEventListener('appBackButton', handleBack)
  }, [router])

  useEffect(() => {
    const bridgeRedirect = (payload: any) => {
      debug('bridgeRedirect', payload)
      const {endpoint} = payload
      router.push(endpoint)
    }
    // Expose globally for native bridge
    ;(window as any).bridgeRedirect = bridgeRedirect
  }, [])

  const title = 'Compass'
  const description = 'The platform for intentional connections'

  return (
    <>
      <Head>
        <title>{title}</title>

        <meta property="og:title" name="twitter:title" content={title} key="title" />
        <meta name="description" content={description} key="description1" />
        <meta
          property="og:description"
          name="twitter:description"
          content={description}
          key="description2"
        />
        <meta property="og:url" content={DEPLOYED_WEB_URL} key="url" />
        <meta property="og:site_name" content="Compass" />
        <meta name="twitter:card" content="summary" key="card" />
        {/*<meta name="twitter:site" content="@compassmeet"/>*/}
        <meta name="twitter:image" content={'/icons/icon-192x192.png'} key="image2" />
        <meta property="og:image" content={'/icons/icon-192x192.png'} key="image1" />
        <meta property="og:image:type" content="image/png" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1,maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <PostHogProvider client={posthog}>
        <LiveRegionProvider>
          <div
            className={clsx(
              'contents font-normal',
              logoFont.variable,
              // mainFont.variable
            )}
          >
            <I18nContext.Provider value={{locale, setLocale}}>
              <ErrorBoundary>
                <AuthProvider serverUser={pageProps.auth}>
                  <ChoicesProvider>
                    <PinnedQuestionIdsProvider>
                      <HiddenProfilesProvider>
                        <WebPush />
                        <AndroidPush />
                        <Component {...pageProps} />
                      </HiddenProfilesProvider>
                    </PinnedQuestionIdsProvider>
                  </ChoicesProvider>
                </AuthProvider>
              </ErrorBoundary>
            </I18nContext.Provider>
            {/* Workaround for https://github.com/tailwindlabs/headlessui/discussions/666, to allow font CSS variable */}
            <div id="headlessui-portal-root">
              <div />
            </div>
          </div>
        </LiveRegionProvider>
      </PostHogProvider>
    </>
  )
}

export default MyApp
