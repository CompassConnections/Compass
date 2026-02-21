import {ReactNode} from 'react'
import {Row} from 'web/components/layout/row'

export function IconWithInfo(props: {text: string; icon: ReactNode}) {
  const {text, icon} = props
  return (
    <Row className="items-center gap-0.5">
      <div className="text-ink-500">{icon}</div>
      {text}
    </Row>
  )
}
