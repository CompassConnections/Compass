import {EyeSlashIcon, FlagIcon, PencilIcon} from '@heroicons/react/24/outline'
import {ArrowUturnLeftIcon, EllipsisHorizontalIcon} from '@heroicons/react/24/solid'
import {JSONContent} from '@tiptap/core'
import {Editor} from '@tiptap/react'
import clsx from 'clsx'
import {MAX_VOTE_COMMENT_LENGTH, ReplyToUserInfo, type VoteComment} from 'common/comment'
import {buildArray} from 'common/util/array'
import {Stance, STANCE_CHOICES, STANCES} from 'common/votes/constants'
import {buildThreads, CommentThread} from 'common/votes/discussion'
import {countBy} from 'lodash'
import {memo, ReactNode, useEffect, useMemo, useRef, useState} from 'react'
import {toast} from 'react-hot-toast'
import {IconButton} from 'web/components/buttons/button'
import {ReportModal} from 'web/components/buttons/report-button'
import {CommentInputTextArea} from 'web/components/comments/comment-input'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {ReplyToggle} from 'web/components/comments/reply-toggle'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {RelativeTimestamp} from 'web/components/relative-timestamp'
import {Avatar} from 'web/components/widgets/avatar'
import {Content, useTextEditor} from 'web/components/widgets/editor'
import {ShowMore} from 'web/components/widgets/show-more'
import {Tooltip} from 'web/components/widgets/tooltip'
import {UserLink} from 'web/components/widgets/user-link'
import {useAdmin} from 'web/hooks/use-admin'
import {useEvent} from 'web/hooks/use-event'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {firebaseLogin} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {db} from 'web/lib/supabase/db'
import {safeLocalStorage} from 'web/lib/util/local'
import {scrollIntoViewCentered} from 'web/lib/util/scroll'

// Same ramps as the vote buttons, so an "argument against" chip and the red Against button read as
// the same side of the same question without anyone having to learn a second colour language.
// 'both' is amber rather than a green/red blend: a muddy mix would read as a broken "for" chip. The
// two conversational stances (question / answer) share the neutral primary ramp so the eye separates
// "taking a side" from "clarifying" at a glance.
const STANCE_COLOR: Record<Stance, string> = {
  for: 'bg-green-100 text-green-700',
  against: 'bg-red-100 text-red-700',
  both: 'bg-yellow-100 text-yellow-800',
  question: 'bg-primary-100 text-primary-700',
  answer: 'bg-canvas-200 text-ink-700',
}

type StanceFilter = 'all' | Stance

export function VoteCommentSection(props: {
  voteId: number
  comments: VoteComment[]
  /** Recorded choice per user id (1 / 0 / -1), from vote_results. */
  choicesByUserId: Record<string, number>
  /** False once the proposal is settled: the thread stays readable but stops accepting new comments. */
  canComment: boolean
  /**
   * Ids of the comments to lift to the top, ranked by `get_votes_with_results`. Passed in rather
   * than computed here so the proposal page and the proposal list highlight the same two comments —
   * there is one ranking, and it lives in SQL.
   */
  highlightedIds?: string[]
  /** Refetch the thread after a post, so showing the new comment never depends on the websocket. */
  onPosted?: () => void
  idInUrl?: string
}) {
  const {voteId, comments, choicesByUserId, canComment, highlightedIds, onPosted, idInUrl} = props
  const t = useT()
  const user = useUser()
  const [filter, setFilter] = useState<StanceFilter>('all')

  // A comment the viewer deleted stays visible to them (as a "deleted" tombstone) so the delete
  // reads as having worked; for everyone else it's simply gone.
  const visible = useMemo(
    () => comments.filter((c) => !c.hidden || c.userId === user?.id),
    [comments, user?.id],
  )
  const threads = useMemo(() => buildThreads(visible), [visible])
  const threadsById = useMemo(() => new Map(threads.map((th) => [th.parent.id, th])), [threads])

  const counts = useMemo(() => countBy(threads, (th) => th.parent.stance ?? 'none'), [threads])

  // A stance chip vanishes once its last thread is deleted or filtered away; falling back to 'all'
  // stops that from stranding the reader on an empty list with no visibly-selected filter.
  const activeFilter = filter !== 'all' && !counts[filter] ? 'all' : filter

  // The default view deliberately isn't chronological: a reader who only skims the top should still
  // see the case from each side, rather than whatever happened to be posted first.
  const highlighted = useMemo(() => {
    if (activeFilter !== 'all' || !highlightedIds?.length) return []
    // Filtered against the live list so a comment deleted since the proposal was fetched can't be
    // rendered from a stale id.
    return highlightedIds.filter((id) => threadsById.has(id))
  }, [activeFilter, highlightedIds, threadsById])

  const highlightedSet = new Set(highlighted)
  const rest =
    activeFilter === 'all'
      ? threads.filter((th) => !highlightedSet.has(th.parent.id))
      : threads.filter((th) => th.parent.stance === activeFilter)

  // Only offer a filter for a stance that some thread actually has — same rule as the status filter
  // on the proposal list. With five stances, showing every chip unconditionally would be a row of
  // mostly-zero dead ends.
  const filters: {key: StanceFilter; label: string; count: number}[] = [
    {key: 'all', label: t('vote.comments.filter.all', 'All'), count: threads.length},
    ...STANCES.filter((s) => counts[s] > 0).map((s) => ({
      key: s as StanceFilter,
      label: t(`vote.stance.${s}`, STANCE_CHOICES[s]),
      count: counts[s],
    })),
  ]

  return (
    <Col className="gap-4">
      <Row className="items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading text-xl text-ink-900">
          {t('vote.comments.heading', 'Discussion')}{' '}
          <span className="text-ink-500 tabular-nums">({visible.length})</span>
        </h2>
        {threads.length > 0 && (
          <Row className="gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity',
                  f.key === 'all' ? 'bg-canvas-200 text-ink-600' : STANCE_COLOR[f.key],
                  activeFilter === f.key ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                )}
              >
                {f.label} <span className="tabular-nums">{f.count}</span>
              </button>
            ))}
          </Row>
        )}
      </Row>

      {canComment ? (
        // Collapsed by default, and the guidance rides inside it. Most visitors come to read the
        // arguments before voting, not to write one — leading with a composer plus four paragraphs
        // of writing advice pushes the actual thread below the fold for everyone.
        <ShowMore
          labelClosed={t('vote.comments.add', '+ Add an argument or a question')}
          labelOpen={t('vote.comments.hide', 'Hide')}
          className="mb-0"
        >
          <Col className="gap-3">
            <DiscussionGuidance />
            <VoteCommentInput
              voteId={voteId}
              askForStance
              userChoice={user ? choicesByUserId[user.id] : undefined}
              onPosted={onPosted}
            />
          </Col>
        </ShowMore>
      ) : (
        <p className="text-sm text-ink-500 italic">
          {t(
            'vote.comments.closed',
            'This proposal is settled, so its discussion is closed. Open a new proposal to reopen the question.',
          )}
        </p>
      )}

      {visible.length === 0 ? (
        // Only when the thread is still open: the empty state invites you to post, which contradicts
        // the "discussion is closed" line directly above it on a settled proposal. One or the other,
        // never both.
        canComment && (
          <p className="text-sm text-ink-600">
            {t(
              'vote.comments.empty',
              'No arguments yet. If you can see a risk or an unmentioned benefit in this proposal, this is the place to say so — everyone who already voted gets told.',
            )}
          </p>
        )
      ) : (
        <Col className="gap-2">
          {highlighted.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                {t('vote.comments.highlighted', 'Highlighted arguments')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {highlighted.map((id) => (
                  <VoteCommentThread
                    key={id}
                    voteId={voteId}
                    thread={threadsById.get(id)!}
                    choicesByUserId={choicesByUserId}
                    canComment={canComment}
                    onPosted={onPosted}
                    idInUrl={idInUrl}
                    className="rounded-lg bg-canvas-50 p-3 ring-1 ring-canvas-200/70"
                  />
                ))}
              </div>
              {rest.length > 0 && (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {t('vote.comments.everything_else', 'Everything else')}
                </p>
              )}
            </>
          )}
          {rest.map((thread) => (
            <VoteCommentThread
              key={thread.parent.id}
              voteId={voteId}
              thread={thread}
              choicesByUserId={choicesByUserId}
              canComment={canComment}
              onPosted={onPosted}
              idInUrl={idInUrl}
            />
          ))}
        </Col>
      )}
    </Col>
  )
}

/**
 * Sits directly above the input rather than behind a "guidelines" link, because the behaviour it
 * asks for — read everything first, then write something long — is exactly what someone skips when
 * the box is already in front of them. It is not dismissible for the same reason.
 */
function DiscussionGuidance() {
  const t = useT()

  const points = [
    t(
      'vote.comments.guidance.read',
      'Read every argument already posted, replies included, before you write. A point that has already been made and answered costs everyone time to read twice — and the reply you would have written may already be there.',
    ),
    t(
      'vote.comments.guidance.detail',
      'Take the time to write it properly. "This is a bad idea" changes nobody\'s vote; "this breaks X for people in situation Y, here is the case" does. Spell out the mechanism, name who is affected, and say what would change your mind.',
    ),
    t(
      'vote.comments.guidance.questions',
      'Ask questions that can actually be answered. Name the concrete case you are unsure about instead of asking whether a proposal has been "thought through".',
    ),
    t(
      'vote.comments.guidance.counter',
      'Anticipate the strongest objection to your own argument and answer it in the same comment. An argument that only survives because nobody thought of the obvious reply is not worth the votes it moves.',
    ),
  ]

  return (
    <Col className="gap-2 rounded-lg border border-canvas-200/70 bg-canvas-50/60 px-4 py-3">
      <p className="text-sm font-semibold text-ink-800">
        {t('vote.comments.guidance.title', 'This decision is only as good as this thread')}
      </p>
      <p className="text-sm text-ink-600">
        {t(
          'vote.comments.guidance.intro',
          'Everyone who has already voted is notified when you post, and many of them will re-read the proposal because of you. That is worth some care:',
        )}
      </p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-600 marker:text-ink-400">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </Col>
  )
}

function VoteCommentThread(props: {
  voteId: number
  thread: CommentThread
  choicesByUserId: Record<string, number>
  canComment: boolean
  onPosted?: () => void
  idInUrl?: string
  className?: string
}) {
  const {voteId, thread, choicesByUserId, canComment, onPosted, idInUrl, className} = props
  const {parent: parentComment, replies} = thread
  const user = useUser()
  const [replyToUserInfo, setReplyToUserInfo] = useState<ReplyToUserInfo>()

  const idInThisThread =
    idInUrl && [parentComment, ...replies].some((comment) => comment.id === idInUrl)
  const [seeReplies, setSeeReplies] = useState(!!idInThisThread)

  const onSeeRepliesClick = useEvent(() => setSeeReplies(!seeReplies))
  const clearReply = useEvent(() => setReplyToUserInfo(undefined))
  const onReplyClick = useEvent((comment: VoteComment) => {
    setSeeReplies(true)
    setReplyToUserInfo({id: comment.id, username: comment.userUsername})
  })

  return (
    <Col className={clsx('mt-3 items-stretch gap-3', className)}>
      <VoteCommentRow
        comment={parentComment}
        choice={choicesByUserId[parentComment.userId]}
        highlighted={idInUrl === parentComment.id}
        onReplyClick={canComment ? onReplyClick : undefined}
        canComment={canComment}
        onPosted={onPosted}
        isParent
      >
        <ReplyToggle
          seeReplies={seeReplies}
          numComments={replies.length}
          onSeeReplyClick={onSeeRepliesClick}
        />
      </VoteCommentRow>

      {seeReplies &&
        replies.map((comment) => (
          <VoteCommentRow
            key={comment.id}
            comment={comment}
            choice={choicesByUserId[comment.userId]}
            highlighted={idInUrl === comment.id}
            onReplyClick={canComment ? onReplyClick : undefined}
            canComment={canComment}
            onPosted={onPosted}
          />
        ))}

      {replyToUserInfo && (
        <div className="stop-prop flex">
          <div className="border-ink-100 -mt-3 ml-4 h-7 w-4 rounded-bl-xl border-b-2 border-l-2" />
          <VoteCommentInput
            voteId={voteId}
            parentCommentId={parentComment.id}
            replyToUserInfo={replyToUserInfo}
            clearReply={clearReply}
            parentStance={parentComment.stance}
            userChoice={user ? choicesByUserId[user.id] : undefined}
            askForStance
            onPosted={onPosted}
            className="w-full min-w-0 grow"
          />
        </div>
      )}
    </Col>
  )
}

// Renders from the denormalized author columns on the comment row and fetches nothing. It used to
// call useProfileByUserId for `pinned_url`, which on a thread of 28 comments meant 28 profile
// lookups — 112 requests, all for the same handful of people — to slightly freshen an avatar the
// comment row already carries. A stale avatar on an old comment is the right trade.
const VoteCommentRow = memo(function VoteCommentRow(props: {
  comment: VoteComment
  choice: number | undefined
  highlighted?: boolean
  onReplyClick?: (comment: VoteComment) => void
  /** False on a settled proposal, which freezes editing along with posting. */
  canComment?: boolean
  onPosted?: () => void
  children?: ReactNode
  isParent?: boolean
}) {
  const {highlighted, onReplyClick, children, isParent, choice, canComment, onPosted} = props
  const ref = useRef<HTMLDivElement>(null)
  const [comment, setComment] = useState(props.comment)
  const [isEditing, setIsEditing] = useState(false)
  const user = useUser()
  const {userUsername, userAvatarUrl, userId, hidden} = comment
  const t = useT()

  useEffect(() => {
    if (highlighted && ref.current) {
      scrollIntoViewCentered(ref.current)
    }
  }, [highlighted])

  // The row keeps a local copy so hide/undelete feels instant, which means it has to follow the prop
  // when an edit arrives — otherwise the author sees their own edit but nobody else's.
  useEffect(() => setComment(props.comment), [props.comment])

  return (
    <Col className="group" id={`comment-${comment.id}`}>
      <Row ref={ref} className={clsx(isParent ? 'gap-2' : 'gap-1')}>
        <Row className="relative">
          {!isParent && (
            <div className="border-ink-100 dark:border-ink-300 -mt-4 ml-4 h-6 w-4 rounded-bl-xl border-b-2 border-l-2" />
          )}
          <Avatar
            username={userUsername}
            size={isParent ? 'sm' : '2xs'}
            avatarUrl={userAvatarUrl}
          />
          {/* The spine starts at the bottom of the parent avatar rather than the top of the row.
              Avatar puts its className on the <img>, which is position:static, so a `z-10` there is
              inert and this absolutely-positioned line paints straight through the avatar — it read
              as a circle sliced in half. Replies are unaffected: their avatar sits right of left-4. */}
          <div
            className={clsx(
              'bg-ink-100 dark:bg-ink-300 absolute bottom-0 left-4 w-0.5 group-last:hidden ',
              isParent ? 'top-8' : '-top-1',
            )}
          />
        </Row>

        <Col
          className={clsx(
            'grow rounded-lg rounded-tl-none px-3 pb-0.5 pt-1 transition-colors',
            highlighted
              ? 'bg-primary-100 border-primary-300 border-2'
              : 'bg-canvas-50 drop-shadow-sm',
          )}
        >
          <Col className="text-ink-600 text-sm">
            <Row className="items-center gap-1 flex-wrap">
              <UserLink
                user={{id: userId, username: userUsername, name: comment.userName}}
                className="font-semibold"
              />
              {/* vote_results is public — this chip surfaces data anyone could already read, and
                  seeing that an argument comes from someone who voted the other way is most of its
                  value. */}
              {choice !== undefined && <VoteChip choice={choice} />}
              <RelativeTimestamp shortened={true} time={comment.createdTime} />
              <EditedMarker comment={comment} />
              <VoteCommentDotMenu
                comment={comment}
                onHide={() => setComment({...comment, hidden: !comment.hidden})}
                onEdit={
                  canComment && user?.id === comment.userId ? () => setIsEditing(true) : undefined
                }
              />
            </Row>
            {comment.stance && (
              <Row className="mt-1">
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    STANCE_COLOR[comment.stance],
                  )}
                >
                  {t(`vote.stance.${comment.stance}`, STANCE_CHOICES[comment.stance])}
                </span>
              </Row>
            )}
          </Col>

          {hidden ? (
            <span className="text-ink-500 text-sm italic">
              {t('vote.comments.deleted', 'Comment deleted')}
            </span>
          ) : isEditing ? (
            <VoteCommentEditor
              comment={comment}
              onDone={() => setIsEditing(false)}
              onSaved={(content) => {
                setComment((c) => ({...c, content, editedTime: Date.now()}))
                setIsEditing(false)
                onPosted?.()
              }}
            />
          ) : (
            <Content size="sm" className="mt-1 grow" content={comment.content} />
          )}

          <Row>
            {children}
            <Row className="grow items-center justify-end">
              {onReplyClick && (
                <Tooltip text={t('vote.comments.reply', 'Reply')} placement="bottom">
                  <IconButton
                    size="xs"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onReplyClick(comment)
                    }}
                    className="text-ink-500"
                  >
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                  </IconButton>
                </Tooltip>
              )}
            </Row>
          </Row>
        </Col>
      </Row>
    </Col>
  )
})

/**
 * "(edited)", opening the previous versions. Not a bare tag: on a proposal an argument is what moved
 * people's votes, so a reader who arrives after an edit needs to be able to see what they actually
 * agreed with. The versions are public for the same reason.
 */
function EditedMarker(props: {comment: VoteComment}) {
  const {comment} = props
  const t = useT()
  const [open, setOpen] = useState(false)
  const [edits, setEdits] = useState<{id: number; content: JSONContent; createdTime: number}[]>()

  useEffect(() => {
    if (!open || edits) return
    ;(async () => {
      const {data, error} = await db
        .from('vote_comment_edits')
        .select('*')
        .eq('comment_id', Number(comment.id))
        .order('created_time', {ascending: false})
      if (error) {
        console.error(error)
        return
      }
      setEdits(
        (data ?? []).map((e) => ({
          id: e.id,
          content: e.content as JSONContent,
          createdTime: new Date(e.created_time).valueOf(),
        })),
      )
    })()
  }, [open, edits, comment.id])

  if (!comment.editedTime) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-400 hover:text-primary-700 whitespace-nowrap text-xs italic"
      >
        {t('vote.comments.edited', '(edited)')}
      </button>
      <Modal size="md" open={open} setOpen={setOpen}>
        <Col className="bg-canvas-0 gap-3 rounded-2xl p-4">
          <h3 className="font-heading text-lg text-ink-900">
            {t('vote.comments.edit_history', 'Previous versions')}
          </h3>
          {!edits ? (
            <span className="text-sm text-ink-500">{t('vote.comments.loading', 'Loading...')}</span>
          ) : edits.length === 0 ? (
            <span className="text-sm text-ink-500">
              {t('vote.comments.no_history', 'No earlier version recorded.')}
            </span>
          ) : (
            edits.map((edit) => (
              <Col key={edit.id} className="bg-canvas-100 gap-1 rounded-xl p-3">
                <span className="text-xs text-ink-500">
                  {new Date(edit.createdTime).toLocaleString()}
                </span>
                <Content size="sm" content={edit.content} />
              </Col>
            ))
          )}
        </Col>
      </Modal>
    </>
  )
}

/** Inline editor, prefilled with the current text. Same cap and same linkify pass as posting. */
function VoteCommentEditor(props: {
  comment: VoteComment
  onDone: () => void
  onSaved: (content: JSONContent) => void
}) {
  const {comment, onDone, onSaved} = props
  const t = useT()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const editor = useTextEditor({
    // No `key`: the draft autosave is for composing something new. Restoring a stale draft over the
    // text you are trying to correct would be the opposite of helpful.
    size: 'sm',
    max: MAX_VOTE_COMMENT_LENGTH,
    defaultValue: comment.content,
  })

  const save = useEvent(async () => {
    if (!editor || editor.isEmpty || isSubmitting) return
    setIsSubmitting(true)
    try {
      const content = editor.getJSON()
      await api('edit-vote-comment', {commentId: comment.id, content})
      onSaved(content)
      track('edit vote comment', {voteId: comment.voteId})
    } catch (e) {
      console.error(e)
      toast.error(t('vote.comments.edit_error', "Couldn't save the edit. Try again?"))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Col className="mt-1 gap-1">
      <CommentInputTextArea
        editor={editor}
        user={null}
        submit={save}
        cancelEditing={onDone}
        isEditing
        isSubmitting={isSubmitting}
      />
      <CharacterCounter editor={editor} max={MAX_VOTE_COMMENT_LENGTH} />
    </Col>
  )
}

function VoteChip(props: {choice: number}) {
  const {choice} = props
  const t = useT()
  const label =
    choice === 1
      ? t('vote.for', 'For')
      : choice === -1
        ? t('vote.against', 'Against')
        : t('vote.abstain', 'Abstain')
  const color =
    choice === 1
      ? 'bg-green-100 text-green-700'
      : choice === -1
        ? 'bg-red-100 text-red-700'
        : 'bg-canvas-200 text-ink-600'
  return (
    <span className={clsx('rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold', color)}>
      {t('vote.comments.voted_chip', 'voted')} {label}
    </span>
  )
}

function VoteCommentDotMenu(props: {
  comment: VoteComment
  onHide: () => void
  onEdit?: () => void
}) {
  const {comment, onHide, onEdit} = props
  const [isModalOpen, setIsModalOpen] = useState(false)
  const user = useUser()
  const isAdmin = useAdmin()
  const isCurrentUser = user?.id === comment.userId
  const t = useT()

  return (
    <>
      <ReportModal
        report={{
          contentOwnerId: comment.userId,
          contentId: comment.id,
          contentType: 'comment',
          parentId: comment.voteId.toString(),
          parentType: 'vote',
        }}
        setIsModalOpen={setIsModalOpen}
        isModalOpen={isModalOpen}
        label={'Comment'}
      />
      <DropdownMenu
        menuWidth={'w-36'}
        closeOnClick={true}
        icon={<EllipsisHorizontalIcon className="mt-[0.12rem] h-4 w-4" aria-hidden="true" />}
        items={buildArray(
          onEdit &&
            isCurrentUser &&
            !comment.hidden && {
              name: 'Edit',
              icon: <PencilIcon className="h-5 w-5" />,
              onClick: onEdit,
            },
          user &&
            !isCurrentUser && {
              name: 'Report',
              icon: <FlagIcon className="h-5 w-5" />,
              onClick: () => setIsModalOpen(true),
            },
          // A proposal's author is deliberately not on this list: letting them delete arguments
          // against their own proposal would defeat the point of having the thread.
          (isAdmin || isCurrentUser) && {
            name: comment.hidden ? 'Undelete' : 'Delete',
            icon: <EyeSlashIcon className="h-5 w-5 text-red-500" />,
            onClick: async () => {
              onHide()
              await toast.promise(
                api('hide-comment', {
                  commentId: comment.id,
                  hide: !comment.hidden,
                  commentType: 'vote',
                }),
                {
                  loading: comment.hidden
                    ? t('vote.comments.undeleting', 'Undeleting comment...')
                    : t('vote.comments.deleting', 'Deleting comment...'),
                  success: () =>
                    comment.hidden
                      ? t('vote.comments.undeleted', 'Comment undeleted')
                      : t('vote.comments.deleted_toast', 'Comment deleted'),
                  error: () =>
                    t('vote.comments.delete_error', 'Error updating comment — please try again'),
                },
              )
            },
          },
        )}
      />
    </>
  )
}

/**
 * The 2000-character cap is a hard limit in the editor: past it, typing simply stops. Silent refusal
 * is fine at 10000, where nobody gets near it, but at 2000 it reads as a broken keyboard — so show
 * the count once the author is close enough for it to matter.
 *
 * Subscribes with its own listener rather than reading during render: `useTextEditor` sets
 * `shouldRerenderOnTransaction: false`, so the host does not re-render per keystroke and a value read
 * inline would simply be stale.
 */
function CharacterCounter(props: {editor: Editor | null; max: number}) {
  const {editor, max} = props
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!editor) return
    const update = () => setCount(editor.storage.characterCount?.characters() ?? 0)
    update()
    editor.on('update', update)
    return () => {
      editor.off('update', update)
    }
  }, [editor])

  if (count < max * 0.8) return null

  return (
    <span
      className={clsx(
        'self-end text-xs tabular-nums',
        count >= max ? 'font-semibold text-red-600' : 'text-ink-500',
      )}
    >
      {count} / {max}
    </span>
  )
}

export function VoteCommentInput(props: {
  voteId: number
  parentCommentId?: string
  replyToUserInfo?: ReplyToUserInfo
  clearReply?: () => void
  askForStance?: boolean
  /** Stance of the comment being replied to, used to pick a sensible default for this one. */
  parentStance?: Stance
  /** The viewer's own recorded choice (1 / 0 / -1), used as the other default. */
  userChoice?: number
  onPosted?: () => void
  className?: string
}) {
  const {
    voteId,
    parentCommentId,
    replyToUserInfo,
    clearReply,
    askForStance,
    parentStance,
    userChoice,
    onPosted,
    className,
  } = props
  const t = useT()
  const user = useUser()
  // Two defaults, both still one click to clear or change. Replying to a question is almost always
  // answering it, so that wins. Otherwise someone who has already voted is almost always writing for
  // the side they voted — and a stanceless argument is invisible to the highlighted-arguments
  // ranking, which reads `stance`, not the ballot. Abstain and not-yet-voted leave it blank rather
  // than guess a side.
  const defaultStance: Stance | undefined =
    parentStance === 'question'
      ? 'answer'
      : userChoice === 1
        ? 'for'
        : userChoice === -1
          ? 'against'
          : undefined
  const [stance, setStance] = useState<Stance | undefined>(defaultStance)
  // The ballot is fetched with the page, so it can land after this mounts, and it can change while
  // the composer sits open. Track it until the writer picks a chip themselves — after that the
  // default never overrides a deliberate choice.
  const stanceTouched = useRef(false)
  useEffect(() => {
    if (!stanceTouched.current) setStance(defaultStance)
  }, [defaultStance])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const key = `vote-comment ${voteId} ${parentCommentId ?? ''}`
  const editor = useTextEditor({
    key,
    size: 'sm',
    max: MAX_VOTE_COMMENT_LENGTH,
    placeholder: parentCommentId
      ? parentStance === 'question'
        ? t('vote.comments.answer_placeholder', 'Answer the question...')
        : t('vote.comments.reply_placeholder', 'Write a reply...')
      : t('vote.comments.placeholder', 'Make the case for or against this proposal...'),
  })

  const submit = useEvent(async (editor: Editor) => {
    if (!user) {
      track('sign in to comment')
      await firebaseLogin()
      return
    }
    await api('create-vote-comment', {
      voteId,
      content: editor.getJSON(),
      replyToCommentId: parentCommentId,
      stance,
    })
    setStance(defaultStance)
    stanceTouched.current = false
    clearReply?.()
    onPosted?.()
    track('vote comment', {voteId, stance})
  })

  async function onSubmit() {
    if (!editor || editor.isEmpty || isSubmitting) return
    setIsSubmitting(true)
    editor.commands.focus('end')
    // if last item is text, try to linkify it by adding and deleting a space
    if (editor.state.selection.empty) {
      editor.commands.insertContent(' ')
      const endPos = editor.state.selection.from
      editor.commands.deleteRange({from: endPos - 1, to: endPos})
    }
    try {
      await submit(editor)
      editor.commands.clearContent(true)
      safeLocalStorage?.removeItem(`text ${key}`)
    } catch (e) {
      console.error(e)
      toast.error(t('vote.comments.submit_error', 'Error submitting. Try again?'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user?.isBannedFromPosting) return null

  return (
    <Col className={clsx(className, 'mb-2 w-full gap-2')}>
      {askForStance && (
        <Row className="items-center gap-1.5 flex-wrap">
          <span className="text-xs text-ink-500">
            {t('vote.comments.stance_label', 'This is an…')}
          </span>
          {STANCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                stanceTouched.current = true
                setStance((prev) => (prev === s ? undefined : s))
              }}
              className={clsx(
                'rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity',
                STANCE_COLOR[s],
                stance === s ? 'opacity-100' : 'opacity-50 hover:opacity-80',
              )}
            >
              {t(`vote.stance.${s}`, STANCE_CHOICES[s])}
            </button>
          ))}
        </Row>
      )}
      <Row className="w-full gap-1 sm:gap-2">
        <Avatar avatarUrl={user?.avatarUrl} username={user?.username} size="sm" />
        <Col className="min-w-0 grow gap-1">
          <CommentInputTextArea
            editor={editor}
            replyTo={replyToUserInfo}
            user={user}
            submit={onSubmit}
            isSubmitting={isSubmitting}
          />
          <CharacterCounter editor={editor} max={MAX_VOTE_COMMENT_LENGTH} />
        </Col>
      </Row>
    </Col>
  )
}

export function VoteCommentCount(props: {count: number}) {
  const {count} = props
  const t = useT()
  if (!count) return null
  return (
    <span className="text-ink-500 text-sm">
      💬 <span className="tabular-nums">{count}</span>{' '}
      {count === 1
        ? t('vote.comments.count_one', 'comment')
        : t('vote.comments.count_other', 'comments')}
    </span>
  )
}
