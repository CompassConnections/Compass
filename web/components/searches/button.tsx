import {User} from "common/user";
import {useEffect, useState} from "react";
import {Button} from "web/components/buttons/button";
import {Modal, MODAL_CLASS} from "web/components/layout/modal";
import {Col} from "web/components/layout/col";
import {BookmarkedSearchesType} from "web/hooks/use-bookmarked-searches";
import {useUser} from "web/hooks/use-user";
import {initialFilters} from "web/components/filters/use-filters";
import {Row} from "web/components/layout/row";
import {deleteBookmarkedSearch} from "web/lib/supabase/searches";
import {FilterFields} from "web/components/filters/search";

export function BookmarkSearchButton(props: {
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
  openBookmarks?: boolean
}) {
  const {
    bookmarkedSearches,
    refreshBookmarkedSearches,
    openBookmarks,
  } = props
  const [open, setOpen] = useState(false)
  const user = useUser()

  useEffect(() => {
    if (openBookmarks) setOpen(true)
  }, [openBookmarks]);

  if (!user) return null
  return (
    <>
      <Button onClick={() => setOpen(true)} color="gray-outline" size={'xs'}>
        My Bookmarked Searches
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

function ButtonModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  user: User
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
}) {
  const {open, setOpen, bookmarkedSearches, refreshBookmarkedSearches} = props
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      onClose={() => {
        refreshBookmarkedSearches()
      }}
    >
      <Col className={MODAL_CLASS}>
        <div>Bookmarked Searches</div>
        <p className='text-xs'>We'll notify you daily when new people match your searches below.</p>
        <Col
          className={
            'border-ink-300 text-ink-400 bg-canvas-0 inline-flex flex-col gap-2 rounded-md border p-1 text-sm shadow-sm'
          }
        >
          {(bookmarkedSearches || []).map((search) => (
            <Row key={search.id}>
              <p>
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(search.search_filters as Record<string, any>).filter(([key, value]) => {
                      // skip null/undefined
                      if (value == null) return false

                      // skip empty arrays
                      if (Array.isArray(value) && value.length === 0) return false

                      // keep if different from initialFilters
                      return initialFilters[key as keyof FilterFields] !== value
                    })

                  )
                )}
              </p>
              <button
                onClick={async () => {
                  await deleteBookmarkedSearch(search.id)
                  refreshBookmarkedSearches()
                }}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                ×
              </button>
            </Row>

          ))}
        </Col>
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