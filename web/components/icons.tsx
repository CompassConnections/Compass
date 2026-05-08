import {ReactNode} from 'react'
import {Row} from 'web/components/layout/row'

export function IconWithInfo(props: {text?: string; icon: ReactNode; children?: ReactNode}) {
  const {text, icon, children} = props
  return (
    <Row className="items-center gap-1" style={{gap: '5px'}}>
      <div className="mt-0.5" style={{width: '14px', height: '14px'}}>
        {icon}
      </div>
      <span style={{fontSize: '13.5px'}}>
        {text}
        {children}
      </span>
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
