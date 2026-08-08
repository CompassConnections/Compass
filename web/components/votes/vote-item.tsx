import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {type VoteComment} from 'common/comment'
import {Row as rowFor} from 'common/supabase/utils'
import {richTextToString} from 'common/util/parse'
import {STANCE_CHOICES, STATUS_CHOICES} from 'common/votes/constants'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {VoteButtons} from 'web/components/votes/vote-buttons'
import {Avatar} from 'web/components/widgets/avatar'
import {Content} from 'web/components/widgets/editor'
import {eyebrow, surface} from 'web/components/widgets/surface'
import {useUserInStore} from 'web/hooks/use-user-supabase'
import {useT} from 'web/lib/locale'
import {type TopArguments} from 'web/lib/supabase/votes'

export type Vote = rowFor<'votes'> & {
  votes_for: number
  votes_against: number
  votes_abstain: number
  priority: number
  comment_count: number
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

// A short taste of each side's case, so the list itself carries some of the discussion rather than
// only a comment count. A count tells you a thread exists; this tells you whether it raised anything
// that should change your mind before you hit a vote button that is right there on the card.
function ArgumentPreview(props: {voteId: number; comment: VoteComment; stance: 'for' | 'against'}) {
  const {voteId, comment, stance} = props
  const t = useT()

  return (
    <Link
      href={`/vote/${voteId}#comment-${comment.id}`}
      className={clsx(
        'group flex flex-col gap-1 rounded-lg border-l-2 bg-canvas-100/50 px-3 py-2',
        'transition-colors hover:bg-canvas-100',
        stance === 'for' ? 'border-green-500' : 'border-red-500',
      )}
    >
      <span
        className={clsx(
          'text-[0.65rem] font-bold uppercase tracking-wide',
          stance === 'for' ? 'text-green-700' : 'text-red-700',
        )}
      >
        {stance === 'for'
          ? t('vote.stance.for', STANCE_CHOICES.for)
          : t('vote.stance.against', STANCE_CHOICES.against)}
      </span>
      {/* Plain text, not <Content>: a rendered rich-text body would drag its own headings, images
          and spacing into a three-line teaser. */}
      <p className="line-clamp-3 text-sm text-ink-700">{richTextToString(comment.content)}</p>
      <span className="text-xs text-ink-500 group-hover:text-primary-700">
        — {comment.userName}
      </span>
    </Link>
  )
}

export function VoteItem(props: {
  vote: Vote
  topArguments?: TopArguments
  onVoted?: () => void | Promise<void>
}) {
  const {vote, topArguments, onVoted} = props
  const t = useT()
  const topFor = topArguments?.for
  const topAgainst = topArguments?.against
  return (
    <Col
      className={clsx(
        surface,
        'mb-4 p-4 sm:p-5 transition-[--tw-ring-color] duration-200 hover:ring-primary-300',
      )}
    >
      <Row className="items-start justify-between gap-3">
        {/* The title is the permalink: a proposal needs its own URL before its discussion can be
            linked to from a notification, a message, or anywhere else. */}
        <Link
          href={`/vote/${vote.id}`}
          className="font-heading font-medium text-xl text-ink-900 leading-snug hover:text-primary-700"
        >
          {vote.title}
        </Link>
        {vote.status && <StatusPill status={vote.status} />}
      </Row>

      <Col className="mt-1 text-sm text-ink-600">
        <Content className="w-full" content={vote.description as JSONContent} />
      </Col>

      {(topFor || topAgainst) && (
        <Col className="mt-3 gap-2">
          <p className={clsx(eyebrow, 'text-ink-500')}>
            {t('vote.comments.highlighted', 'Highlighted arguments')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {topFor && <ArgumentPreview voteId={vote.id} comment={topFor} stance="for" />}
            {topAgainst && (
              <ArgumentPreview voteId={vote.id} comment={topAgainst} stance="against" />
            )}
          </div>
        </Col>
      )}

      <Row className="mt-3 items-center justify-between gap-2 flex-wrap text-sm">
        <Row className="items-center gap-3">
          {!vote.is_anonymous ? <Creator creatorId={vote.creator_id} /> : <span />}
          <Link
            href={`/vote/${vote.id}`}
            className="text-ink-500 hover:text-primary-700 whitespace-nowrap"
          >
            {vote.comment_count
              ? `💬 ${vote.comment_count} ${
                  vote.comment_count === 1
                    ? t('vote.comments.count_one', 'comment')
                    : t('vote.comments.count_other', 'comments')
                }`
              : t('vote.comments.start', '💬 Start the discussion')}
          </Link>
        </Row>
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
