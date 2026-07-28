import {ChevronLeftIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {useRouter} from 'next/router'
import React, {useEffect, useState} from 'react'
import {useT} from 'web/lib/locale'

export function BackButton(props: {className?: string}) {
  const {className} = props
  const router = useRouter()
  const t = useT()
  const [canGoBack, setCanGoBack] = useState(false)

  // Can't put this in a useMemo to avoid the page jump else we'll get hydration errors.
  useEffect(() => {
    setCanGoBack(typeof window !== 'undefined' && window.history.length > 1)
  }, [])

  if (!canGoBack) return null

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={clsx(
        // `-m-2 p-2` is hit area only: on mobile the label is hidden and the button was the 16px
        // chevron itself, well under a thumb's worth of target. The negative margin cancels the
        // padding, so the chevron stays exactly where every caller already positions it.
        'text-ink-500 hover:text-primary-700 -m-2 inline-flex items-center gap-1 p-2 text-sm transition-all',
        className,
      )}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className={'hidden sm:flex'}>{t('common.back', 'Back')}</span>
    </button>
  )
}
