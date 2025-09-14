import {User} from "common/user";
import {ReactElement} from "react";
import {Button} from "web/components/buttons/button";
import {Modal, MODAL_CLASS} from "web/components/layout/modal";
import {Col} from "web/components/layout/col";
import {BookmarkedSearchesType} from "web/hooks/use-bookmarked-searches";
import {useUser} from "web/hooks/use-user";
import {initialFilters} from "web/components/filters/use-filters";
import {deleteBookmarkedSearch} from "web/lib/supabase/searches";
import {FilterFields} from "web/components/filters/search";
import {hasKidsNames} from "web/components/filters/has-kids-filter";
import {wantsKidsNames} from "web/components/filters/wants-kids-filter";

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

// Define nice labels for each key
const filterLabels: Record<string, string> = {
  geodbCityIds: "",
  location: "",
  name: "Searching",
  genders: "",
  pref_age_max: "Max age",
  pref_age_min: "Min age",
  has_kids: "",
  wants_kids_strength: "",
  is_smoker: "",
  pref_relation_styles: "Seeking",
  pref_gender: "",
  orderBy: "",
}

export type locationType = {
  location: {
    name: string
  }
  radius: number
}

export type FilterFieldsWithLocation = FilterFields & {
  location: locationType
}


function formatFilters(filters: Partial<FilterFieldsWithLocation>): ReactElement | null {
  const entries: ReactElement[] = []

  let ageEntry = null
  let ageMin: number | undefined = filters.pref_age_min
  if (ageMin == 18) ageMin = undefined
  let ageMax = filters.pref_age_max;
  if (ageMax == 99) ageMax = undefined
  if (ageMin || ageMax) {
    let text: string = 'Age: '
    if (ageMin) text = `${text}${ageMin}`
    if (ageMax) {
      if (ageMin) {
        text = `${text}-${ageMax}`
      } else {
        text = `${text}up to ${ageMax}`
      }
    } else {
      text = `${text}+`
    }
    ageEntry = <span>{text}</span>
  }

  Object.entries(filters).forEach(([key, value]) => {
    const typedKey = key as keyof FilterFields

    if (!value) return
    if (typedKey == 'pref_age_min' || typedKey == 'pref_age_max' || typedKey == 'geodbCityIds') return
    if (Array.isArray(value) && value.length === 0) return
    if (initialFilters[typedKey] === value) return

    const label = filterLabels[typedKey] ?? key

    let stringValue = value
    if (key === 'has_kids') stringValue = hasKidsNames[value as number]
    if (key === 'wants_kids_strength') stringValue = wantsKidsNames[value as number]
    if (key === 'location') {
      const locValue = value as locationType
      if (!locValue?.location?.name) return
      stringValue = `${locValue?.location?.name} (${locValue?.radius}mi)`
    }
    if (Array.isArray(value)) stringValue = value.join(', ')

    if (!label) {
      const str = String(stringValue)
      stringValue = str.charAt(0).toUpperCase() + str.slice(1)
    }

    const display: ReactElement = key === 'name'
      ? <i>{stringValue as string}</i>
      : <>{stringValue}</>

    entries.push(
      <span key={key}>
        {label}
        {label ? ': ' : ''}
        {display}
      </span>
    )
  })

  if (ageEntry) entries.push(ageEntry)

  if (entries.length === 0) return null

  // Join with " • " separators
  return (
    <span>
      {entries.map((entry, i) => (
        <span key={i}>
          {entry}
          {i < entries.length - 1 ? ' • ' : ''}
        </span>
      ))}
    </span>
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
                {formatFilters(search.search_filters as Partial<FilterFields>)}
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