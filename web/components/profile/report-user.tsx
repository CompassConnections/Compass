import {useState} from 'react'
import {User} from 'common/user'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Checkbox} from 'web/components/widgets/checkbox'
import {Button} from 'web/components/buttons/button'
import Textarea from 'react-expanding-textarea'
import {toast} from 'react-hot-toast'
import {api} from 'web/lib/api'
import {randomString} from 'common/util/random'
import {useT} from 'web/lib/locale'

export const ReportUser = (props: {user: User; closeModal: () => void}) => {
  const {user, closeModal} = props
  const t = useT()
  const reportTypes = [
    t('report.user.type.spam', 'Spam'),
    t('report.user.type.inappropriate', 'Inappropriate or objectionable content'),
    t('report.user.type.violence', 'Violence or threats'),
    t('report.user.type.fraud', 'Fraudulent activity'),
    t('report.user.type.other', 'Other'),
  ]
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([])
  const [otherReportType, setOtherReportType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const canSubmit = selectedReportTypes.length > 0 && otherReportType.length > 0 && !isSubmitting
  const reportUser = async () => {
    setIsSubmitting(true)
    await toast
      .promise(
        api('report', {
          contentType: 'user',
          contentId: randomString(16),
          contentOwnerId: user.id,
          description: 'Reasons: ' + [...selectedReportTypes, otherReportType].join(', '),
        }),
        {
          loading: t('report.user.toast.loading', 'Reporting...'),
          success: t('report.user.toast.success', 'Reported'),
          error: t('report.user.toast.error', 'Error reporting user'),
        },
      )
      .then(() => {
        setHasSubmitted(true)
      })
    setIsSubmitting(false)
  }

  return (
    <Col>
      {hasSubmitted ? (
        <Col className={'gap-2'}>
          <span>{t('report.user.thanks', 'Thank you for your report.')}</span>
          <span>
            {t('report.user.review_message', "We'll review the user and take action if necessary.")}
          </span>
          <Row className={'mt-2 justify-end'}>
            <Button onClick={closeModal}>{t('common.close', 'Close')}</Button>
          </Row>
        </Col>
      ) : (
        <>
          <Row className={'mb-4'}>
            <span>
              {t(
                'report.user.instructions',
                'Please select the reason(s) for reporting this user and a link to the content.',
              )}
            </span>
          </Row>
          <Col className={'mb-4 ml-4 gap-3'}>
            {reportTypes.map((reportType) => (
              <Checkbox
                key={reportType}
                label={reportType}
                checked={selectedReportTypes.includes(reportType)}
                toggle={(checked) => {
                  if (checked) {
                    setSelectedReportTypes([...selectedReportTypes, reportType])
                  } else {
                    setSelectedReportTypes(selectedReportTypes.filter((t) => t !== reportType))
                  }
                }}
              />
            ))}

            <Textarea
              placeholder={t(
                'report.user.placeholder',
                'Add more context and/or provide a link to the content',
              )}
              rows={2}
              className={'border-ink-300 bg-canvas-0 -ml-2 rounded-md border p-2'}
              value={otherReportType}
              onChange={(e) => setOtherReportType(e.target.value)}
            />
          </Col>
          <Row className={'justify-between'}>
            <Button color={'gray-white'} onClick={closeModal}>
              {t('settings.action.cancel', 'Cancel')}
            </Button>
            <Button disabled={!canSubmit} color={'red'} onClick={reportUser}>
              {t('report.user.submit', 'Report User')}
            </Button>
          </Row>
        </>
      )}
    </Col>
  )
}
