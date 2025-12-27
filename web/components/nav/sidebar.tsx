import {LoginIcon, LogoutIcon,} from '@heroicons/react/outline'
import clsx from 'clsx'
import {buildArray} from 'common/util/array'
import Router, {useRouter} from 'next/router'
import {useUser} from 'web/hooks/use-user'
import {firebaseLogout} from 'web/lib/firebase/users'
import {withTracking} from 'web/lib/service/analytics'
import {ProfileSummary} from './profile-summary'
import {Item, SidebarItem} from './sidebar-item'
import SiteLogo from '../site-logo'
import {Button, ColorType, SizeType} from 'web/components/buttons/button'
import {signupRedirect} from 'web/lib/util/signup'
import {useProfile} from 'web/hooks/use-profile'
import Image from 'next/image'
import {ANDROID_APP_URL} from "common/constants";
import {isAndroidApp} from "web/lib/util/webview";
import {useT} from 'web/lib/locale'
import {LanguagePicker} from "web/components/language/language-picker";

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
  const bottomNavOptions = bottomNav(!!user, t)

  const isAndroid = isAndroidApp()

  return (
    <nav
      aria-label="Sidebar"
      className={clsx(
        'flex h-screen flex-col h-full max-h-screen overflow-y-auto safe-bottom mt-[calc(env(safe-area-inset-top))]',
        className
      )}
    >
      <SiteLogo/>

      {user === undefined && <div className="h-[56px]"/>}

      {user && !isMobile && <ProfileSummary user={user} className="mb-3"/>}

      <div className="mb-4 flex flex-col gap-1">
        {navOptions.map((item) => (
          <SidebarItem key={item.name} item={item} currentPage={currentPage}/>
        ))}
        {!isAndroid && <Image
            src="https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2FGoogle_Play_Store_badge_EN.svg.png?alt=media&token=3e0e8605-800a-422b-84d1-8ecec8af3e80"
            alt="divider"
            width={160}
            height={80}
            className="mx-auto pt-4 hover:opacity-70 cursor-pointer invert dark:invert-0"
            onClick={() => router.push(ANDROID_APP_URL)}
        />}

        {user === null && <SignUpButton className="mt-4" text={t('nav.sign_up', 'Sign up')}/>}
        {/*{user === null && <SignUpAsMatchmaker className="mt-2" />}*/}

        {user && profile === null && (
          <Button className="mt-2" onClick={() => router.push('signup')}>
            Create a profile
          </Button>
        )}
      </div>
      <div className="mb-[calc(24px+env(safe-area-inset-bottom))] mt-auto flex flex-col gap-1">
        {user === null && <LanguagePicker className={'w-fit mx-3 pr-12 mb-2'}/>}
        {bottomNavOptions.map((item) => (
          <SidebarItem key={item.name} item={item} currentPage={currentPage}/>
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

const bottomNav = (
  loggedIn: boolean,
  t: (k: string, fallback: string) => string,
) =>
  buildArray<Item>(
    !loggedIn && {name: t('nav.sign_in', 'Sign in'), icon: LoginIcon, href: '/signin'},
    loggedIn && {name: t('nav.sign_out', 'Sign out'), icon: LogoutIcon, onClick: logout}
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
