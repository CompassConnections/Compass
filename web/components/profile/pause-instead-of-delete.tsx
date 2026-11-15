import {PauseCircleIcon} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {usePauseProfile} from 'web/hooks/use-pause-profile'
import {useT} from 'web/lib/locale'

import {Col} from '../layout/col'
import {Row} from '../layout/row'

/**
 * The reversible alternative, offered inside the delete-account dialog.
 *
 * Shown whatever reason was given — unlike the pitch to stay, which is tone-deaf for someone who has
 * found a partner. Pausing is exactly what that person may want: gone from search today, with
 * nothing lost if they are back in a year.
 */
export function PauseInsteadOfDelete() {
  const t = useT()
  const {paused, setPaused, busy, ready} = usePauseProfile()

  return (
    <Col
      className="border-canvas-300 bg-canvas-50 gap-3 rounded-lg border p-4"
      data-testid="pause-instead-of-delete"
    >
      <Row className="gap-3">
        <PauseCircleIcon className="text-primary-700 mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="text-sm">
          <span className="font-medium">
            {paused
              ? t('delete_survey.pause.done_title', 'Your profile is paused.')
              : t('delete_survey.pause.title', 'Need a break rather than an exit?')}
          </span>{' '}
          <span className="text-ink-800">
            {paused
              ? t(
                  'delete_survey.pause.done_body',
                  'Nobody can find or open it now, and nothing was deleted. Resume it in Settings whenever you like. You can close this.',
                )
              : t(
                  'delete_survey.pause.body',
                  'Pausing takes you out of search and hides your profile from other members. Your conversations and everything you wrote stay, and you can resume at any time.',
                )}
          </span>
        </div>
      </Row>
      {!paused && (
        <Button
          color="gray-outline"
          size="sm"
          className="w-full sm:w-fit"
          disabled={busy || !ready}
          loading={busy}
          onClick={async () => {
            try {
              await setPaused(true)
            } catch {
              toast.error(t('profile.header.toast.failed_disable', 'Failed to pause profile'))
            }
          }}
        >
          {t('delete_survey.pause.cta', 'Pause my profile instead')}
        </Button>
      )}
    </Col>
  )
}
