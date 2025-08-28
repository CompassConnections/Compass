import Link from 'next/link'
import clsx from 'clsx'
import { ENV } from 'common/envs/constants'
import { Row } from 'web/components/layout/row'
import FavIcon from "web/public/FavIcon";

export default function ManifoldLoveLogo(props: {
  noLink?: boolean
  className?: string
}) {
  const { noLink, className } = props
  const inner = (
    <>
      <FavIcon className="dark:invert"/>
      <div className={clsx('my-auto text-xl font-thin')}>
        {ENV == 'DEV' ? 'Compass dev' : 'Compass'}
      </div>
    </>
  )
  if (noLink) {
    return <Row className="gap-1 pb-3 pt-6">{inner}</Row>
  }
  return (
    <Link
      href={'/'}
      className={clsx('flex flex-row gap-1 pb-3 pt-6', className)}
    >
      {inner}
    </Link>
  )
}
