import {ArrowLeftOnRectangleIcon, ArrowRightOnRectangleIcon} from '@heroicons/react/24/outline'
import {StarIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Router, {useRouter} from 'next/router'
import {Fragment} from 'react'
import {LuPanelLeft} from 'react-icons/lu'
import {Button, ColorType, SizeType} from 'web/components/buttons/button'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {LanguagePicker} from 'web/components/language/language-picker'
import {useAppDownload} from 'web/hooks/use-app-download'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {useProfile} from 'web/hooks/use-profile'
import {useStoreReviewUrl} from 'web/hooks/use-review-prompt'
import {useIsSignUpCtaVisible} from 'web/hooks/use-signup-cta-visible'
import {useUser} from 'web/hooks/use-user'
import {firebaseLogout} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {withTracking} from 'web/lib/service/analytics'
import {startSignup} from 'web/lib/util/signup'
import {isNativeApp} from 'web/lib/util/webview'

import SiteLogo from '../site-logo'
import {ProfileSummary} from './profile-summary'
import {NavGroups, SidebarItem} from './sidebar-item'

export default function Sidebar(props: {
  className?: string
  isMobile?: boolean
  style?: React.CSSProperties
  navigationOptions: NavGroups
}) {
  const {className, isMobile, style} = props
  const router = useRouter()
  const currentPage = router.asPath
  // console.log(router)

  const user = useUser()
  const profile = useProfile()

  const navOptions = props.navigationOptions

  const t = useT()
  const pageCtaVisible = useIsSignUpCtaVisible()
  // Already on the sign-up page, where "Join us" would only link back to itself.
  const onRegisterPage = router.pathname === '/register'

  // Desktop only: the mobile sidebar is already a slide-out drawer with its own close gesture.
  const [storedCollapsed, setCollapsed] = usePersistentLocalState(false, 'sidebar-collapsed-v1')
  const collapsed = !isMobile && storedCollapsed

  const isApp = isNativeApp()

  // Resolved per device, so an iPhone gets the App Store and a Pixel gets Play without a
  // disambiguation page in between. Falls back to /download — which asks the question properly —
  // on desktop, before hydration, and while the iOS listing is still a placeholder.
  const appDownload = useAppDownload()

  // The counterpart inside the app, and the only place linking out to a store listing is right: it is
  // member-initiated. On iOS it is also the only *permitted* mechanism for a button — Apple's HIG
  // forbids calling requestReview from a tap. Null until the App Store listing exists.
  const reviewUrl = useStoreReviewUrl()

  const toggleButton = !isMobile && (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      aria-label={
        collapsed
          ? t('nav.expand_sidebar', 'Open sidebar')
          : t('nav.collapse_sidebar', 'Close sidebar')
      }
      aria-expanded={!collapsed}
      aria-controls="main-navigation"
      className={
        'sidebar-text shrink-0 rounded-lg p-2 opacity-70 transition hover:bg-canvas-900 hover:opacity-100'
      }
    >
      <LuPanelLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  )

  if (collapsed) {
    return (
      <nav
        id="main-navigation"
        aria-label="Sidebar"
        data-testid="sidebar"
        className={clsx(
          'flex flex-col h-[calc(100dvh-var(--hloss))] mb-[calc(var(--bnh))] mt-[calc(var(--tnh))] pt-2 sm:pt-6',
          className,
        )}
        style={style}
      >
        {toggleButton}
      </nav>
    )
  }

  return (
    <nav
      id="main-navigation"
      aria-label="Sidebar"
      data-testid="sidebar"
      className={clsx(
        // Sized to its widest row rather than to a grid fraction, so wide screens give the extra room
        // to the page. Capped so one long member name cannot stretch the rail.
        'flex flex-col h-[calc(100dvh-var(--hloss))] mb-[calc(var(--bnh))] mt-[calc(var(--tnh))]',
        !isMobile && 'w-max max-w-[16rem]',
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-1 pb-2 pt-2 sm:pt-6">
        {toggleButton}
        <SiteLogo hideIcon className={'text-black invert !pb-0 !pt-0 sm:!pt-0'} />
      </div>

      <div className="h-px bg-white/[0.06] mb-3" />

      {/* Sign in / out lives up here rather than at the foot of the rail, which saves a row. */}
      {user === undefined && <div className="h-[44px] mb-3" />}
      {user && (
        <div className="mb-3 flex items-center gap-1">
          <ProfileSummary
            user={user}
            className="min-w-0 flex-1 sidebar-text transition-colors hover:bg-canvas-900"
            currentPage={currentPage}
          />
          <DropdownMenu
            withinOverflowContainer
            testId="sidebar-user-menu"
            closeOnClick
            menuWidth="w-40"
            buttonClass={
              'sidebar-text rounded-lg p-2 opacity-70 hover:bg-canvas-900 hover:opacity-100'
            }
            items={[
              {
                name: t('nav.sign_out', 'Sign out'),
                icon: <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />,
                onClick: logout,
              },
            ]}
          />
        </div>
      )}
      {user === null && (
        <div className="mb-3 flex flex-col">
          <SidebarItem
            item={{
              key: 'nav.sign_in',
              name: 'Sign in',
              icon: ArrowLeftOnRectangleIcon,
              href: '/signin',
            }}
            currentPage={currentPage}
          />
        </div>
      )}

      <div className="h-px bg-white/[0.06] mb-4" />

      {/* Daily-use rows, pinned: never scroll out from under the profile chip. */}
      {navOptions.primary.length > 0 && (
        <>
          <div className="flex flex-col gap-1">
            {navOptions.primary.map((item) => (
              <SidebarItem key={item.key} item={item} currentPage={currentPage} />
            ))}
          </div>
          <div className="h-px bg-white/[0.06] my-4" />
        </>
      )}

      {/* The one band that scrolls. `min-h-0` lets it shrink inside the flex column instead of
          pushing the utility band off the bottom of a short screen. */}
      <div className="mb-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navOptions.secondary.map((cluster, i) => (
          <Fragment key={i}>
            {i > 0 && <div className="h-px bg-white/[0.06] my-3" />}
            {cluster.map((item) => (
              <SidebarItem key={item.key} item={item} currentPage={currentPage} />
            ))}
          </Fragment>
        ))}

        {/* `py-3` matches the hero's "Join us", so the two read as the same button.
            Faded out while the page shows its own sign-up button, so the CTA is never on screen twice,
            and on /register itself.
            `invisible` rather than unmounting, so the rows below do not jump. */}
        {user === null && (
          <SignUpButton
            className={clsx(
              'mt-4 !py-3 transition-[opacity,visibility] duration-200',
              (pageCtaVisible || onRegisterPage) && 'invisible opacity-0',
            )}
            text={t('nav.sign_up', 'Join us')}
          />
        )}

        {user && profile === null && (
          <Button className="mt-2" onClick={() => router.push('signup')}>
            Create a profile
          </Button>
        )}
      </div>
      {/* Utility band, pinned to the foot: settings, help, admin tools, then the app row. */}
      <div className="mb-[12px] mt-auto flex flex-col gap-1">
        <div className="h-px bg-white/[0.06] mb-1" />
        {navOptions.utility.map((item) => (
          <SidebarItem key={item.key} item={item} currentPage={currentPage} />
        ))}
        {/* Hidden inside the shell for the obvious reason, and because an "install the app" row in
            the app is the kind of thing App Review notices. */}
        {!isApp && (
          <SidebarItem
            item={{
              key: appDownload.key,
              name: appDownload.label,
              icon: appDownload.icon,
              href: appDownload.href,
            }}
            currentPage={currentPage}
          />
        )}
        {/* Shown only inside the app, where the row can actually reach a store. It earns its place
            because of the quota: a member who wants to say something after their three system
            prompts are spent has no other route. See docs/app-store-reviews.md §7. */}
        {isApp && reviewUrl && (
          <SidebarItem
            item={{
              key: 'nav.rate_app',
              name: 'Rate Compass',
              icon: StarIcon,
              href: reviewUrl,
            }}
            currentPage={currentPage}
          />
        )}
        {user === null && (
          <LanguagePicker
            className={
              // eslint-disable-next-line no-restricted-syntax -- always-dark sidebar rail
              'w-fit mx-3 mt-2 pr-12 mb-2 bg-transparent border-canvas-900 sidebar-text hover:text-primary-600'
            }
          />
        )}
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
      color={color ?? 'signup'}
      size={size ?? 'xl'}
      onClick={startSignup}
      className={clsx('w-full', className)}
    >
      {text ?? t('home.sign_up', 'Join us')}
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
