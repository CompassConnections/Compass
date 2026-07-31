import {BellAlertIcon, EyeIcon, HeartIcon} from '@heroicons/react/24/outline'
import {ReactNode} from 'react'
import {useT} from 'web/lib/locale'

import {Col} from '../layout/col'
import {Row} from '../layout/row'

/**
 * Reasons where the pitch to stay would be tone-deaf: the person already found someone, so keeping a
 * profile findable is not something they want. Every other reason gets the pitch — deleting is the
 * one move that makes things worse for the person doing it: they stop being found, and they stop
 * being told when someone who fits shows up.
 */
export const NO_STAY_PITCH_DELETION_REASONS = [
  'found_connection_on_compass',
  'found_connection_elsewhere',
]

/** Whether to show the "one thing before you go" pitch for a stated deletion reason. */
export const shouldShowStayPitch = (reason: string | null) =>
  !!reason && !NO_STAY_PITCH_DELETION_REASONS.includes(reason)

function Point(props: {icon: ReactNode; title: string; body: string}) {
  const {icon, title, body} = props
  return (
    <Row className="gap-3">
      <div className="text-primary-600 mt-0.5 shrink-0">{icon}</div>
      <div className="text-sm">
        <span className="font-medium">{title}</span> <span className="text-ink-700">{body}</span>
      </div>
    </Row>
  )
}

/** Shown when the stated deletion reason is one that keeping the account actually helps with. */
export function StayInsteadOfDelete() {
  const t = useT()

  return (
    <Col
      className="border-primary-300 bg-primary-50 gap-3 rounded-lg border p-4"
      data-testid="stay-instead-of-delete"
    >
      <div className="font-semibold">
        {t('delete_survey.stay.title', 'One thing before you go')}
      </div>

      <div className="text-ink-700 text-sm">
        {t(
          'delete_survey.stay.intro',
          'Compass keeps growing, and keeping your account costs you nothing — no fees, and you can turn every email off in Settings.',
        )}
      </div>

      <Col className="gap-2.5">
        <Point
          icon={<BellAlertIcon className="h-5 w-5" />}
          title={t('delete_survey.stay.alerts_title', 'We come to you.')}
          body={t(
            'delete_survey.stay.alerts_body',
            'Save a search and we notify you as soon as someone new matches it. You never have to check back.',
          )}
        />
        <Point
          icon={<EyeIcon className="h-5 w-5" />}
          title={t('delete_survey.stay.visible_title', 'You stay findable.')}
          body={t(
            'delete_survey.stay.visible_body',
            'The next person who joins can find you. If your profile is gone, you are invisible to everyone who arrives after today.',
          )}
        />
        <Point
          icon={<HeartIcon className="h-5 w-5" />}
          title={t('delete_survey.stay.timing_title', 'Timing is the whole game.')}
          body={t(
            'delete_survey.stay.timing_body',
            'Two people who would have been a great match miss each other for one reason: they were here at different times. Staying is what makes the overlap possible.',
          )}
        />
      </Col>
    </Col>
  )
}
