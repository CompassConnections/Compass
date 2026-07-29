import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {Row as rowFor} from 'common/supabase/utils'
import {STATUS_CHOICES} from 'common/votes/constants'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {VoteButtons} from 'web/components/votes/vote-buttons'
import {Avatar} from 'web/components/widgets/avatar'
import {Content} from 'web/components/widgets/editor'
import {surface} from 'web/components/widgets/surface'
import {useUserInStore} from 'web/hooks/use-user-supabase'
import {useT} from 'web/lib/locale'

export type Vote = rowFor<'votes'> & {
  votes_for: number
  votes_against: number
  votes_abstain: number
  priority: number
  status?: string
}

// Status pill colors. Grouped by outcome rather than by exact status so a reader can tell "this is
// settled and good" from "this is settled and bad" from "this is still moving" at a glance, without
// reading the label.
// No `dark:` overrides here: this palette's ramps (primary-*, green-*, red-*) already invert their
// CSS variables per theme — bg-primary-100/text-primary-700 resolves to a dark bronze pill with light
// legible text under the `dark` class with no extra classes needed. Adding `dark:text-primary-300`
// fought that inversion and landed on a dark-on-dark combination that was unreadable.
export const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-canvas-200 text-ink-600',
  under_review: 'bg-primary-100 text-primary-700',
  voting_open: 'bg-primary-100 text-primary-700',
  voting_closed: 'bg-canvas-200 text-ink-600',
  accepted: 'bg-green-100 text-green-700',
  pending: 'bg-green-100 text-green-700',
  implemented: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  superseded: 'bg-canvas-200 text-ink-600',
  expired: 'bg-canvas-200 text-ink-600',
  archived: 'bg-canvas-200 text-ink-600',
}

function StatusPill(props: {status: string}) {
  const {status} = props
  const t = useT()
  return (
    <span
      className={clsx(
        'rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        STATUS_COLOR[status] ?? 'bg-canvas-200 text-ink-600',
      )}
    >
      {t(`vote.status.${status}`, STATUS_CHOICES[status])}
    </span>
  )
}

function Creator(props: {creatorId: string}) {
  const {creatorId} = props
  const creator = useUserInStore(creatorId)
  if (!creator?.username) return null
  return (
    <Link
      href={`/${creator.username}`}
      className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900"
    >
      <Avatar username={creator.username} avatarUrl={creator.avatarUrl} size="2xs" noLink />
      {creator.username}
    </Link>
  )
}

export function VoteItem(props: {vote: Vote; onVoted?: () => void | Promise<void>}) {
  const {vote, onVoted} = props
  const t = useT()
  return (
    <Col
      className={clsx(
        surface,
        'mb-4 p-4 sm:p-5 transition-[--tw-ring-color] duration-200 hover:ring-primary-300',
      )}
    >
      <Row className="items-start justify-between gap-3">
        <p className="font-heading font-medium text-xl text-ink-900 leading-snug">{vote.title}</p>
        {vote.status && <StatusPill status={vote.status} />}
      </Row>

      <Col className="mt-1 text-sm text-ink-600">
        <Content className="w-full" content={vote.description as JSONContent} />
      </Col>

      <Row className="mt-3 items-center justify-between gap-2 flex-wrap text-sm">
        {!vote.is_anonymous ? <Creator creatorId={vote.creator_id} /> : <span />}
        {!!vote.priority && (
          <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
            {t('vote.priority', 'Priority')} {vote.priority.toFixed(0)}%
          </span>
        )}
      </Row>

      <div className="mt-4 h-px bg-canvas-200/60" />

      <Row className="mt-4">
        <VoteButtons
          voteId={vote.id}
          counts={{
            for: vote.votes_for,
            abstain: vote.votes_abstain,
            against: vote.votes_against,
          }}
          onVoted={onVoted}
          disabled={vote.status !== 'voting_open'}
        />
      </Row>
    </Col>
  )
}
