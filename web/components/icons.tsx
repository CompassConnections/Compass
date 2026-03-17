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
