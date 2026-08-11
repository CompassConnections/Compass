import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {filterDefined} from 'common/util/array'
import {richTextToString} from 'common/util/parse'
import {isCommentable, STATUS_CHOICES, VOTE_STATUSES, type VoteStatus} from 'common/votes/constants'
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {RelativeTimestamp} from 'web/components/relative-timestamp'
import {SEO} from 'web/components/SEO'
import {choiceFromNumber, VoteButtons} from 'web/components/votes/vote-buttons'
import {VoteCommentSection} from 'web/components/votes/vote-comments'
import {Creator, STATUS_COLOR, Vote} from 'web/components/votes/vote-item'
import {Content} from 'web/components/widgets/editor'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import ShortToggle from 'web/components/widgets/short-toggle'
import {surface} from 'web/components/widgets/surface'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useLiveCommentsOnVote} from 'web/hooks/use-comments-on-vote'
import {useGetter} from 'web/hooks/use-getter'
import {useUser} from 'web/hooks/use-user'
import {useUserInStore} from 'web/hooks/use-user-supabase'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {getVote, getVoteResultsByUser} from 'web/lib/supabase/votes'

export default function VoteDetailPage() {
  const t = useT()
  const router = useRouter()
  const user = useUser()

  const rawId = router.query.id
  const voteId = typeof rawId === 'string' ? Number(rawId) : undefined
  const validId = voteId !== undefined && Number.isFinite(voteId)

  const {data: vote, refresh: refreshVote} = useGetter(
    'vote',
    validId ? {voteId: voteId!} : undefined,
    getVote,
  )
  const {data: choicesByUserId, refresh: refreshChoices} = useGetter(
    'vote-results',
    validId ? {voteId: voteId!} : undefined,
    getVoteResultsByUser,
  )
  const {comments, refresh: refreshComments} = useLiveCommentsOnVote(
    validId ? voteId : undefined,
    refreshVote,
  )

  // Anchor from a notification link (/vote/12#comment-34) — read once on mount rather than watched,
  // since the thread scrolls itself to the target and shouldn't yank the page afterwards.
  const [idInUrl, setIdInUrl] = useState<string>()
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const match = hash.match(/^#comment-(\d+)$/)
    if (match) setIdInUrl(match[1])
  }, [])

  if (!router.isReady || vote === undefined) {
    return (
      <PageBase trackPageView={'vote detail page'} className={'relative p-2 sm:pt-0'}>
        <CompassLoadingIndicator />
      </PageBase>
    )
  }

  if (!vote) {
    return (
      <PageBase trackPageView={'vote detail page'} className={'relative p-2 sm:pt-0'}>
        <Col className="mx-auto mt-10 max-w-3xl w-full items-center gap-2">
          <p className="font-heading text-lg text-ink-900">
            {t('vote.detail.not_found', 'Proposal not found')}
          </p>
          <Link href="/vote" className="text-primary-700 text-sm hover:underline">
            {t('vote.detail.back', 'Back to all proposals')}
          </Link>
        </Col>
      </PageBase>
    )
  }

  const typedVote = vote as Vote
  const canComment = isCommentable(typedVote.status)
  // Refetch both the thread and the proposal: the comment list is what renders, and the proposal row
  // carries the SQL-ranked highlighted pair, which a new argument can change.
  const onPosted = () => {
    refreshComments()
    refreshVote()
  }

  // Same two ids the proposal list puts on this proposal's card.
  const highlightedIds = filterDefined([
    typedVote.top_for?.id?.toString(),
    typedVote.top_against?.id?.toString(),
  ])

  return (
    <PageBase trackPageView={'vote detail page'} className={'relative p-2 sm:pt-0'}>
      <SEO
        title={typedVote.title}
        description={richTextToString(typedVote.description as JSONContent).slice(0, 200)}
        url={`/vote/${typedVote.id}`}
      />
      <Col className="mx-auto max-w-3xl w-full gap-6">
        <Link
          href="/vote"
          className="text-ink-600 hover:text-ink-900 flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('vote.detail.back', 'Back to all proposals')}
        </Link>

        <Col className={clsx(surface, 'p-4 sm:p-5 gap-3')}>
          <Row className="items-start justify-between gap-3">
            <h1 className="font-heading font-medium text-2xl text-ink-900 leading-snug">
              {typedVote.title}
            </h1>
            {typedVote.status && (
              <span
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
                  STATUS_COLOR[typedVote.status] ?? 'bg-canvas-200 text-ink-600',
                )}
              >
                {t(`vote.status.${typedVote.status}`, STATUS_CHOICES[typedVote.status])}
              </span>
            )}
          </Row>

          <Byline vote={typedVote} />

          <Content className="w-full" content={typedVote.description as JSONContent} />

          <div className="h-px bg-canvas-200/60" />

          <AdminStatusPicker
            voteId={typedVote.id}
            status={typedVote.status}
            onUpdated={refreshVote}
          />

          <Row className="items-center justify-between gap-3 flex-wrap">
            <VoteButtons
              voteId={typedVote.id}
              counts={{
                for: typedVote.votes_for,
                abstain: typedVote.votes_abstain,
                against: typedVote.votes_against,
              }}
              // The same ballots that label the comments below say which button is the viewer's own,
              // so the highlight costs no extra query here.
              userChoice={choiceFromNumber(user ? choicesByUserId?.[user.id] : undefined)}
              onVoted={() => {
                refreshVote()
                // The ballots feed the "voted For" badges and the composer's default stance, so a
                // vote cast on this page has to invalidate them too — not just the tallies.
                refreshChoices()
              }}
              disabled={typedVote.status !== 'voting_open'}
            />
            {user && <MuteToggle voteId={typedVote.id} />}
          </Row>

          {typedVote.status === 'voting_open' && (
            <p className="text-xs text-ink-500">
              {t(
                'vote.detail.change_vote_hint',
                'You can change your vote at any time while voting is open — read the arguments below first.',
              )}
            </p>
          )}
        </Col>

        <VoteCommentSection
          voteId={typedVote.id}
          comments={comments}
          choicesByUserId={choicesByUserId ?? {}}
          canComment={canComment}
          highlightedIds={highlightedIds}
          onPosted={onPosted}
          idInUrl={idInUrl}
        />
      </Col>
    </PageBase>
  )
}

/**
 * Who proposed this, and when — the same author link the proposal list puts on each card, which this
 * page was missing entirely. Arriving here from a notification or a shared link meant reading a
 * proposal with no idea who was asking for it.
 *
 * Anonymous proposals say so rather than rendering an empty row: the list can leave the slot blank
 * because the card has other things in it, but here the byline is the only line in that position and
 * a gap would read as a failed lookup.
 */
function Byline(props: {vote: Vote}) {
  const {vote} = props
  const t = useT()
  const creator = useUserInStore(vote.is_anonymous ? null : vote.creator_id)

  return (
    <Row className="items-center gap-2 text-sm text-ink-500">
      {vote.is_anonymous ? (
        <span>{t('vote.detail.anonymous_author', 'Anonymous')}</span>
      ) : (
        <Creator creator={creator ?? undefined} />
      )}
      {vote.created_time && (
        <RelativeTimestamp time={new Date(vote.created_time).valueOf()} shortened />
      )}
    </Row>
  )
}

/**
 * Renders nothing for everyone except admins. Placed on the proposal itself rather than behind an
 * admin page because the decision "this is now Rejected" is made while reading the thread and the
 * tally, and a separate screen would mean making it away from both.
 *
 * `useAdmin` is a client-side convenience only — `update-vote-status` re-checks `isAdminId` server
 * side, which is what actually holds.
 */
function AdminStatusPicker(props: {
  voteId: number
  status: string | null
  onUpdated: () => void | Promise<void>
}) {
  const {voteId, status, onUpdated} = props
  const t = useT()
  const isAdmin = useAdmin()
  const [saving, setSaving] = useState(false)

  if (!isAdmin) return null

  return (
    <Row className="items-center gap-2 rounded-lg border border-dashed border-canvas-200 px-3 py-2 text-sm">
      <span className="text-ink-500">{t('vote.admin.status_label', 'Admin — status:')}</span>
      <select
        value={status ?? ''}
        disabled={saving}
        onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
          const next = e.target.value as VoteStatus
          setSaving(true)
          try {
            await toast.promise(api('update-vote-status', {voteId, status: next}), {
              loading: t('vote.admin.saving', 'Updating status...'),
              success: `${t('vote.admin.saved', 'Status set to')} ${t(
                `vote.status.${next}`,
                STATUS_CHOICES[next],
              )}`,
              error: t('vote.admin.error', 'Failed to update status — please try again'),
            })
            await onUpdated()
          } finally {
            setSaving(false)
          }
        }}
        className="rounded-full border border-canvas-200 bg-canvas-50 px-3 py-1.5 text-sm text-ink-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50"
      >
        {VOTE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`vote.status.${s}`, STATUS_CHOICES[s])}
          </option>
        ))}
      </select>
      {!isCommentable(status) && (
        <span className="text-xs text-ink-500">
          {t('vote.admin.closed_hint', '(voting and discussion are closed at this status)')}
        </span>
      )}
    </Row>
  )
}

function MuteToggle(props: {voteId: number}) {
  const {voteId} = props
  const t = useT()
  const {data} = useAPIGetter('get-vote-mute', {voteId})
  const [muted, setMuted] = useState<boolean>()

  const on = muted ?? data?.muted ?? false

  return (
    <Row className="items-center gap-2 text-sm text-ink-600">
      <ShortToggle
        on={on}
        setOn={(next: boolean) => {
          setMuted(next)
          toast.promise(api('set-vote-mute', {voteId, muted: next}), {
            loading: next
              ? t('vote.mute.muting', 'Muting this discussion...')
              : t('vote.mute.unmuting', 'Unmuting this discussion...'),
            success: next
              ? t('vote.mute.muted', 'Muted — you will not be notified about this proposal')
              : t('vote.mute.unmuted', 'Unmuted — you will hear about new arguments'),
            error: t('vote.mute.error', 'Failed to update — please try again'),
          })
        }}
      />
      <span>{t('vote.mute.label', 'Mute this discussion')}</span>
    </Row>
  )
}
