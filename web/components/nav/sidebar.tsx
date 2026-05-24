import {ArrowLeftOnRectangleIcon, ArrowRightOnRectangleIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {ANDROID_APP_URL} from 'common/constants'
import {buildArray} from 'common/util/array'
import Router, {useRouter} from 'next/router'
import {FaGooglePlay} from 'react-icons/fa'
import {Button, ColorType, SizeType} from 'web/components/buttons/button'
import {LanguagePicker} from 'web/components/language/language-picker'
import {useProfile} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {firebaseLogout} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {withTracking} from 'web/lib/service/analytics'
import {startSignup} from 'web/lib/util/signup'
import {isAndroidApp} from 'web/lib/util/webview'

import SiteLogo from '../site-logo'
import {ProfileSummary} from './profile-summary'
import {Item, SidebarItem} from './sidebar-item'

export default function Sidebar(props: {
  className?: string
  isMobile?: boolean
  style?: React.CSSProperties
  navigationOptions: Item[]
}) {
  const {className, isMobile, style} = props
  const router = useRouter()
  const currentPage = router.asPath
  // console.log(router)

  const user = useUser()
  const profile = useProfile()

  const navOptions = props.navigationOptions

  const t = useT()
  const bottomNavOptions = bottomNav(!!user)

  const isAndroid = isAndroidApp()

  return (
    <nav
      id="main-navigation"
      aria-label="Sidebar"
      data-testid="sidebar"
      className={clsx(
        'flex flex-col h-[calc(100dvh-var(--hloss))] mb-[calc(var(--bnh))] mt-[calc(var(--tnh))]',
        className,
      )}
      style={style}
    >
      <SiteLogo className={'text-black invert'} />

      {user === undefined && <div className="h-[24px]" />}

      {user && !isMobile && (
        <>
          <div className="h-px bg-canvas-900 mb-4" />
          <ProfileSummary
            user={user}
            className="mb-3 sidebar-text hover:text-primary-700 hover:translate-x-[2px]"
            currentPage={currentPage}
          />
        </>
      )}

      <div className="h-px bg-canvas-900 mb-4" />

      <div className="mb-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navOptions.map((item) => (
          <SidebarItem key={item.key} item={item} currentPage={currentPage} />
        ))}

        {user === null && <SignUpButton className="mt-4" text={t('nav.sign_up', 'Sign up')} />}

        {user && profile === null && (
          <Button className="mt-2" onClick={() => router.push('signup')}>
            Create a profile
          </Button>
        )}
      </div>
      <div className="mb-[12px] mt-auto flex flex-col gap-1">
        <div className="h-px bg-canvas-900" />
        {!isAndroid && (
          <SidebarItem
            item={{
              key: 'nav.android_app',
              name: 'Get it on Google Play',
              icon: FaGooglePlay,
              href: ANDROID_APP_URL,
            }}
            currentPage={currentPage}
          />
        )}
        {user === null && (
          <LanguagePicker
            className={
              'w-fit mx-3 mt-2 pr-12 mb-2 bg-transparent border-canvas-900 sidebar-text hover:text-primary-600'
            }
          />
        )}
        {bottomNavOptions.map((item) => (
          <SidebarItem key={item.key} item={item} currentPage={currentPage} />
        ))}
      </div>
    </nav>
  )
}

const logout = async () => {
  // log out, and then reload the page, in case SSR wants to boot them out
  // of whatever logged-in-only area of the site they might be in
  await withTracking(firebaseLogout, 'sign out')()
  await Router.replace(Router.asPath)
}

const bottomNav = (loggedIn: boolean) =>
  buildArray<Item>(
    !loggedIn && {
      key: 'nav.sign_in',
      name: 'Sign in',
      icon: ArrowLeftOnRectangleIcon,
      href: '/signin',
    },
    loggedIn && {
      key: 'nav.sign_out',
      name: 'Sign out',
      icon: ArrowRightOnRectangleIcon,
      onClick: logout,
    },
  )

export const SignUpButton = (props: {
  text?: string
  className?: string
  color?: ColorType
  size?: SizeType
}) => {
  const {className, text, color, size} = props
  const t = useT()

  return (
    <Button
      color={color ?? 'gradient'}
      size={size ?? 'xl'}
      onClick={startSignup}
      className={clsx('w-full', className)}
    >
      {text ?? t('home.sign_up', 'Sign up')}
    </Button>
  )
}

// export const SignUpAsMatchmaker = (props: {
//   className?: string
//   size?: SizeType
// }) => {
//   const {className, size} = props
//
//   return (
//     <Button
//       color={'indigo-outline'}
//       size={size ?? 'md'}
//       onClick={firebaseLogin}
//       className={clsx('w-full', className)}
//     >
//       Sign up as matchmaker
//     </Button>
//   )
// }
