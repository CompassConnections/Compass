import clsx from 'clsx'
import {IS_LOCAL} from 'common/hosting/constants'
import {
  MAX_MODERATOR_NOTE_LENGTH,
  ModTestimonial,
  TESTIMONIAL_STATUS_LABELS,
  TestimonialStatus,
} from 'common/testimonials/testimonials'
import {groupBy} from 'lodash'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {TestimonialCard} from 'web/components/testimonials/testimonial-card'
import {
  TestimonialModControls,
  TestimonialPatch,
} from 'web/components/testimonials/testimonial-mod-controls'
import {Input} from 'web/components/widgets/input'
import {useAdminOrMod} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {api} from 'web/lib/api'

// Pending first: it is the only group that represents work owed. Rejected last, because it is an
// archive rather than a queue.
const STATUS_ORDER: TestimonialStatus[] = ['pending', 'approved', 'hidden', 'rejected']

const GROUP_NOTE: Record<TestimonialStatus, string> = {
  pending: 'Nobody has seen these yet. Approving one puts it on /testimonials.',
  approved: 'Live on /testimonials. Featured ones sort to the top.',
  hidden: 'Was live, then taken down. Restoring puts it straight back.',
  rejected: 'Never published. The author can write a new one.',
}

export default function AdminTestimonials() {
  const isMod = useAdminOrMod()

  const {data, refresh} = useAPIGetter('get-testimonials-mod', {})

  const [edits, setEdits] = useState<Record<number, TestimonialPatch>>({})
  const [busyId, setBusyId] = useState<number | null>(null)

  if (!(isMod || IS_LOCAL)) return <p>Not authorized</p>

  const rows: ModTestimonial[] = (data?.testimonials ?? []).map((row) => ({
    ...row,
    ...edits[row.id],
  }))
  const byStatus = groupBy(rows, 'status')

  const moderate = async (id: number, patch: TestimonialPatch) => {
    setBusyId(id)
    setEdits((prev) => ({...prev, [id]: {...prev[id], ...patch}}))
    try {
      await api('update-testimonial-status', {id, ...patch})
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageBase className="col-span-10 p-2 sm:pt-0">
      <NoSEO />
      <Col className="text-ink-900 mx-4 my-4 gap-8">
        <Col className="gap-1">
          <Row className="items-baseline gap-3">
            <div className="text-primary-700 text-2xl">Testimonials</div>
            <div className="text-ink-500 text-sm">{rows.length} total</div>
            <button className="text-ink-500 text-xs underline" onClick={refresh}>
              refresh
            </button>
          </Row>
          <div className="text-ink-500 text-sm">
            Everything ever submitted. The same approve and reject buttons also sit on{' '}
            <a className="text-primary-600 underline" href="/testimonials">
              /testimonials
            </a>
            , which is usually the faster place to clear the queue.
          </div>
        </Col>

        {rows.length === 0 && <div className="text-ink-400 text-sm">Nothing submitted yet.</div>}

        {STATUS_ORDER.map((status) => {
          const group = byStatus[status] ?? []
          if (!group.length) return null

          return (
            <Col key={status} className="gap-3">
              <Col className="gap-0.5">
                <Row className="items-baseline gap-2">
                  <div className="text-ink-800 text-lg">{TESTIMONIAL_STATUS_LABELS[status]}</div>
                  <div className="text-ink-400 text-sm tabular-nums">{group.length}</div>
                </Row>
                <div className="text-ink-400 text-xs">{GROUP_NOTE[status]}</div>
              </Col>

              <div className="columns-1 gap-5 lg:columns-2 xl:columns-3">
                {group.map((row) => (
                  <div key={row.id} className="mb-5 break-inside-avoid">
                    <TestimonialCard
                      testimonial={row}
                      // A rejected or taken-down card should not look publishable at a glance.
                      className={clsx(
                        (row.status === 'rejected' || row.status === 'hidden') && 'opacity-60',
                      )}
                    >
                      <TestimonialModControls
                        testimonial={row}
                        onUpdate={moderate}
                        busy={busyId === row.id}
                      />
                      <ModeratorNotes row={row} onSave={moderate} />
                    </TestimonialCard>
                  </div>
                ))}
              </div>
            </Col>
          )
        })}
      </Col>
    </PageBase>
  )
}

/**
 * The two fields that are moderator-only bookkeeping rather than a decision.
 *
 * `show_author = false` hides the name from the public card, so this strip is the only place the
 * author of an anonymous testimonial is visible — that is deliberate, since a takedown request has to
 * be traceable to whoever wrote the thing.
 */
function ModeratorNotes({
  row,
  onSave,
}: {
  row: ModTestimonial
  onSave: (id: number, patch: TestimonialPatch) => void
}) {
  const [note, setNote] = useState(row.moderatorNote ?? '')
  const [rank, setRank] = useState(row.featuredRank === null ? '' : String(row.featuredRank))

  return (
    <Col className="border-canvas-200/70 mt-3 gap-2 border-t border-dashed pt-3">
      <div className="text-ink-400 text-[11px]">
        {row.showAuthor ? 'Public' : 'Anonymous — written by'} {row.authorSnapshot.name}
        {row.authorSnapshot.username ? ` (@${row.authorSnapshot.username})` : ''}
        {row.authorId === null && ' · account deleted'}
      </div>

      <Row className="gap-2">
        <Input
          className="!h-8 flex-1 !text-xs"
          maxLength={MAX_MODERATOR_NOTE_LENGTH}
          placeholder="internal note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== (row.moderatorNote ?? '')) onSave(row.id, {moderatorNote: note || null})
          }}
        />
        <Input
          className="!h-8 w-24 !text-xs"
          type="number"
          min={0}
          max={1000}
          placeholder="rank"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          onBlur={() => {
            const next = rank === '' ? null : Number(rank)
            if (next !== row.featuredRank) onSave(row.id, {featuredRank: next})
          }}
        />
      </Row>
    </Col>
  )
}
