import clsx from 'clsx'
import {IS_PROD} from 'common/envs/constants'
import Link from 'next/link'
import FavIconBlack from 'web/components/FavIcon'
import {Row} from 'web/components/layout/row'

export default function SiteLogo(props: {noLink?: boolean; className?: string}) {
  const {noLink, className} = props
  const inner = (
    <>
      <FavIconBlack className={className?.includes('invert') ? '' : 'dark:invert'} />
      <div
        className={clsx('my-auto logo')}
        style={{
          fontFamily: 'Cormorant Garamond',
          fontSize: '22px',
          fontWeight: 500,
          letterSpacing: '0.03em',
        }}
      >
        {IS_PROD ? 'Compass' : 'Compass dev'}
      </div>
    </>
  )
  if (noLink) {
    return <Row className={clsx('gap-1 pb-2 pt-2 sm:pt-6', className)}>{inner}</Row>
  }
  return (
    <Link href={'/home'} className={clsx('flex flex-row gap-1 pb-2 pt-2 sm:pt-6', className)}>
      {inner}
    </Link>
  )
}
