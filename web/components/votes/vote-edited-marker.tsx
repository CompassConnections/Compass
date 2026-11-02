import {JSONContent} from '@tiptap/core'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {Content} from 'web/components/widgets/editor'
import {useT} from 'web/lib/locale'
import {db} from 'web/lib/supabase/db'

type VoteEdit = {id: number; title: string; description: JSONContent | null; createdTime: number}

/**
 * "(edited)" on a proposal, opening its previous versions. Same idea as the marker on a comment, and
 * more important here: the proposal is the thing people voted on, so a reader who arrives after an
 * edit needs to be able to see what the earlier voters actually agreed to. The versions are public
 * for the same reason.
 *
 * Renders nothing until the proposal has been edited, so it can sit unconditionally next to the
 * byline on the page and the author on the card.
 */
export function VoteEditedMarker(props: {voteId: number; editedTime: string | null | undefined}) {
  const {voteId, editedTime} = props
  const t = useT()
  const [open, setOpen] = useState(false)
  const [edits, setEdits] = useState<VoteEdit[]>()

  useEffect(() => {
    if (!open || edits) return
    ;(async () => {
      const {data, error} = await db
        .from('vote_edits')
        .select('*')
        .eq('vote_id', voteId)
        .order('created_time', {ascending: false})
      if (error) {
        console.error(error)
        return
      }
      setEdits(
        (data ?? []).map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description as JSONContent | null,
          createdTime: new Date(e.created_time).valueOf(),
        })),
      )
    })()
  }, [open, edits, voteId])

  if (!editedTime) return null

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // The card wraps this in a link row; the marker must open the modal, not navigate.
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="text-ink-400 hover:text-primary-700 whitespace-nowrap text-xs italic"
      >
        {t('vote.edited', '(edited)')}
      </button>
      <Modal size="md" open={open} setOpen={setOpen}>
        <Col className="bg-canvas-0 gap-3 rounded-2xl p-4">
          <h3 className="font-heading text-lg text-ink-900">
            {t('vote.edit_history', 'Previous versions')}
          </h3>
          <p className="text-xs text-ink-500">
            {t(
              'vote.edit_history.hint',
              'Each version is shown as it stood until the time below, newest first.',
            )}
          </p>
          {!edits ? (
            <span className="text-sm text-ink-500">{t('vote.comments.loading', 'Loading...')}</span>
          ) : edits.length === 0 ? (
            <span className="text-sm text-ink-500">
              {t('vote.edit_history.empty', 'No earlier version recorded.')}
            </span>
          ) : (
            edits.map((edit) => (
              <Col key={edit.id} className="bg-canvas-100 gap-1 rounded-xl p-3">
                <span className="text-xs text-ink-500">
                  {new Date(edit.createdTime).toLocaleString()}
                </span>
                <span className="font-heading font-medium text-ink-900">{edit.title}</span>
                {edit.description && <Content size="sm" content={edit.description} />}
              </Col>
            ))
          )}
        </Col>
      </Modal>
    </>
  )
}
