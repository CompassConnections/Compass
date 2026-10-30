import clsx from 'clsx'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {OpenerReviewNote} from 'web/components/moderation/opener-review-note'
import {Content} from 'web/components/widgets/editor'
import {useT} from 'web/lib/locale'
import {PendingOpener} from 'web/lib/pending-openers'

/**
 * The sender's own first message while the API is still checking it, or after it was refused.
 *
 * Same bubble shape as `ChatMessageItem` draws for the sender, so the message appears to have been
 * sent the moment the button was pressed; dimmed while the check runs, outlined when it comes back
 * refused with the reason under it. Not `ChatMessageItem` itself: that one offers edit, delete and
 * reactions on hover, none of which exist for a message that has no id yet.
 */
export function PendingOpenerBubble(props: {
  pending: PendingOpener
  /** Put the refused text back in the composer so it can be fixed and resent. */
  onEdit: () => void
}) {
  const {pending, onEdit} = props
  const t = useT()
  const refused = pending.status === 'rejected'

  return (
    <Row className="mt-2 flex-row-reverse items-end justify-start gap-1">
      <Col className="items-end gap-1 sm:max-w-[calc(100vw-6rem)] md:max-w-[70%]">
        <div
          className={clsx(
            'rounded-3xl rounded-r-none px-3 py-2 transition-opacity',
            refused ? 'bg-canvas-100 ring-1 ring-red-300' : 'bg-primary-200 opacity-60',
          )}
          data-testid="pending-opener"
        >
          <Content content={pending.content} size="sm" />
        </div>
        {refused ? (
          <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm dark:border-red-900/50 dark:bg-red-950/30">
            <p className="font-semibold text-red-700 dark:text-red-300">
              {t('messages.pending.refused', 'Not sent')}
            </p>
            {pending.reason && <p className="mt-1 text-ink-700">{pending.reason}</p>}
            {pending.reviewed && !pending.hold && <OpenerReviewNote className="mt-2" />}
            {!pending.hold && (
              <button
                type="button"
                onClick={onEdit}
                className="mt-2 font-semibold text-primary-700 transition-colors hover:text-primary-800"
              >
                {t('messages.pending.edit', 'Edit and try again')}
              </button>
            )}
          </div>
        ) : (
          <span className="px-2 text-xs text-ink-500">
            {t(
              'messages.pending.checking',
              'Sending. First messages are checked before they are delivered.',
            )}
          </span>
        )}
      </Col>
    </Row>
  )
}
