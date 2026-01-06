import Link from 'next/link'
import clsx from 'clsx'
import {MenuAlt3Icon} from '@heroicons/react/solid'
import {Dialog, Transition} from '@headlessui/react'
import {Fragment, useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/router'
import Sidebar from './sidebar'
import {Item} from './sidebar-item'
import {useUser} from 'web/hooks/use-user'
import {Avatar} from 'web/components/widgets/avatar'
import {useIsIframe} from 'web/hooks/use-is-iframe'
import {trackCallback} from 'web/lib/service/analytics'
import {User} from 'common/user'
import {Col} from 'web/components/layout/col'
import {useProfile} from 'web/hooks/use-profile'
import {useIsMobile} from "web/hooks/use-is-mobile"
import {useT} from "web/lib/locale";

const itemClass =
  'sm:hover:bg-ink-200 block w-full py-1 px-3 text-center sm:hover:text-primary-700 transition-colors'
const selectedItemClass = 'bg-ink-100 text-primary-700'
const touchItemClass = 'bg-primary-100'

// From https://codepen.io/chris__sev/pen/QWGvYbL
export function BottomNavBar(props: {
  navigationOptions: Item[]
  sidebarNavigationOptions: Item[]
}) {
  const {navigationOptions, sidebarNavigationOptions} = props
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const router = useRouter()
  const currentPage = router.pathname

  const user = useUser()
  const t = useT()

  const isIframe = useIsIframe()
  if (isIframe) {
    return null
  }

  return (<Col>
      <nav
        className={clsx(
          "border-ink-200 dark:border-ink-300 text-ink-700 bg-canvas-50 fixed inset-x-0 bottom-0 z-50 flex select-none items-center justify-between border-t-2 text-xs lg:hidden sidebar-nav",
          'safe-bottom',
        )}
      >
        {navigationOptions.map((item) => (
          <NavBarItem
            key={item.key} // Remove, as no key prop?
            item={item}
            currentPage={currentPage}
            user={user}
          />
        ))}
        <div
          className={clsx(
            itemClass,
            'relative',
            sidebarOpen ? selectedItemClass : ''
          )}
          onClick={() => setSidebarOpen(true)}
        >
          <MenuAlt3Icon className="mx-auto my-1 h-6 w-6" aria-hidden="true"/>
          {t('nav.more', 'More')}
        </div>
        <MobileSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarNavigationOptions={sidebarNavigationOptions}
        />
      </nav>

      <div
        className="fixed inset-x-0 bg-canvas-50"
        style={{
          bottom: 0,
          height: 'env(safe-area-inset-bottom)',
        }}
      />
    </Col>
  )
}

function ProfileItem(props: {
  user: User
  item: Item
  touched: boolean
  setTouched: (touched: boolean) => void
  currentPage: string
  track: () => void
}) {
  const {user, item, touched, setTouched, currentPage, track} = props
  const profile = useProfile()
  return (
    <Link
      href={item.href ?? '#'}
      className={clsx(
        itemClass,
        touched && touchItemClass,
        currentPage === '/[username]' && selectedItemClass
      )}
      onClick={track}
      onTouchStart={() => setTouched(true)}
      onTouchEnd={() => setTouched(false)}
    >
      <Col>
        <div className="mx-auto my-1">
          <Avatar
            size={'md'}
            username={user.username}
            avatarUrl={profile?.pinned_url ?? user.avatarUrl}
            noLink
          />
        </div>
      </Col>
    </Link>
  )
}

function NavBarItem(props: {
  item: Item
  currentPage: string
  children?: any
  user?: User | null
  className?: string
}) {
  const {item, currentPage, children, user} = props
  const t = useT()
  const track = trackCallback(`navbar: ${item.trackingEventName ?? item.name}`)
  const [touched, setTouched] = useState(false)
  if (item.name === 'Profile' && user) {
    return (
      <ProfileItem
        user={user}
        item={item}
        touched={touched}
        setTouched={setTouched}
        currentPage={currentPage}
        track={track}
      />
    )
  }

  const element = <>
    {item.icon && <item.icon className="mx-auto my-1 h-6 w-6"/>}
    {children}
    {t(item.key, item.name)}
  </>

  if (!item.href) {
    return (
      <button
        className={clsx(itemClass, touched && touchItemClass)}
        onClick={() => {
          track()
          item.onClick?.()
        }}
        onTouchStart={() => setTouched(true)}
        onTouchEnd={() => setTouched(false)}
      >
        {element}
      </button>
    )
  }

  const currentBasePath = '/' + (currentPage?.split('/')[1] ?? '')
  const isCurrentPage = currentBasePath === item.href.split('?')[0]

  return (
    <Link
      href={item.href}
      className={clsx(
        itemClass,
        touched && touchItemClass,
        isCurrentPage && selectedItemClass
      )}
      onClick={track}
      onTouchStart={() => setTouched(true)}
      onTouchEnd={() => setTouched(false)}
    >
      {element}
    </Link>
  )
}

// Sidebar that slides out on mobile
export function MobileSidebar(props: {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarNavigationOptions: Item[]
}) {
  const {sidebarOpen, sidebarNavigationOptions, setSidebarOpen} = props

  // Touch gesture handlers to open/close the mobile sidebar on any page
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const gestureHandled = useRef(false)
  const isMobile = useIsMobile(1024) // for lg threshold, like in BottomNavBar vs Sidebar

  const HORIZONTAL_THRESHOLD = 50 // px required to count as swipe
  // const EDGE_START_MAX = 30 // px from left edge to allow open gesture

  // Prefer global pointer events so gestures work even if a child intercepts touches
  useEffect(() => {
    if (!isMobile) return

    const onPointerDown = (e: PointerEvent) => {
      // console.log("onPointerDown")
      if (!['touch', 'mouse'].includes(e.pointerType)) return
      touchStartX.current = e.clientX
      touchStartY.current = e.clientY
      gestureHandled.current = false
    }

    const onPointerMove = (e: PointerEvent) => {
      // console.log("onPointerMove")
      if (!['touch', 'mouse'].includes(e.pointerType)) return
      if (gestureHandled.current) return
      if (touchStartX.current == null) return
      const deltaX = e.clientX - touchStartX.current
      const deltaY = e.clientY - (touchStartY.current ?? 0)

      // Ignore primarily vertical gestures
      if (Math.abs(deltaY) > Math.abs(deltaX)) return

      if (!sidebarOpen) {
        // console.log("checking opening")
        // Open gesture: swipe right starting from the very left edge
        if (deltaX > HORIZONTAL_THRESHOLD) {
          e.preventDefault()
          gestureHandled.current = true
          setSidebarOpen(true)
        }
      } else {
        // Close gesture: swipe left anywhere
        if (deltaX < -HORIZONTAL_THRESHOLD) {
          e.preventDefault()
          gestureHandled.current = true
          setSidebarOpen(false)
        }
      }
    }

    const onPointerUp = (_e: PointerEvent) => {
      // console.log("onPointerUp")
      touchStartX.current = null
      touchStartY.current = null
      gestureHandled.current = false
    }

    const target = document.body
    target.addEventListener('pointerdown', onPointerDown, {passive: false})
    target.addEventListener('pointermove', onPointerMove, {passive: false})
    target.addEventListener('pointerup', onPointerUp, {passive: false})


    return () => {
      target.removeEventListener('pointerdown', onPointerDown)
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerup', onPointerUp)
    }
  }, [isMobile, sidebarOpen])

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 flex"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* background cover */}
            <Dialog.Overlay className="bg-canvas-100/75 fixed inset-0"/>
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="bg-canvas-25 relative flex w-full max-w-[200px] flex-1 flex-col">
              <div className="mx-2 h-0 flex-1 overflow-y-auto">
                <Sidebar
                  navigationOptions={sidebarNavigationOptions}
                  isMobile
                />
              </div>
            </div>
          </Transition.Child>
          <div className="w-14 flex-shrink-0" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}
