import {HomeIcon, QuestionMarkCircleIcon} from '@heroicons/react/outline'
import {
  HomeIcon as SolidHomeIcon,
  QuestionMarkCircleIcon as SolidQuestionIcon,
  UserCircleIcon,
} from '@heroicons/react/solid'
import clsx from 'clsx'
import {User} from 'common/user'
import {buildArray} from 'common/util/array'
import {useOnline} from 'web/hooks/use-online'
import {ReactNode, useState} from 'react'
import {Toaster} from 'react-hot-toast'
import {Col} from 'web/components/layout/col'
import {PrivateMessagesIcon} from 'web/components/messaging/messages-icon'
import {BottomNavBar} from 'web/components/nav/love-bottom-nav-bar'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {useTracking} from 'web/hooks/use-tracking'
import {useUser} from 'web/hooks/use-user'
import {GoogleOneTapLogin} from 'web/lib/firebase/google-onetap-login'
import Sidebar from './nav/love-sidebar'
import {useLover} from 'web/hooks/use-lover'
import {Lover} from 'common/love/lover'
import {NotificationsIcon, SolidNotificationsIcon} from './notifications-icon'

export function LovePage(props: {
  trackPageView: string | false
  trackPageProps?: Record<string, any>
  className?: string
  children?: ReactNode
  hideSidebar?: boolean
  hideBottomBar?: boolean
}) {
  const {
    trackPageView,
    trackPageProps,
    children,
    className,
    hideSidebar,
    hideBottomBar,
  } = props
  const user = useUser()
  const isMobile = useIsMobile()
  const lover = useLover()
  const bottomNavOptions = user
    ? getBottomNavigation(user, lover)
    : signedOutNavigation()
  // const [isModalOpen, setIsModalOpen] = useState(false)
  const desktopSidebarOptions = getDesktopNav(user)

  const mobileSidebarOptions = user
    ? getSidebarNavigation(() => setIsAddFundsModalOpen(true))
    : []

  // eslint-disable-next-line react-hooks/rules-of-hooks
  trackPageView && useTracking(`view love ${trackPageView}`, trackPageProps)
  useOnline()
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false)

  return (
    <>
      <GoogleOneTapLogin className="fixed bottom-12 right-4 z-[1000]" />
      <Col
        className={clsx(
          'pb-[58px] lg:pb-0', // bottom bar padding
          'text-ink-1000 mx-auto min-h-screen w-full max-w-[1440px] lg:grid lg:grid-cols-12'
        )}
      >
        <Toaster
          position={isMobile ? 'bottom-center' : 'top-center'}
          containerClassName="!bottom-[70px]"
        />
        {hideSidebar ? (
          <div className="lg:col-span-2 lg:flex" />
        ) : (
          <Sidebar
            navigationOptions={desktopSidebarOptions}
            className="sticky top-0 hidden self-start px-2 lg:col-span-2 lg:flex"
          />
        )}
        <main
          className={clsx(
            'flex flex-1 flex-col lg:mt-6 xl:px-2',
            'col-span-10',
            className
          )}
        >
          {children}
        </main>
      </Col>
      {!hideBottomBar && (
        <BottomNavBar
          sidebarNavigationOptions={mobileSidebarOptions as any[]}
          navigationOptions={bottomNavOptions}
        />
      )}
    </>
  )
}

const Profiles = { name: 'Profiles', href: '/', icon: SolidHomeIcon };
const ProfilesHome = { name: 'Profiles', href: '/', icon: HomeIcon };
const faq = { name: 'FAQ', href: '/md/faq', icon: QuestionMarkCircleIcon };
const About = { name: 'About', href: '/about', icon: SolidQuestionIcon };
const AboutQuestionMark = { name: 'About', href: '/about', icon: QuestionMarkCircleIcon };
const Signin = { name: 'Sign in', href: '/signin', icon: UserCircleIcon };
const Notifs = {name: 'Notifs', href: `/notifications`, icon: NotificationsIcon};
const NotifsSolid = {name: 'Notifs', href: `/notifications`, icon: SolidNotificationsIcon};
const Messages = {name: 'Messages', href: '/messages', icon: PrivateMessagesIcon};

function getBottomNavigation(user: User, lover: Lover | null | undefined) {
  return buildArray(
    Profiles,
    NotifsSolid,
    {
      name: 'Profile',
      href: lover === null ? '/signup' : `/${user.username}`,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: (props) => (
        <PrivateMessagesIcon bubbleClassName={'-mr-5'} solid {...props} />
      ),
    }
  )
}

const signedOutNavigation = () => [
  Profiles,
  About,
  faq,
  Signin,
]
const getDesktopNav = (user: User | null | undefined) => {
  if (user)
    return buildArray(
      ProfilesHome,
      Notifs,
      Messages,
      AboutQuestionMark,
      faq
    )

  return buildArray(
    // { name: 'Profiles', href: '/', icon: HomeIcon },
    AboutQuestionMark,
    faq
  )
}

// No sidebar when signed out
const getSidebarNavigation = (_toggleModal: () => void) => {
  return buildArray(
    AboutQuestionMark,
    faq
  )
}
