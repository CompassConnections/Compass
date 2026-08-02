import clsx from 'clsx'
import {IS_LOCAL} from 'common/hosting/constants'
import {
  MAX_NEXT_ACTION_LENGTH,
  OUTREACH_STAGE_LABELS,
  OUTREACH_STAGES,
  OutreachRow,
  OutreachStage,
  OutreachStatus,
} from 'common/outreach/outreach'
import {groupBy, orderBy} from 'lodash'
import Link from 'next/link'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {Input} from 'web/components/widgets/input'
import {Select} from 'web/components/widgets/select'
import {UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {usePersistentQueryState} from 'web/hooks/use-persistent-query-state'
import {api} from 'web/lib/api'

// Ordered by what needs doing, not alphabetically: an unanswered reply is a debt, a new member is an
// opportunity, and everything else can wait until those two are empty.
const STATUS_ORDER: OutreachStatus[] = ['needs_reply', 'not_contacted', 'awaiting_reply', 'dormant']

const STATUS_LABELS: Record<OutreachStatus, string> = {
  needs_reply: 'They replied — owe them an answer',
  not_contacted: 'Never contacted',
  awaiting_reply: 'Waiting on them',
  dormant: 'Gone quiet',
}

const TIER_CLASS: Record<string, string> = {
  A: 'bg-primary-100 text-primary-700',
  B: 'bg-canvas-100 text-ink-700',
  C: 'bg-canvas-50 text-ink-400',
}

const sortGroup = (status: OutreachStatus, rows: OutreachRow[]) => {
  if (status === 'not_contacted') {
    // Best profile first, and among equals the one who joined longest ago — they have been waiting.
    return orderBy(rows, ['tier', 'daysSinceSignup'], ['asc', 'desc'])
  }
  // Longest silence first everywhere else.
  return orderBy(rows, [(r) => r.daysSinceLastMessage ?? 0], ['desc'])
}

export default function Outreach() {
  const [newMemberLimitQ, setNewMemberLimitQ] = usePersistentQueryState('n', '20')
  const newMemberLimit = parseInt(newMemberLimitQ ?? '20')

  const {data, refresh} = useAPIGetter('get-outreach-queue', {newMemberLimit})

  // Written-through edits, so a stage change shows immediately instead of after a refetch.
  const [edits, setEdits] = useState<Record<string, {stage?: OutreachStage; nextAction?: string}>>(
    {},
  )

  const isAdmin = useAdmin()
  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  const rows = (data?.rows ?? []).map((row) => ({...row, ...edits[row.user.id]}))
  const byStatus = groupBy(rows, 'status')

  const save = async (
    userId: string,
    update: {stage?: OutreachStage; nextAction?: string | null},
  ) => {
    setEdits((prev) => ({...prev, [userId]: {...prev[userId], ...update} as any}))
    await api('update-outreach-contact', {userId, ...update})
  }

  return (
    <PageBase className="col-span-10 p-2 sm:pt-0">
      <Col className={'text-ink-900 mx-4 my-4 gap-6'}>
        <NoSEO />

        <Row className={'items-baseline gap-3'}>
          <div className={'text-primary-700 text-2xl'}>Outreach</div>
          <div className={'text-ink-500 text-sm'}>
            {rows.length} members · every open conversation, plus the {newMemberLimit} newest
            members nobody has written to yet
          </div>
          <Select
            className={'!h-8 !py-0 !pl-2 !pr-8 !text-xs'}
            value={newMemberLimitQ ?? '20'}
            onChange={(e) => setNewMemberLimitQ(e.target.value)}
          >
            {['10', '20', '50', '100'].map((n) => (
              <option key={n} value={n}>
                show {n} new
              </option>
            ))}
          </Select>
          <button className={'text-ink-500 text-xs underline'} onClick={refresh}>
            refresh
          </button>
        </Row>

        {STATUS_ORDER.map((status) => {
          const group = byStatus[status] ?? []
          if (!group.length) return null

          return (
            <Col key={status} className={'gap-2'}>
              <Row className={'items-baseline gap-2'}>
                <div className={'text-ink-800 text-lg'}>{STATUS_LABELS[status]}</div>
                <div className={'text-ink-400 text-sm'}>{group.length}</div>
              </Row>

              <div className={'overflow-x-auto'}>
                <table className={'w-full min-w-[60rem] text-sm'}>
                  <thead className={'text-ink-400 text-left text-xs uppercase'}>
                    <tr>
                      <th className={'py-1 pr-3 font-normal'}>Member</th>
                      <th className={'py-1 pr-3 font-normal'}>Tier</th>
                      <th className={'py-1 pr-3 font-normal'}>Profile</th>
                      <th className={'py-1 pr-3 font-normal'}>Joined</th>
                      <th className={'py-1 pr-3 font-normal'}>Silence</th>
                      <th className={'py-1 pr-3 font-normal'}>Seen</th>
                      <th className={'py-1 pr-3 font-normal'}>Saved</th>
                      <th className={'py-1 pr-3 font-normal'}>Brought</th>
                      <th className={'py-1 pr-3 font-normal'}>Stage</th>
                      <th className={'py-1 pr-3 font-normal'}>Next action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortGroup(status, group).map((row) => (
                      <OutreachTableRow key={row.user.id} row={row} onSave={save} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Col>
          )
        })}
      </Col>
    </PageBase>
  )
}

function OutreachTableRow(props: {
  row: OutreachRow
  onSave: (
    userId: string,
    update: {stage?: OutreachStage; nextAction?: string | null},
  ) => Promise<void>
}) {
  const {row, onSave} = props
  const [nextAction, setNextAction] = useState(row.nextAction ?? '')

  const days = (n: number | null) => (n === null ? '—' : `${n}d`)

  return (
    <tr className={'border-canvas-100 border-t align-middle'}>
      <td className={'py-2 pr-3'}>
        <Row className={'items-center gap-2'}>
          <UserAvatarAndBadge user={row.user} />
          {row.channelId !== null && (
            <Link
              className={'text-primary-600 text-xs underline'}
              href={`/messages/${row.channelId}`}
            >
              thread
            </Link>
          )}
        </Row>
      </td>

      <td className={'py-2 pr-3'}>
        <span className={clsx('rounded px-1.5 py-0.5 text-xs', TIER_CLASS[row.tier])}>
          {row.tier}
        </span>
      </td>

      {/* The missing fields are the whole point of showing a percentage — they are what you'd tell
          them to go fix. */}
      <td className={'py-2 pr-3'} title={row.completeness.missing.join(', ') || 'nothing missing'}>
        <span className={clsx(row.completeness.score < 0.35 && 'text-ink-400')}>
          {Math.round(row.completeness.score * 100)}%
        </span>
      </td>

      <td className={'text-ink-500 py-2 pr-3'}>{days(row.daysSinceSignup)}</td>
      <td className={'py-2 pr-3'}>{days(row.daysSinceLastMessage)}</td>
      <td className={'text-ink-500 py-2 pr-3'}>{days(row.daysSinceLastOnline)}</td>
      <td className={'text-ink-500 py-2 pr-3'}>{row.savedSearchCount || '—'}</td>
      <td className={clsx('py-2 pr-3', row.referredCount > 0 && 'text-primary-700')}>
        {row.referredCount || '—'}
      </td>

      <td className={'py-2 pr-3'}>
        <Select
          className={'!h-8 !py-0 !pl-2 !pr-8 !text-xs'}
          value={row.stage ?? 'not_started'}
          onChange={(e) => onSave(row.user.id, {stage: e.target.value as OutreachStage})}
        >
          {OUTREACH_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {OUTREACH_STAGE_LABELS[stage]}
            </option>
          ))}
        </Select>
      </td>

      <td className={'py-2 pr-3'}>
        <Input
          className={'!h-8 w-64 !text-xs'}
          maxLength={MAX_NEXT_ACTION_LENGTH}
          placeholder={'what you owe them'}
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          onBlur={() => {
            if (nextAction !== (row.nextAction ?? '')) {
              onSave(row.user.id, {nextAction: nextAction || null})
            }
          }}
        />
      </td>
    </tr>
  )
}
