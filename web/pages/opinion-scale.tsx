import { QuestionsForm } from 'web/components/questions-form'
import { Col } from 'web/components/layout/col'

export default function OpinionScalePage() {
  return (
    <Col>
      <QuestionsForm questionType="multiple_choice" />
    </Col>
  )
}
