import {User} from "common/user";
import {Button} from "web/components/buttons/button";
import {Modal, MODAL_CLASS} from "web/components/layout/modal";
import {Col} from "web/components/layout/col";
import {BookmarkedSearchesType} from "web/hooks/use-bookmarked-searches";
import {useUser} from "web/hooks/use-user";
import {deleteBookmarkedSearch} from "web/lib/supabase/searches";
import {formatFilters, locationType} from "common/searches";
import {FilterFields} from "common/filters";
import {api} from "web/lib/api";
import {DisplayUser} from "common/api/user-types";
import {useState} from "react";
import {useT} from "web/lib/locale";
import toast from "react-hot-toast";
import Link from "next/link";

export function BookmarkSearchButton(props: {
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
  open: boolean
  setOpen: (checked: boolean) => void
}) {
  const {
    bookmarkedSearches,
    refreshBookmarkedSearches,
    open,
    setOpen,
  } = props
  const user = useUser()

  const t = useT()
  if (!user) return null
  return (
    <>
      <Button onClick={() => setOpen(true)} color="gray-outline" size={'xs'}>
        {t('saved_searches.button', 'Saved Searches')}
      </Button>
      <ButtonModal
        open={open}
        setOpen={setOpen}
        user={user}
        bookmarkedSearches={bookmarkedSearches}
        refreshBookmarkedSearches={refreshBookmarkedSearches}
      />
    </>
  )
}

export function ResetFiltersButton(props: {
  clearFilters: () => void
}) {
  const {clearFilters} = props
  const t = useT()
  return (
    <>
      <Button onClick={clearFilters} color="gray-outline" size={'xs'}>
        {t('filter.reset', 'Reset filters')}
      </Button>
    </>
  )
}


function ButtonModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  user: User
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
}) {
  const {open, setOpen, bookmarkedSearches, refreshBookmarkedSearches} = props
  const t = useT()
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      onClose={() => {
        refreshBookmarkedSearches()
      }}
    >
      <Col className={MODAL_CLASS}>
        <h3>{t('saved_searches.title', 'Saved Searches')}</h3>
        {bookmarkedSearches?.length ? (<>
              <p>{t('saved_searches.notification_note', "We'll notify you daily when new people match your searches below.")}</p>
              <Col
                className={
                  'border-ink-300bg-canvas-0 inline-flex flex-col gap-2 rounded-md border p-1 shadow-sm'
                }
              >
                <ol className="list-decimal list-inside space-y-2">
                  {(bookmarkedSearches || []).map((search) => (
                    <li key={search.id}
                        className="items-center justify-between gap-2 list-item marker:text-ink-500 marker:font-bold">
                      {formatFilters(search.search_filters as Partial<FilterFields>, search.location as locationType)?.join(" • ")}
                      <button
                        onClick={async () => {
                          await deleteBookmarkedSearch(search.id)
                          refreshBookmarkedSearches()
                        }}
                        className="inline-flex text-xl h-5 w-5 items-center justify-center rounded-full text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ol>

              </Col>
            </>
          ) :
          <p>{t('saved_searches.empty_state', "You haven't saved any search. To save one, click on Get Notified and we'll notify you daily when new people match it.")}</p>}
        {/*<BookmarkSearchContent*/}
        {/*  total={bookmarkedSearches.length}*/}
        {/*  compatibilityQuestion={bookmarkedSearches[questionIndex]}*/}
        {/*  user={user}*/}
        {/*  onSubmit={() => {*/}
        {/*    setOpen(false)*/}
        {/*  }}*/}
        {/*  isLastQuestion={questionIndex === bookmarkedSearches.length - 1}*/}
        {/*  onNext={() => {*/}
        {/*    if (questionIndex === bookmarkedSearches.length - 1) {*/}
        {/*      setOpen(false)*/}
        {/*    } else {*/}
        {/*      setQuestionIndex(questionIndex + 1)*/}
        {/*    }*/}
        {/*  }}*/}
        {/*/>*/}
      </Col>
    </Modal>
  )
}

export function BookmarkStarButton(props: {
  starredUsers: DisplayUser[]
  refreshStars: () => void
  open: boolean
  setOpen: (checked: boolean) => void
}) {
  const {
    starredUsers,
    refreshStars,
    open,
    setOpen,
  } = props
  const user = useUser()

  const t = useT()
  if (!user) return null
  return (
    <>
      <Button onClick={() => setOpen(true)} color="gray-outline" size={'xs'}>
        {t('saved_people.button', 'Saved People')}
      </Button>
      <StarModal
        open={open}
        setOpen={setOpen}
        user={user}
        starredUsers={starredUsers}
        refreshStars={refreshStars}
      />
    </>
  )
}


function StarModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  user: User
  starredUsers: DisplayUser[]
  refreshStars: () => void
}) {
  const {open, setOpen, starredUsers, refreshStars} = props
  // Track items being optimistically removed so we can hide them immediately
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const t = useT()
  const visibleUsers = (starredUsers || []).filter((u) => !removingIds.has(u.id))

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      // onClose={() => {
      //   refreshBookmarkedSearches()
      // }}
    >
      <Col className={MODAL_CLASS}>
        <h3>{t('saved_people.title', 'Saved People')}</h3>
        {visibleUsers?.length ? (<>
            <p>{t('saved_people.list_header', 'Here are the people you saved:')}</p>
            <Col
              className={
                'border-ink-300bg-canvas-0 inline-flex flex-col gap-2 rounded-md border p-1 shadow-sm'
              }
            >
              <ol className="list-decimal list-inside space-y-2">
                {visibleUsers.map((user) => (
                  <li key={user.id}
                      className="items-center justify-between gap-2 list-item marker:text-ink-500 marker:font-bold">
                    <a className={'custom-link'}>
                      {user.name} (<Link
                      href={`/${user.username}`}
                      // style={{color: "#2563eb", textDecoration: "none"}}
                    >
                      @{user.username}
                    </Link>) {' '}
                    </a>
                    <button
                      onClick={() => {
                        // Optimistically remove the user from the list
                        setRemovingIds((prev) => new Set(prev).add(user.id))
                        // Fire the API call without blocking UI
                        api('star-profile', {
                          targetUserId: user.id,
                          remove: true,
                        })
                          .then(() => {
                            // Sync with server state
                            refreshStars()
                          })
                          .catch(() => {
                            toast.error("Couldn't remove saved profile. Please try again.")
                            // Revert optimistic removal on failure
                            setRemovingIds((prev) => {
                              const next = new Set(prev)
                              next.delete(user.id)
                              return next
                            })
                          })
                      }}
                      className="inline-flex text-xl h-5 w-5 items-center justify-center rounded-full text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>

            </Col>
          </>
        ) : <p>You haven't saved any profile. To save one, click on the star on their profile page.</p>}
        {/*<BookmarkSearchContent*/}
        {/*  total={bookmarkedSearches.length}*/}
        {/*  compatibilityQuestion={bookmarkedSearches[questionIndex]}*/}
        {/*  user={user}*/}
        {/*  onSubmit={() => {*/}
        {/*    setOpen(false)*/}
        {/*  }}*/}
        {/*  isLastQuestion={questionIndex === bookmarkedSearches.length - 1}*/}
        {/*  onNext={() => {*/}
        {/*    if (questionIndex === bookmarkedSearches.length - 1) {*/}
        {/*      setOpen(false)*/}
        {/*    } else {*/}
        {/*      setQuestionIndex(questionIndex + 1)*/}
        {/*    }*/}
        {/*  }}*/}
        {/*/>*/}
      </Col>
    </Modal>
  )
}