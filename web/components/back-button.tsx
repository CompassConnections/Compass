import {ChevronLeftIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import React, {useEffect, useState} from 'react'

export function BackButton(props: {className?: string}) {
  const {className} = props
  const [canGoBack, setCanGoBack] = useState(false)

  // Can't put this in a useMemo to avoid the page jump else we'll get hydration errors.
  useEffect(() => {
    setCanGoBack(typeof window !== 'undefined' && window.history.length > 1)
  }, [])

  if (!canGoBack) return null

  return (
    <button
      type="button"
      className={clsx(
        'text-ink-500 hover:text-ink-900 inline-flex items-center gap-2 text-sm',
        className,
      )}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      Back
    </button>
  )
}
