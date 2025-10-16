import clsx from 'clsx'
import {useEffect, useRef} from 'react'
import FavIcon from "web/public/FavIcon";

export type SpinnerSize = 'sm' | 'md' | 'lg'

function getSizeClass(size: SpinnerSize) {
  switch (size) {
    case 'sm':
      return 'h-4 w-4 border-2'
    case 'md':
      return 'h-6 w-6 border-4'
    case 'lg':
    default:
      return 'h-8 w-8 border-4'
  }
}

export function LoadingIndicator(props: {
  className?: string
  spinnerClassName?: string
  size?: SpinnerSize
}) {
  const { className, spinnerClassName, size = 'lg' } = props
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'border-primary-500 inline-block animate-spin rounded-full border-solid border-r-transparent',
          getSizeClass(size),
          spinnerClassName
        )}
        role="status"
      />
    </div>
  )
}



export function CompassLoadingIndicator(props: {
  className?: string
  spinnerClassName?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const {className, spinnerClassName} = props
  const compassRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = compassRef.current
    if (!el) return

    let angle = 0
    let timeoutId: number

    const randomTurn = () => {
      // Randomly choose direction and angle
      const direction = Math.random() > 0.5 ? 1 : -1
      const delta = Math.random() * 75 + 5
      angle = direction * delta

      el.style.transform = `rotate(${angle}deg)`

      // Random delay before next movement
      const delay = Math.random() * 400 + 400
      timeoutId = window.setTimeout(randomTurn, delay)
    }

    randomTurn()
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className={clsx('flex items-center justify-center mt-8', className)}>
      <div
        ref={compassRef}
        className={clsx(
          'inline-block transition-transform duration-700 ease-in-out',
          // getSizeClass(size),
          spinnerClassName
        )}
        role="status"
      >
        <FavIcon className="dark:invert w-20 h-20"/>
      </div>
    </div>
  )
}

