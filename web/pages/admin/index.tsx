import {EnvelopeIcon, MapIcon} from '@heroicons/react/24/outline'
import {IS_LOCAL} from 'common/hosting/constants'
import Link from 'next/link'
import {ComponentType} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {surface, surfaceHover} from 'web/components/widgets/surface'
import {useAdmin} from 'web/hooks/use-admin'

// The single list of admin tools. Adding a page here is what makes it reachable — the sidebar only ever
// links to this index, so no new nav entry is needed per tool.
const ADMIN_PAGES: {
  href: string
  name: string
  description: string
  icon: ComponentType<{className?: string}>
}[] = [
  {
    href: '/admin/outreach',
    name: 'Outreach',
    description: 'Every open conversation plus the newest members nobody has written to yet.',
    icon: EnvelopeIcon,
  },
  {
    href: '/admin/journeys',
    name: 'User journeys',
    description: 'Event-by-event replay of what recently-created users did on the site.',
    icon: MapIcon,
  },
]

export default function AdminHome() {
  const isAdmin = useAdmin()

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  return (
    <PageBase className="p-2 sm:pt-0">
      <NoSEO />
      <Col className={'text-ink-900 mx-4 my-4 gap-6'}>
        <Col className={'gap-1'}>
          <div className={'text-primary-700 text-2xl'}>Admin</div>
          <div className={'text-ink-500 text-sm'}>Internal tools. Visible to admins only.</div>
        </Col>

        <div className={'grid gap-3 sm:grid-cols-2'}>
          {ADMIN_PAGES.map((page) => (
            <Link key={page.href} href={page.href} className={`${surface} ${surfaceHover} p-4`}>
              <Row className={'items-start gap-3'}>
                <page.icon className={'text-primary-600 mt-0.5 h-5 w-5 flex-shrink-0'} />
                <Col className={'gap-1'}>
                  <div className={'text-ink-900 font-medium'}>{page.name}</div>
                  <div className={'text-ink-500 text-sm'}>{page.description}</div>
                  <div className={'text-ink-300 text-xs'}>{page.href}</div>
                </Col>
              </Row>
            </Link>
          ))}
        </div>
      </Col>
    </PageBase>
  )
}
