import {HomeIcon, NewspaperIcon, QuestionMarkCircleIcon} from '@heroicons/react/outline'
import {
  CogIcon,
  GlobeAltIcon,
  HomeIcon as SolidHomeIcon,
  LinkIcon,
  QuestionMarkCircleIcon as SolidQuestionIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/solid'
import clsx from 'clsx'
import {User} from 'common/user'
import {buildArray} from 'common/util/array'
import {useOnline} from 'web/hooks/use-online'
import {ReactNode, useState} from 'react'
import {Toaster} from 'react-hot-toast'
import {Col} from 'web/components/layout/col'
import {PrivateMessagesIcon} from 'web/components/messaging/messages-icon'
import {BottomNavBar} from 'web/components/nav/bottom-nav-bar'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {useTracking} from 'web/hooks/use-tracking'
import {useUser} from 'web/hooks/use-user'
import {GoogleOneTapLogin} from 'web/lib/firebase/google-onetap-login'
import Sidebar from './nav/sidebar'
import {useProfile} from 'web/hooks/use-profile'
import {Profile} from 'common/profiles/profile'
import {NotificationsIcon, SolidNotificationsIcon} from './notifications-icon'
import {IS_MAINTENANCE} from "common/constants"
import {MdThumbUp} from "react-icons/md"
import {FaEnvelope} from "react-icons/fa"

export function PageBase(props: {
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
  const profile = useProfile()
  const bottomNavOptions = user
    ? getBottomNavigation(user, profile)
    : getBottomSignedOutNavigation()
  // const [isModalOpen, setIsModalOpen] = useState(false)
  const desktopSidebarOptions = getDesktopNavigation(user)

  const mobileSidebarOptions = getMobileSidebar(user, () => setIsAddFundsModalOpen(true))

  // eslint-disable-next-line react-hooks/rules-of-hooks
  trackPageView && useTracking(`view ${trackPageView}`, trackPageProps)
  useOnline()
  const [_, setIsAddFundsModalOpen] = useState(false)

  return (
    <>
      <GoogleOneTapLogin className="fixed bottom-12 right-4 z-[1000]"/>
      <Col
        className={clsx(
          'pb-[58px] lg:pb-0', // bottom bar padding
          'text-ink-1000 mx-auto min-h-screen w-full lg:grid lg:grid-cols-12'
        )}
      >
        <Toaster
          position={isMobile ? 'bottom-center' : 'top-center'}
          containerClassName="!bottom-[70px]"
        />
        {/* Maintenance banner */}
        {IS_MAINTENANCE &&
            <div className="lg:col-span-12 w-full bg-orange-500 text-white text-center text-sm py-2 px-3">
                Maintenance in progress: Some features may be broken for the next few hours.
            </div>}
        {hideSidebar ? (
          <div className="lg:col-span-2 lg:flex"/>
        ) : (
          <Sidebar
            navigationOptions={desktopSidebarOptions}
            className="sticky top-0 hidden self-start px-2 lg:col-span-2 lg:flex sidebar-nav bg-canvas-25"
          />
        )}
        <main
          className={clsx(
            'flex flex-1 flex-col lg:mt-6 xl:px-2',
            'col-span-8',
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

const Profiles = {name: 'People', href: '/', icon: UsersIcon}
const Home = {name: 'Home', href: '/', icon: HomeIcon}
const faq = {name: 'FAQ', href: '/faq', icon: SolidQuestionIcon}
const About = {name: 'About', href: '/about', icon: QuestionMarkCircleIcon}
const Signin = {name: 'Sign in', href: '/signin', icon: UserCircleIcon}
const Notifs = {name: 'Notifs', href: `/notifications`, icon: NotificationsIcon}
const NotifsSolid = {name: 'Notifs', href: `/notifications`, icon: SolidNotificationsIcon}
const Messages = {name: 'Messages', href: '/messages', icon: PrivateMessagesIcon}
const Social = {name: 'Social', href: '/social', icon: LinkIcon}
const Organization = {name: 'Organization', href: '/organization', icon: GlobeAltIcon}
const Vote = {name: 'Vote', href: '/vote', icon: MdThumbUp}
const Contact = {name: 'Contact', href: '/contact', icon: FaEnvelope}
const News = {name: "What's new", href: '/news', icon: NewspaperIcon}
const Settings = {name: "Settings", href: '/settings', icon: CogIcon}

const base = [
  About,
  faq,
  Vote,
  News,
  Social,
  Organization,
  Contact,
]

function getBottomNavigation(user: User, profile: Profile | null | undefined) {
  return buildArray(
    Profiles,
    NotifsSolid,
    {
      name: 'Profile',
      href: profile === null ? '/signup' : `/${user.username}`,
      icon: SolidHomeIcon,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: (props) => (
        <PrivateMessagesIcon bubbleClassName={'-mr-5'} solid {...props} />
      ),
    },
  )
}

const getBottomSignedOutNavigation = () => [
  Home,
  About,
  Signin,
]

const getDesktopNavigation = (user: User | null | undefined) => {
  if (user)
    return buildArray(
      Profiles,
      Notifs,
      Messages,
      Settings,
      ...base,
    )

  return buildArray(
    ...base
  )
}

const getMobileSidebar = (
  user: User | null | undefined,
  _toggleModal: () => void,
) => {
  if (user)
    return buildArray(
      Settings,
      ...base,
    )

  return buildArray(
    ...base,
  )
}
