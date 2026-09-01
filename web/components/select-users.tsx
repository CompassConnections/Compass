import {XMarkIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {useEffect, useMemo, useRef, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Avatar} from 'web/components/widgets/avatar'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useT} from 'web/lib/locale'
import {DisplayUser, searchUsers} from 'web/lib/supabase/users'

import {Input} from './widgets/input'

// A single character matches most of the directory, so the search only fires from two on.
const MIN_QUERY_LENGTH = 2
// One request per pause in typing rather than one per keystroke.
const SEARCH_DEBOUNCE_MS = 200

// The empty/loading card on /messages, so an empty picker and an empty inbox look alike.
const EMPTY_CLASS =
  'bg-canvas-50 border-canvas-200 text-ink-500 mt-1 rounded-xl border p-8 text-center text-sm'

export function SelectUsers(props: {
  setSelectedUsers: (users: DisplayUser[]) => void
  selectedUsers: DisplayUser[]
  ignoreUserIds: string[]
  showSelectedUsersTitle?: boolean
  selectedUsersClassName?: string
  maxUsers?: number
  searchLimit?: number
  className?: string
}) {
  const {
    ignoreUserIds,
    selectedUsers,
    setSelectedUsers,
    showSelectedUsersTitle,
    selectedUsersClassName,
    maxUsers,
    className,
    searchLimit,
  } = props
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DisplayUser[]>([])
  const [searching, setSearching] = useState(false)
  // Which row the arrow keys are on: focus stays in the input the whole time, so the highlight has
  // to be tracked here rather than left to the browser's own focus ring.
  const [activeIndex, setActiveIndex] = useState(0)

  const requestId = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const trimmedQuery = query.trim()
  const queryReady = trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    // Wait for the modal (and transition) to finish
    const timeout = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!queryReady) {
      requestId.current++
      setResults([])
      setSearching(false)
      return
    }
    const id = ++requestId.current
    setSearching(true)
    const timeout = setTimeout(() => {
      searchUsers(trimmedQuery, searchLimit ?? 5)
        .then((users) => {
          // if there's a more recent request, forget about this one
          if (id !== requestId.current) return
          setResults(users)
          setSearching(false)
        })
        .catch(() => {
          if (id !== requestId.current) return
          setResults([])
          setSearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [trimmedQuery, queryReady, searchLimit])

  // Filtering at render rather than inside the fetch: `selectedUsers` and `ignoreUserIds` are fresh
  // arrays on every render of the parent, so an effect keyed on them re-ran (and re-searched) on
  // every keystroke of an unrelated state change.
  const filteredUsers = useMemo(() => {
    const excluded = new Set([...ignoreUserIds, ...selectedUsers.map((user) => user.id)])
    return results.filter((user) => !excluded.has(user.id))
  }, [results, ignoreUserIds.join(','), selectedUsers])

  useEffect(() => setActiveIndex(0), [trimmedQuery, results])

  const activeRow = Math.min(activeIndex, Math.max(filteredUsers.length - 1, 0))

  const selectUser = (user: DisplayUser) => {
    setQuery('')
    setResults([])
    setSelectedUsers([...selectedUsers, user])
    inputRef.current?.focus()
  }

  const moveActiveRow = (delta: number) => {
    if (filteredUsers.length === 0) return
    const next = (activeRow + delta + filteredUsers.length) % filteredUsers.length
    setActiveIndex(next)
    listRef.current?.children[next]?.scrollIntoView({block: 'nearest'})
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveActiveRow(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveActiveRow(-1)
    } else if (e.key === 'Enter') {
      const user = filteredUsers[activeRow]
      if (user) {
        e.preventDefault()
        selectUser(user)
      }
    } else if (e.key === 'Escape' && query) {
      // Clear the field first; a second Escape then closes the modal as usual.
      e.preventDefault()
      e.stopPropagation()
      setQuery('')
    } else if (e.key === 'Backspace' && !query && selectedUsers.length > 0) {
      setSelectedUsers(selectedUsers.slice(0, -1))
    }
  }

  const shouldShow = maxUsers ? selectedUsers.length < maxUsers : true
  return (
    <Col className={clsx('min-h-0', className)}>
      {selectedUsers.length > 0 && (
        <>
          {showSelectedUsersTitle && (
            <div className={'text-ink-500 mb-2 text-xs font-medium uppercase tracking-wide'}>
              {t('select_users.added_members', 'Added members')}
            </div>
          )}
          <Row className={clsx('mb-1 flex-wrap gap-2', selectedUsersClassName)}>
            {selectedUsers.map((user) => (
              <Row
                key={user.id}
                className={
                  'bg-canvas-50 border-canvas-200 items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 shadow-sm'
                }
              >
                <Avatar username={user.username} avatarUrl={user.avatarUrl} size={'xs'} noLink />
                <span className={'text-ink-900 max-w-[10rem] truncate text-sm'}>{user.name}</span>
                <button
                  type="button"
                  aria-label={t('select_users.remove', 'Remove {name}', {name: user.name})}
                  onClick={() => setSelectedUsers(selectedUsers.filter(({id}) => id != user.id))}
                  className={'text-ink-500 hover:text-primary-600 transition-colors'}
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </Row>
            ))}
          </Row>
        </>
      )}
      {shouldShow && (
        <>
          <Input
            ref={inputRef}
            type="text"
            // Not `name="user name"`: password managers read that as a credential field and
            // offer to fill it. The ignore attributes cover the ones that guess from the shape of
            // the field rather than from its name.
            name="user-search"
            id="user-search"
            autoComplete="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('select_users.placeholder', 'Search users...')}
            // Same field as the conversation search on /messages: tall pill, canvas-50 fill,
            // shadow. One search affordance across the page and the picker it opens.
            className={'w-full !rounded-full !px-5 text-base shadow-md !h-14'}
            searchIcon
          />
          <div
            className={'-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-3'}
            data-testid="search-results"
            role="listbox"
          >
            {!queryReady ? (
              <p className={EMPTY_CLASS}>
                {t('select_users.hint', 'Type at least two characters to find someone.')}
              </p>
            ) : searching && results.length === 0 ? (
              <Row className={clsx(EMPTY_CLASS, 'items-center justify-center gap-2')}>
                <LoadingIndicator size={'sm'} />
                {t('select_users.searching', 'Searching…')}
              </Row>
            ) : filteredUsers.length === 0 ? (
              <p className={EMPTY_CLASS}>
                {t('select_users.no_results', 'No one found for “{query}”.', {
                  query: trimmedQuery,
                })}
              </p>
            ) : (
              <Col className={'gap-2'} ref={listRef}>
                {filteredUsers.map((user, i) => (
                  <button
                    key={user.id}
                    type="button"
                    role="option"
                    aria-selected={i === activeRow}
                    // Pointer enter, not hover styling alone: the mouse and the arrow keys share one
                    // highlight, so moving either moves the same row.
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => selectUser(user)}
                    // Same card as a conversation row on /messages, so picking someone and then
                    // seeing the thread in the list reads as the same object twice.
                    className={clsx(
                      'bg-canvas-50 border-canvas-200 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                      i === activeRow && 'border-primary-300 bg-canvas-100 shadow-sm',
                    )}
                  >
                    <Avatar
                      username={user.username}
                      avatarUrl={user.avatarUrl}
                      size={'md'}
                      noLink
                      className={'flex-shrink-0'}
                    />
                    <Col className={'min-w-0 flex-1'}>
                      {/* The e2e helper matches this node's text exactly, so the handle below it
                          stays a sibling rather than joining the same element. */}
                      <span
                        data-testid="search-results-username"
                        className={clsx(
                          'truncate text-sm font-medium transition-colors',
                          i === activeRow ? 'text-primary-600' : 'text-ink-900',
                        )}
                      >
                        {user.name}
                      </span>
                      <span className={'text-ink-500 truncate text-xs'}>@{user.username}</span>
                    </Col>
                  </button>
                ))}
              </Col>
            )}
          </div>
        </>
      )}
    </Col>
  )
}
