import {User} from "common/user";
import {Button} from "web/components/buttons/button";
import {Modal, MODAL_CLASS} from "web/components/layout/modal";
import {Col} from "web/components/layout/col";
import {BookmarkedSearchesType} from "web/hooks/use-bookmarked-searches";
import {useUser} from "web/hooks/use-user";
import {deleteBookmarkedSearch} from "web/lib/supabase/searches";
import {formatFilters, locationType} from "common/searches";
import {FilterFields} from "common/filters";

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
        <h3>Bookmarked Searches</h3>
        <p className='text-sm'>We'll notify you daily when new people match your searches below.</p>
        <Col
          className={
            'border-ink-300bg-canvas-0 inline-flex flex-col gap-2 rounded-md border p-1 text-sm shadow-sm'
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