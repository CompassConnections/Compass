import {JSONContent} from '@tiptap/core'
import {MAX_DESCRIPTION_LENGTH} from 'common/envs/constants'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {linkifyUrls} from 'web/components/editor/autolink'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {type Vote} from 'web/components/votes/vote-item'
import {TextEditor, useTextEditor} from 'web/components/widgets/editor'
import {Input} from 'web/components/widgets/input'
import {useEvent} from 'web/hooks/use-event'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

/**
 * Inline editor for a proposal's title and description, prefilled with the current text. Same cap
 * and same linkify pass as posting a new one. Saving goes through `edit-vote`, which archives the
 * version being replaced — the editor itself does not need to know about the record.
 */
export function VoteEditor(props: {vote: Vote; onDone: () => void; onSaved: () => void}) {
  const {vote, onDone, onSaved} = props
  const t = useT()
  const [title, setTitle] = useState(vote.title)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const editor = useTextEditor({
    // No `key`: the draft autosave is for composing something new. Restoring a stale draft over the
    // text you are trying to correct would be the opposite of helpful.
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: vote.description as JSONContent,
  })

  const missing = !title.trim()
    ? t('vote.form.needs_title', 'Add a title to post this proposal.')
    : undefined

  const save = useEvent(async () => {
    if (!editor || missing || isSubmitting) return
    setIsSubmitting(true)
    try {
      linkifyUrls(editor)
      await api('edit-vote', {
        voteId: vote.id,
        title: title.trim(),
        description: editor.getJSON() as JSONContent,
      })
      track('edit vote', {voteId: vote.id})
      toast.success(t('vote.edit.saved', 'Proposal updated'))
      onSaved()
    } catch (e) {
      console.error(e)
      toast.error(t('vote.edit.error', "Couldn't save the edit. Try again?"))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Col className="gap-3">
      <Col className="gap-1.5">
        <label htmlFor="proposal-edit-title" className="text-sm font-semibold text-ink-800">
          {t('vote.form.title_label', 'Title')}
        </label>
        <Input
          id="proposal-edit-title"
          value={title}
          className="w-full"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />
      </Col>
      <Col className="gap-1.5">
        <p className="text-sm font-semibold text-ink-800">
          {t('vote.form.description_label', 'Description')}
        </p>
        <TextEditor editor={editor} />
      </Col>
      <p className="text-xs text-ink-500">
        {t(
          'vote.edit.history_hint',
          'The current version stays visible to everyone under "(edited)" after you save — voters can always check what changed.',
        )}
      </p>
      <Row className="items-center justify-end gap-3 flex-wrap">
        {missing && <span className="text-xs text-ink-500">{missing}</span>}
        <Button size="sm" color="gray-outline" onClick={onDone} disabled={isSubmitting}>
          {t('vote.edit.cancel', 'Cancel')}
        </Button>
        <Button
          size="sm"
          color="cta"
          disabled={!!missing || isSubmitting}
          loading={isSubmitting}
          onClick={save}
        >
          {t('vote.edit.save', 'Save')}
        </Button>
      </Row>
    </Col>
  )
}
