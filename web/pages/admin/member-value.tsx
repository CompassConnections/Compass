import clsx from 'clsx'
import {IS_LOCAL} from 'common/hosting/constants'
import {
  MEMBER_VALUE_PART_DESCRIPTIONS,
  MEMBER_VALUE_PART_LABELS,
  MEMBER_VALUE_PARTS,
  MEMBER_VALUE_WEIGHTS,
  MemberValuePart,
  MemberValueRow,
} from 'common/member-value'
import {shortenNumber} from 'common/util/format'
import dayjs from 'dayjs'
import {orderBy} from 'lodash'
import {useMemo, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {Input} from 'web/components/widgets/input'
import {Table} from 'web/components/widgets/table'
import {Title} from 'web/components/widgets/title'
import {Tooltip} from 'web/components/widgets/tooltip'
import {UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'

/** How many rows to show before the "show everyone" button: the useful end of the ranking. */
const DEFAULT_LIMIT = 100

/** "Active" for the filter: the same window the recency credit treats as a full point. */
const ACTIVE_WINDOWS = {Everyone: 0, 'Seen in 30 days': 30, 'Seen in 90 days': 90} as const
type ActiveWindow = (typeof ACTIVE_WINDOWS)[keyof typeof ACTIVE_WINDOWS]

type SortKey =
  | 'score'
  | MemberValuePart
  | 'conversations'
  | 'charsSent'
  | 'replyRate'
  | 'referrals'
  | 'bioLength'
  | 'lastOnline'
  | 'joined'

/** One column header: the label, which key it sorts by, and a definition on hover. */
type Column = {key: SortKey; label: string; title: string; align?: 'right'}

const COLUMNS: Column[] = [
  {key: 'score', label: 'Score', title: 'Sum of the seven components, out of 100.', align: 'right'},
  ...MEMBER_VALUE_PARTS.map(
    (part): Column => ({
      key: part,
      label: `${MEMBER_VALUE_PART_LABELS[part]} /${MEMBER_VALUE_WEIGHTS[part]}`,
      title: MEMBER_VALUE_PART_DESCRIPTIONS[part],
      align: 'right',
    }),
  ),
  {
    key: 'conversations',
    label: 'Convs',
    title: 'Two-sided conversations · conversations they opened that got a reply / opened.',
    align: 'right',
  },
  {
    key: 'charsSent',
    label: '≈ Chars',
    title: 'Approximate characters written to other members, from the encrypted payload length.',
    align: 'right',
  },
  {
    key: 'replyRate',
    label: 'Replied',
    title: 'Conversations others opened with them that they answered.',
    align: 'right',
  },
  {
    key: 'referrals',
    label: 'Referrals',
    title: 'Members who joined from their link · of which wrote to someone.',
    align: 'right',
  },
  {
    key: 'bioLength',
    label: 'Bio',
    title: 'Bio length in characters. Hover a low profile score for what is missing.',
    align: 'right',
  },
  {key: 'lastOnline', label: 'Last seen', title: 'Last time they were online.'},
  {key: 'joined', label: 'Joined', title: 'Account creation.'},
]

const sortValue = (r: MemberValueRow, key: SortKey): number => {
  switch (key) {
    case 'score':
      return r.value.score
    case 'conversations':
      return r.input.conversations
    case 'charsSent':
      return r.input.charsSent
    case 'replyRate':
      return r.input.inbound ? r.input.inboundReplied / r.input.inbound : -1
    case 'referrals':
      return r.input.referrals
    case 'bioLength':
      return r.input.bioLength
    case 'lastOnline':
      return r.lastOnlineTime ? new Date(r.lastOnlineTime).valueOf() : 0
    case 'joined':
      return new Date(r.joinedTime).valueOf()
    default:
      return r.value.parts[key]
  }
}

/**
 * Every member ranked by how much they advance the mission — connections formed, connections helped
 * along, and the place kept alive. The score and its weights live in `common/member-value.ts`; this
 * page only shows the measurements next to the points they earn, so a surprising rank can be traced
 * to the behaviour behind it rather than argued with.
 */
export default function AdminMemberValue() {
  const isAdmin = useAdmin()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('score')
  const [activeDays, setActiveDays] = useState<ActiveWindow>(0)
  const [showAll, setShowAll] = useState(false)

  const {data} = useAPIGetter('get-member-value-ranking', {})
  const rows = data?.rows ?? []

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const cutoff = activeDays ? dayjs().subtract(activeDays, 'day') : null
    const matched = rows.filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q) || r.username.toLowerCase().includes(q)) &&
        (!cutoff || (r.lastOnlineTime && dayjs(r.lastOnlineTime).isAfter(cutoff))),
    )
    // Ties broken by total score, so a column of zeros still reads in a sensible order.
    return orderBy(matched, [(r) => sortValue(r, sort), (r) => r.value.score], ['desc', 'desc'])
  }, [rows, query, sort, activeDays])

  const shown = showAll ? visible : visible.slice(0, DEFAULT_LIMIT)

  if (!(isAdmin || IS_LOCAL)) return <p>Not authorized</p>

  return (
    <PageBase className="col-span-10 p-2 sm:pt-0">
      <NoSEO />
      <Col className="text-ink-900 mx-4 my-4 gap-4">
        <Title>Value for Compass</Title>
        <p className="text-ink-600 max-w-3xl text-sm">
          Members ranked by how much they advance the mission: deep connections formed, connections
          helped along for others, and the place kept alive. Every number is a measured behaviour
          and nothing is decrypted — message volume is read off the encrypted payload length.
          Threads with you are excluded from every conversation measure, so this scores the product,
          not your outreach. Hover a column header for its definition; click it to sort.
        </p>

        <Row className="flex-wrap items-center gap-3">
          <ChoicesToggleGroup
            currentChoice={activeDays}
            choicesMap={ACTIVE_WINDOWS}
            setChoice={(choice) => setActiveDays(choice ?? 0)}
          />
          <Input
            value={query}
            placeholder="Search name or username"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="h-10 w-64"
            searchIcon
          />
          <span className="text-ink-500 text-sm">
            {visible.length} of {rows.length}
            {data && ` · computed ${dayjs(data.computedAt).format('HH:mm')}`}
          </span>
        </Row>

        {!data && <div className="text-ink-500 text-sm">Computing… this reads every message.</div>}

        {data && (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-canvas-300 border-b">
                  <th className="text-ink-400 font-normal">#</th>
                  <th>Member</th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      title={c.title}
                      onClick={() => setSort(c.key)}
                      className={clsx(
                        'cursor-pointer select-none hover:underline',
                        c.align === 'right' && 'text-right',
                        sort === c.key && 'text-primary-700',
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <MemberRow key={r.id} row={r} rank={i + 1} sort={sort} />
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {!showAll && visible.length > DEFAULT_LIMIT && (
          <button
            className="text-primary-700 self-start text-sm hover:underline"
            onClick={() => setShowAll(true)}
          >
            Show all {visible.length}
          </button>
        )}
      </Col>
    </PageBase>
  )
}

function MemberRow(props: {row: MemberValueRow; rank: number; sort: SortKey}) {
  const {row, rank, sort} = props
  const {input, value} = row

  const replied = input.inbound ? (
    <Tooltip text={`${input.inboundReplied} answered of ${input.inbound} received`}>
      {Math.round((100 * input.inboundReplied) / input.inbound)}%
    </Tooltip>
  ) : (
    <span className="text-ink-300">—</span>
  )

  return (
    <tr className="border-canvas-200 border-b">
      <td className="text-ink-400 tabular-nums">{rank}</td>
      <td>
        <UserAvatarAndBadge
          user={{
            id: row.id,
            name: row.name,
            username: row.username,
            avatarUrl: row.avatarUrl ?? undefined,
          }}
        />
      </td>
      <Cell active={sort === 'score'} className="font-semibold">
        {value.score.toFixed(1)}
      </Cell>
      {MEMBER_VALUE_PARTS.map((part) => (
        <Cell key={part} active={sort === part}>
          {part === 'profile' && row.missing.length > 0 ? (
            <Tooltip text={`Missing: ${row.missing.join(', ')}`}>
              {value.parts[part].toFixed(1)}
            </Tooltip>
          ) : (
            value.parts[part].toFixed(1)
          )}
        </Cell>
      ))}
      <Cell active={sort === 'conversations'}>
        {input.conversations}
        <Dim>
          {' '}
          · {input.initiatedReplied}/{input.initiated}
        </Dim>
      </Cell>
      <Cell active={sort === 'charsSent'}>{shortenNumber(input.charsSent)}</Cell>
      <Cell active={sort === 'replyRate'}>{replied}</Cell>
      <Cell active={sort === 'referrals'}>
        {input.referrals}
        {input.referrals > 0 && <Dim> · {input.referralsActive}</Dim>}
      </Cell>
      <Cell active={sort === 'bioLength'}>{input.bioLength}</Cell>
      <td className={clsx(sort === 'lastOnline' && 'text-primary-700')}>
        {row.lastOnlineTime ? (
          <Tooltip text={dayjs(row.lastOnlineTime).format('YYYY-MM-DD HH:mm')}>
            {dayjs(row.lastOnlineTime).fromNow()}
          </Tooltip>
        ) : (
          <span className="text-ink-300">never</span>
        )}
      </td>
      <td className={clsx(sort === 'joined' && 'text-primary-700')}>
        {dayjs(row.joinedTime).format('YYYY-MM-DD')}
      </td>
    </tr>
  )
}

function Cell(props: {active: boolean; className?: string; children: React.ReactNode}) {
  const {active, className, children} = props
  return (
    <td className={clsx('text-right tabular-nums', active && 'text-primary-700', className)}>
      {children}
    </td>
  )
}

function Dim(props: {children: React.ReactNode}) {
  return <span className="text-ink-400 text-xs">{props.children}</span>
}
