import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {formLink} from 'common/constants'
import {MAX_DESCRIPTION_LENGTH} from 'common/envs/constants'
import {debug} from 'common/logger'
import {ORDER_BY, ORDER_BY_CHOICES, OrderBy} from 'common/votes/constants'
import {STATUS_CHOICES} from 'common/votes/constants'
import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {linkifyUrls} from 'web/components/editor/autolink'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {EnglishOnlyWarning} from 'web/components/news/english-only-warning'
import {STATUS_COLOR, Vote, VoteItem} from 'web/components/votes/vote-item'
import {TextEditor, useTextEditor} from 'web/components/widgets/editor'
import {Input} from 'web/components/widgets/input'
import {eyebrow, surface} from 'web/components/widgets/surface'
import {useGetter} from 'web/hooks/use-getter'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {getTopArgumentsForVotes, getVotes} from 'web/lib/supabase/votes'

import {ShowMore} from '../widgets/show-more'

export function VoteComponent() {
  const t = useT()
  const user = useUser()
  const [orderBy, setOrderBy] = useState<OrderBy>('recent')

  const {data: votes, refresh: refreshVotes} = useGetter('votes', {orderBy}, getVotes)

  // Keyed on the ids actually on screen so re-sorting reuses the cached result instead of refetching
  // the same comments in a different order.
  const voteIdsWithComments = useMemo(
    () =>
      (votes ?? [])
        .filter((v: Vote) => v.comment_count > 0)
        .map((v: Vote) => v.id)
        .sort((a: number, b: number) => a - b),
    [votes],
  )
  const {data: topArguments} = useGetter(
    'vote-top-arguments',
    {voteIds: voteIdsWithComments},
    getTopArgumentsForVotes,
  )

  const [title, setTitle] = useState<string>('')
  const [editor, setEditor] = useState<any>(null)
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const hideButton = title.length == 0

  // Only offer statuses that actually appear in this batch of votes — a filter chip for a status
  // nothing currently has is a dead end, not a choice.
  const availableStatuses = useMemo(
    () =>
      Object.keys(STATUS_CHOICES).filter((status) => votes?.some((v: Vote) => v.status === status)),
    [votes],
  )

  const filteredVotes = useMemo(
    () =>
      statusFilter === 'all' ? votes : votes?.filter((vote: Vote) => vote.status === statusFilter),
    [votes, statusFilter],
  )

  return (
    <Col className="mx-2 max-w-3xl w-full mx-auto">
      <Row className="items-start justify-between flex-col xxs:flex-row mb-1 gap-3">
        <div>
          <p className={clsx(eyebrow, 'text-primary-700 mb-1')}>
            {t('vote.eyebrow', 'Community governance')}
          </p>
          <h1 className="font-heading text-3xl text-ink-900 tracking-tight">
            {t('vote.title', 'Proposals')}
          </h1>
        </div>
        <label className="flex items-center gap-2 text-sm shrink-0">
          <span className="text-ink-500">{t('vote.order.label', 'Order by:')}</span>
          <select
            id="orderBy"
            value={orderBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setOrderBy(e.target.value as OrderBy)
            }
            className="rounded-full border border-canvas-200 bg-canvas-50 px-3 py-1.5 text-sm text-ink-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            {ORDER_BY.map((key) => (
              <option key={key} value={key}>
                {t(`vote.sort.${key}`, ORDER_BY_CHOICES[key])}
              </option>
            ))}
          </select>
        </label>
      </Row>

      {availableStatuses.length > 1 && (
        <Row className="mt-3 items-center gap-2 flex-wrap">
          <Row className="gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={clsx(
                'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                statusFilter === 'all'
                  ? 'bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900'
                  : 'bg-canvas-100 text-ink-600 hover:bg-canvas-200',
              )}
            >
              {t('vote.filter.all', 'All')}
            </button>
            {availableStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity',
                  STATUS_COLOR[status],
                  statusFilter === status ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                )}
              >
                {t(`vote.status.${status}`, STATUS_CHOICES[status])}
              </button>
            ))}
          </Row>
          {votes && (
            <span className="text-xs text-ink-500 tabular-nums">
              {filteredVotes?.length ?? 0} / {votes.length}
            </span>
          )}
        </Row>
      )}

      <p className="custom-link text-sm text-ink-600 mt-3">
        {t(
          'vote.discuss.in_app',
          'Open a proposal to read the arguments for and against it before you vote — everyone who has already voted is told when a new argument appears. ',
        )}
        {t('vote.discuss.prefix_other', 'For anything else, use the ')}
        <Link href={'/contact'}>{t('vote.discuss.link_contact', 'contact form')}</Link>
        {t('vote.discuss.middle', ', the ')}
        <Link href={formLink}>{t('vote.discuss.link_feedback', 'feedback form')}</Link>
        {t('vote.discuss.and', ', or any of our ')}
        <Link href={'/social'}>{t('vote.discuss.link_socials', 'socials')}</Link>
        {t('vote.discuss.suffix', '.')}
      </p>

      {user && (
        <Col className="mt-4">
          <ShowMore
            labelClosed={t('vote.showmore.closed', '+ Add a new proposal')}
            labelOpen={t('vote.showmore.open', 'Hide')}
          >
            <Col className={clsx(surface, 'p-4 sm:p-5 gap-3')}>
              <Input
                value={title}
                placeholder={t('vote.form.title_placeholder', 'Title')}
                className={'w-full'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTitle(e.target.value)
                }}
              />
              <VoteCreator onEditor={(e) => setEditor(e)} />
              <Row className="items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setIsAnonymous(e.target.checked)
                  }
                  className="h-4 w-4 rounded-md border-canvas-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="anonymous" className="text-ink-700">
                  {t('vote.form.anonymous', 'Anonymous?')}
                </label>
              </Row>
              {!hideButton && (
                <Row className="justify-end">
                  <Button
                    size="sm"
                    color="cta"
                    onClick={async () => {
                      linkifyUrls(editor)
                      const data = {
                        title: title,
                        description: editor.getJSON() as JSONContent,
                        isAnonymous: isAnonymous,
                      }
                      const newVote = await api('create-vote', data).catch(() => {
                        toast.error(
                          t(
                            'vote.toast.create_failed',
                            'Failed to create vote — try again or contact us...',
                          ),
                        )
                      })
                      if (!newVote) return
                      setTitle('')
                      editor.commands.clearContent()
                      toast.success(t('vote.toast.created', 'Vote created'))
                      debug('Vote created', newVote)
                      refreshVotes()
                    }}
                  >
                    {t('vote.form.submit', 'Submit')}
                  </Button>
                </Row>
              )}
            </Col>
          </ShowMore>
        </Col>
      )}

      <EnglishOnlyWarning />

      {filteredVotes && filteredVotes.length > 0 ? (
        <Col className={'mt-6'}>
          {filteredVotes.map((vote: Vote) => {
            return (
              <VoteItem
                key={vote.id}
                vote={vote}
                topArguments={topArguments?.[vote.id]}
                onVoted={refreshVotes}
              />
            )
          })}
        </Col>
      ) : filteredVotes && filteredVotes.length === 0 ? (
        <Col className={clsx(surface, 'mt-6 items-center gap-1 px-6 py-12 text-center')}>
          <p className="font-heading text-lg text-ink-900">
            {statusFilter === 'all'
              ? t('vote.empty.title', 'No proposals yet')
              : t('vote.empty.filtered_title', 'No proposals with this status')}
          </p>
          <p className="text-sm text-ink-600 max-w-sm">
            {statusFilter === 'all'
              ? t('vote.empty.subtitle', 'Be the first to suggest a change to how Compass works.')
              : t('vote.empty.filtered_subtitle', 'Try a different filter above.')}
          </p>
        </Col>
      ) : null}
    </Col>
  )
}

interface VoteCreatorProps {
  defaultValue?: any
  onBlur?: (editor: any) => void
  onEditor?: (editor: any) => void
}

export function VoteCreator({defaultValue, onBlur, onEditor}: VoteCreatorProps) {
  const t = useT()
  const editor = useTextEditor({
    // extensions: [StarterKit],
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: defaultValue,
    placeholder: t('vote.creator.placeholder', 'Please describe your proposal here'),
  })

  useEffect(() => {
    onEditor?.(editor)
  }, [editor, onEditor])

  return (
    <div className={'mb-2'}>
      {/*<p>Description</p>*/}
      <TextEditor editor={editor} onBlur={() => onBlur?.(editor)} />
    </div>
  )
}
