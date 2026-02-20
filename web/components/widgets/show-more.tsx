import {ReactNode, useState} from 'react'

interface ShowMoreProps {
  labelClosed?: string
  labelOpen?: string
  children: ReactNode
  className?: string
}

export function ShowMore(props: ShowMoreProps) {
  const {labelClosed = 'Show more', labelOpen = 'Hide', children, className} = props
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  return (
    <div className={`mt-2 mb-4 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setShowMoreInfo(!showMoreInfo)}
        className="text-primary-600 hover:text-primary-800 flex items-center"
      >
        {showMoreInfo ? labelOpen : labelClosed}
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showMoreInfo && <div className="mt-2 p-3 rounded-md">{children}</div>}
    </div>
  )
}
