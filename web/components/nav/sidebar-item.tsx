import clsx from 'clsx'
import Link from 'next/link'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

export type Item = {
  name: string
  key: string
  children?: React.ReactNode
  trackingEventName?: string
  href?: string
  dataId?: string
  onClick?: () => void
  icon?: React.ComponentType<{className?: string}>
}

export function SidebarItem(props: {item: Item; currentPage?: string}) {
  const {item, currentPage} = props

  const t = useT()

  const currentBasePath = '/' + (currentPage?.split('/')[1] ?? '')
  const isCurrentPage = item.href != null && currentBasePath === item.href.split('?')[0]

  const onClick = () => {
    item.onClick?.()
    track('sidebar: ' + item.name)
  }

  const sidebarClass = clsx(
    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
    'outline-none transition-colors duration-150',
    // Active is a warm amber-washed pill, not the same neutral fill as hover — the two used to be
    // near-identical (both `bg-canvas-900`), so the current page barely stood out. Hover uses the
    // canvas-900 "sidebar pressed" token, which is theme-aware on the always-dark rail.
    isCurrentPage ? 'bg-primary-500/15 text-primary-500' : 'sidebar-text hover:bg-canvas-900',
    'focus-visible:bg-canvas-900',
  )

  const sidebarItem = (
    <>
      {item.icon && (
        <item.icon
          className={clsx(
            'h-5 w-5 flex-shrink-0 transition',
            // Muted until active/hovered — modern icon hierarchy — but always full-amber when current.
            isCurrentPage ? 'text-primary-500' : 'sidebar-text opacity-70 group-hover:opacity-100',
          )}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{item.children ?? t(item.key, item.name)}</span>
    </>
  )

  if (item.href) {
    return (
      <Link
        href={item.href}
        aria-current={isCurrentPage ? 'page' : undefined}
        onClick={onClick}
        className={sidebarClass}
      >
        {sidebarItem}
      </Link>
    )
  } else {
    return (
      <button onClick={onClick} className={sidebarClass}>
        {sidebarItem}
      </button>
    )
  }
}
