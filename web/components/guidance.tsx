import {useRouter} from 'next/router'
import clsx from 'clsx'
import {useT} from 'web/lib/locale'

export function FilterGuide(props: {className?: string}) {
  const {className} = props
  const router = useRouter()
  const {query} = router
  const fromSignup = query.fromSignup === 'true'
  const t = useT()
  return (
    fromSignup && (
      <p className={clsx('guidance', className)}>
        {t('profiles.filter_guide', 'Filter below by intent, age, location, and more')}
      </p>
    )
  )
}
