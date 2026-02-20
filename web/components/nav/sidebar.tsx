import {LoginIcon, LogoutIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import {ANDROID_APP_URL} from 'common/constants'
import {buildArray} from 'common/util/array'
import Image from 'next/image'
import Router, {useRouter} from 'next/router'
import {Button, ColorType, SizeType} from 'web/components/buttons/button'
import {LanguagePicker} from 'web/components/language/language-picker'
import {useProfile} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {firebaseLogout} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {withTracking} from 'web/lib/service/analytics'
import {signupRedirect} from 'web/lib/util/signup'
import {isAndroidApp} from 'web/lib/util/webview'

import SiteLogo from '../site-logo'
import {ProfileSummary} from './profile-summary'
import {Item, SidebarItem} from './sidebar-item'

export default function Sidebar(props: {
  className?: string
  isMobile?: boolean
  navigationOptions: Item[]
}) {
  const {className, isMobile} = props
  const router = useRouter()
  const currentPage = router.pathname

  const user = useUser()
  const profile = useProfile()

  const navOptions = props.navigationOptions

  const t = useT()
  const bottomNavOptions = bottomNav(!!user)

  const isAndroid = isAndroidApp()

  return (
    <nav
      aria-label="Sidebar"
      className={clsx(
        'flex flex-col h-[calc(100dvh-var(--hloss))] mb-[calc(var(--bnh))] mt-[calc(var(--tnh))]',
        className,
      )}
    >
      <SiteLogo className={''} />

      {user === undefined && <div className="h-[24px]" />}

      {user && !isMobile && <ProfileSummary user={user} className="mb-3" />}

      <div className="mb-4 flex flex-col gap-1 !overflow-y-auto">
        {navOptions.map((item) => (
          <SidebarItem key={item.key} item={item} currentPage={currentPage} />
        ))}
        {!isAndroid && (
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2FGoogle_Play_Store_badge_EN.svg.png?alt=media&token=3e0e8605-800a-422b-84d1-8ecec8af3e80"
            alt="divider"
            width={160}
            height={80}
            className="mx-auto pt-4 hover:opacity-70 cursor-pointer invert dark:invert-0"
            onClick={() => router.push(ANDROID_APP_URL)}
          />
        )}

        {user === null && <SignUpButton className="mt-4" text={t('nav.sign_up', 'Sign up')} />}
        {/*{user === null && <SignUpAsMatchmaker className="mt-2" />}*/}

        {user && profile === null && (
          <Button className="mt-2" onClick={() => router.push('signup')}>
            Create a profile
          </Button>
        )}
      </div>
      <div className="mb-[12px] mt-auto flex flex-col gap-1">
        {user === null && <LanguagePicker className={'w-fit mx-3 pr-12 mb-2'} />}
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
      icon: LoginIcon,
      href: '/signin',
    },
    loggedIn && {
      key: 'nav.sign_out',
      name: 'Sign out',
      icon: LogoutIcon,
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
      data-testid="side-bar-sign-up-button"
      color={color ?? 'gradient'}
      size={size ?? 'xl'}
      onClick={signupRedirect}
      className={clsx('w-full', className)}
    >
      {text ?? t('nav.sign_up_now', 'Sign up now')}
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
