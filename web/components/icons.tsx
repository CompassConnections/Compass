import {ReactNode} from 'react'
import {Row} from 'web/components/layout/row'

export function IconWithInfo(props: {text: string; icon: ReactNode}) {
  const {text, icon} = props
  return (
    <Row className="items-start gap-1">
      <div className="text-ink-500 mt-1">{icon}</div>
      {text}
    </Row>
  )
}

export function InfoIcon(props: {className?: string}) {
  const {className = 'w-5 h-5'} = props
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
