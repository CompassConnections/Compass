import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {formLink} from 'common/constants'
import {MAX_DESCRIPTION_LENGTH} from 'common/envs/constants'
import {debug} from 'common/logger'
import {parseJsonContentToText} from 'common/util/parse'
import {ORDER_BY, ORDER_BY_CHOICES, OrderBy, STATUS_CHOICES} from 'common/votes/constants'
import {keyBy, uniq} from 'lodash'
import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {linkifyUrls} from 'web/components/editor/autolink'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {EnglishOnlyWarning} from 'web/components/news/english-only-warning'
import {choiceFromNumber} from 'web/components/votes/vote-buttons'
import {STATUS_COLOR, Vote, VoteItem} from 'web/components/votes/vote-item'
import {TextEditor, useTextEditor} from 'web/components/widgets/editor'
import {Input} from 'web/components/widgets/input'
import {eyebrow, surface} from 'web/components/widgets/surface'
import {useGetter} from 'web/hooks/use-getter'
import {useUser} from 'web/hooks/use-user'
import {useUsersInStore} from 'web/hooks/use-user-supabase'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {getMyVoteChoices, getVotes} from 'web/lib/supabase/votes'

import {ShowMore} from '../widgets/show-more'

export function VoteComponent() {
  const t = useT()
  const user = useUser()
  const [orderBy, setOrderBy] = useState<OrderBy>('recent')

  const {data: votes, refresh: refreshVotes} = useGetter('votes', {orderBy}, getVotes)

  // Which button to highlight on each card. Keyed on the user id rather than fetched once and held,
  // so signing out doesn't leave the previous account's ballots lit up on the cards.
  const {data: myChoices, refresh: refreshMyChoices} = useGetter(
    'my-vote-choices',
    user ? {userId: user.id} : undefined,
    getMyVoteChoices,
  )

  // The tallies and the viewer's own ballot come from two queries, so a vote has to invalidate both —
  // refreshing only the tallies would move the counts while the highlight stayed on the old choice.
  const onVoted = async () => {
    await Promise.all([refreshVotes(), refreshMyChoices()])
  }

  // One lookup for every proposal author on the page, rather than one per card. Anonymous proposals
  // are excluded: their card never renders a creator, so fetching them would leak nothing but would
  // still cost a row.
  const creatorIds: string[] = useMemo(() => {
    const ids = ((votes ?? []) as Vote[]).filter((v) => !v.is_anonymous).map((v) => v.creator_id)
    return uniq(ids).sort()
  }, [votes])
  const creators = useUsersInStore(creatorIds, 'vote-creators')
  const creatorsById = useMemo(() => keyBy(creators ?? [], 'id'), [creators])

  const [title, setTitle] = useState<string>('')
  const [editor, setEditor] = useState<any>(null)
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [query, setQuery] = useState<string>('')

  const isDescriptionEmpty = useEditorIsEmpty(editor)
  // A title alone used to be enough to post. It isn't: a proposal with no description gives voters
  // nothing to argue with, and the arguments are the whole point of the page.
  const missing = !title.trim()
    ? t('vote.form.needs_title', 'Add a title to post this proposal.')
    : isDescriptionEmpty
      ? t('vote.form.needs_description', 'Add a description — voters decide from it alone.')
      : undefined

  // Only offer statuses that actually appear in this batch of votes — a filter chip for a status
  // nothing currently has is a dead end, not a choice.
  const availableStatuses = useMemo(
    () =>
      Object.keys(STATUS_CHOICES).filter((status) => votes?.some((v: Vote) => v.status === status)),
    [votes],
  )

  // The description is tiptap JSON, so searching it means flattening it to text first. Done once per
  // batch of votes rather than inside the filter, or every keystroke would re-walk every document.
  const searchTextById = useMemo(() => {
    const entries = ((votes ?? []) as Vote[]).map((v) => [
      v.id,
      `${v.title ?? ''} ${parseJsonContentToText(v.description as JSONContent)}`.toLowerCase(),
    ])
    return Object.fromEntries(entries) as Record<number, string>
  }, [votes])

  // Every word has to appear somewhere in the title or the description — typing a second word
  // narrows the list, which is what someone hunting for a half-remembered proposal expects.
  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])

  const filteredVotes = useMemo(
    () =>
      votes?.filter(
        (vote: Vote) =>
          (statusFilter === 'all' || vote.status === statusFilter) &&
          terms.every((term) => (searchTextById[vote.id] ?? '').includes(term)),
      ),
    [votes, statusFilter, terms, searchTextById],
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

      <p className="custom-link text-sm text-ink-600 mt-3">
        {t(
          'vote.discuss.in_app',
          'Open a proposal to read the arguments for and against it before you vote. ',
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
            <Col className={clsx(surface, 'p-4 sm:p-5 gap-4')}>
              <ProposalGuidance />
              <Col className="gap-1.5">
                <label htmlFor="proposal-title" className="text-sm font-semibold text-ink-800">
                  {t('vote.form.title_label', 'Title')}
                </label>
                <Input
                  id="proposal-title"
                  value={title}
                  placeholder={t(
                    'vote.form.title_placeholder',
                    'e.g. Show the number of arguments on each proposal card',
                  )}
                  className={'w-full'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setTitle(e.target.value)
                  }}
                />
                <p className="text-xs text-ink-500">
                  {t(
                    'vote.form.title_hint',
                    'One sentence naming the change itself. Most members read only this line in the list, so "Let members hide their age" beats "About profile privacy".',
                  )}
                </p>
              </Col>
              <Col className="gap-1.5">
                {/* Not a <label>: the editor is a contenteditable div, not a form control, so a
                    label would point at nothing. */}
                <p className="text-sm font-semibold text-ink-800">
                  {t('vote.form.description_label', 'Description')}
                </p>
                <VoteCreator onEditor={(e) => setEditor(e)} />
                <p className="text-xs text-ink-500">
                  {t(
                    'vote.form.description_hint',
                    'The problem, the change, who it affects, and what it costs. Everything a voter needs is in here — they cannot ask you before voting.',
                  )}
                </p>
              </Col>
              <Col className="gap-1.5">
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
                <p className="text-xs text-ink-500">
                  {t(
                    'vote.form.anonymous_hint',
                    'Your name is hidden from the card and the discussion. You can still reply to arguments, but nobody will know the replies come from the author.',
                  )}
                </p>
              </Col>
              <Row className="items-center justify-end gap-3 flex-wrap">
                {missing && <span className="text-xs text-ink-500">{missing}</span>}
                <Button
                  size="sm"
                  color="cta"
                  disabled={!!missing || isSubmitting}
                  loading={isSubmitting}
                  onClick={async () => {
                    if (missing || isSubmitting) return
                    setIsSubmitting(true)
                    linkifyUrls(editor)
                    const data = {
                      title: title.trim(),
                      description: editor.getJSON() as JSONContent,
                      isAnonymous: isAnonymous,
                    }
                    const newVote = await api('create-vote', data)
                      .catch(() => {
                        toast.error(
                          t(
                            'vote.toast.create_failed',
                            'Failed to create vote — try again or contact us...',
                          ),
                        )
                      })
                      .finally(() => setIsSubmitting(false))
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
            </Col>
          </ShowMore>
        </Col>
      )}

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
                // Selection is marked with a ring, not by fading the others: `opacity-50` blends
                // both the chip fill and its label toward the page, which put every unselected chip
                // at 2.0–3.0:1 in both themes. At full opacity the tinted pairs (`bg-*-100` /
                // `text-*-700`) clear AA on their own.
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold transition-shadow',
                  STATUS_COLOR[status],
                  statusFilter === status
                    ? 'ring-2 ring-ink-900 ring-offset-1 ring-offset-canvas-100'
                    : 'hover:ring-1 hover:ring-ink-400',
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

      {votes && votes.length > 0 && (
        <Row className="mt-3 items-center gap-3 flex-wrap">
          <Input
            // Deliberately not `type="search"`: Chrome draws its own clear affordance inside the
            // field, doubling the X that `Input` already renders when there's a value.
            searchIcon
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder={t('vote.search.placeholder', 'Search proposals by keyword...')}
            aria-label={t('vote.search.label', 'Search proposals')}
            // Same shape as the members-page search (`filters/search.tsx`), one size down: this one
            // sits under a row of filter chips rather than heading the page.
            className="w-full max-w-md !rounded-full !px-5 shadow-sm"
          />
          {/* The status row already carries the same "shown / total" count, so this one only appears
              when that row doesn't — otherwise the two sit side by side saying the same thing. */}
          {terms.length > 0 && availableStatuses.length <= 1 && (
            <span className="text-xs text-ink-500 tabular-nums">
              {t('vote.search.matches', 'matching:')} {filteredVotes?.length ?? 0} / {votes.length}
            </span>
          )}
        </Row>
      )}

      <EnglishOnlyWarning />

      {filteredVotes && filteredVotes.length > 0 ? (
        <Col className={'mt-6'}>
          {filteredVotes.map((vote: Vote) => {
            return (
              <VoteItem
                key={vote.id}
                vote={vote}
                creator={creatorsById[vote.creator_id]}
                userChoice={choiceFromNumber(myChoices?.[vote.id])}
                onVoted={onVoted}
              />
            )
          })}
        </Col>
      ) : filteredVotes && filteredVotes.length === 0 ? (
        <Col className={clsx(surface, 'mt-6 items-center gap-1 px-6 py-12 text-center')}>
          <p className="font-heading text-lg text-ink-900">
            {terms.length > 0
              ? t('vote.empty.search_title', 'No proposals match that search')
              : statusFilter === 'all'
                ? t('vote.empty.title', 'No proposals yet')
                : t('vote.empty.filtered_title', 'No proposals with this status')}
          </p>
          <p className="text-sm text-ink-600 max-w-sm">
            {terms.length > 0
              ? t(
                  'vote.empty.search_subtitle',
                  'Nothing with those words in its title or description — try fewer words, or propose it yourself.',
                )
              : statusFilter === 'all'
                ? t('vote.empty.subtitle', 'Be the first to suggest a change to how Compass works.')
                : t('vote.empty.filtered_subtitle', 'Try a different filter above.')}
          </p>
          {terms.length > 0 && (
            <Button size="sm" color="gray-outline" className="mt-3" onClick={() => setQuery('')}>
              {t('vote.search.clear', 'Clear search')}
            </Button>
          )}
        </Col>
      ) : null}
    </Col>
  )
}

/**
 * The counterpart to `DiscussionGuidance` on the proposal page, and for the same reason: it sits
 * above the fields rather than behind a "guidelines" link, because a composer already in front of
 * you is exactly what makes someone skip the advice. A proposal is harder to fix after the fact than
 * a comment — once people start voting, editing the text moves the ground under ballots already
 * cast — so the guidance is worth more here than anywhere else on the page.
 */
function ProposalGuidance() {
  const t = useT()

  const points = [
    t(
      'vote.form.guidance.duplicate',
      'Skim the other proposals first. If yours is already there, add your argument to that thread instead.',
    ),
    t(
      'vote.form.guidance.title',
      'Put the change itself in the title, not the topic nor the problem ("my profile layout looks bad"). Someone scrolling the list should be able to tell what they would be voting for without opening it.',
    ),
    t(
      'vote.form.guidance.detail',
      'Describe the problem before the solution: what happens today, why it is worth changing, and what exactly would be different afterwards.',
    ),
    t(
      'vote.form.guidance.cons',
      'Name the strongest objection yourself, and who is worse off if this passes. A proposal that admits its cost gets taken seriously.',
    ),
    t(
      'vote.form.guidance.invite',
      'End with what you are unsure about and what would change your mind.',
    ),
  ]

  return (
    // A rule instead of a panel: inside the composer card, a bordered box around the guidance made
    // three nested rectangles before the first field, and the fields have to be boxes.
    <Col className="gap-2 border-b border-canvas-200/70 pb-4">
      <p className="text-sm font-semibold text-ink-800">
        {t('vote.form.guidance.title_heading', 'Write it so people can argue with it')}
      </p>
      <p className="text-sm text-ink-600">
        {t(
          'vote.form.guidance.intro',
          'Every member can vote on this, and most will decide from your text and the arguments under it — not from a conversation with you. That is worth some care:',
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

/**
 * `useTextEditor` sets `shouldRerenderOnTransaction: false`, so `editor.isEmpty` read during render
 * never updates — the submit button would stay disabled through a whole typed description. Subscribe
 * to the editor's own updates instead, same as `CharacterCounter` in the discussion composer.
 */
function useEditorIsEmpty(editor: any) {
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (!editor) {
      setIsEmpty(true)
      return
    }
    const update = () => setIsEmpty(editor.isEmpty)
    update()
    editor.on('update', update)
    return () => {
      editor.off('update', update)
    }
  }, [editor])

  return isEmpty
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
    placeholder: t(
      'vote.creator.placeholder',
      'What happens today, what should change, who it affects, what it costs, and what would change your mind…',
    ),
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
