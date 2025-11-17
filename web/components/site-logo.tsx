import Link from 'next/link'
import clsx from 'clsx'
import {Row} from 'web/components/layout/row'
import FavIcon from "web/components/FavIcon";
import {isProd} from "common/envs/is-prod";

export default function SiteLogo(props: {
  noLink?: boolean
  className?: string
}) {
  const {noLink, className} = props
  const inner = (
    <>
      <FavIcon className="dark:invert"/>
      <div className={clsx('my-auto text-xl font-thin logo')}>
        {isProd() ? 'Compass' : 'Compass dev'}
      </div>
    </>
  )
  if (noLink) {
    return <Row className="gap-1 pb-3 pt-6">{inner}</Row>
  }
  return (
    <Link
      href={'/home'}
      className={clsx('flex flex-row gap-1 pb-3 pt-6', className)}
    >
      {inner}
    </Link>
  )
}
