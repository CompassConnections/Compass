import {QuestionMarkCircleIcon} from '@heroicons/react/24/outline'
import {XMarkIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {DisplayUser} from 'common/api/user-types'
import {FilterFields} from 'common/filters'
import {Profile} from 'common/profiles/profile'
import {debounce as debounceFn} from 'lodash'
import {forwardRef, ReactElement, useEffect, useRef, useState} from 'react'
import {IoFilterSharp} from 'react-icons/io5'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {RightModal} from 'web/components/layout/right-modal'
import {Row} from 'web/components/layout/row'
import {BookmarkSearchButton, BookmarkStarButton} from 'web/components/searches/button'
import {GetNotifiedButton} from 'web/components/searches/get-notified-button'
import {Input} from 'web/components/widgets/input'
import {Select} from 'web/components/widgets/select'
import {Tooltip} from 'web/components/widgets/tooltip'
import {BookmarkedSearchesType} from 'web/hooks/use-bookmarked-searches'
import {useT} from 'web/lib/locale'

import {LocationFilterProps} from './location-filter'

function isOrderBy(input: string): input is FilterFields['orderBy'] {
  return ['last_online_time', 'created_time', 'compatibility_score'].includes(input)
}

export const Search = forwardRef<
  HTMLInputElement,
  {
    youProfile: Profile | undefined | null
    starredUsers: DisplayUser[]
    refreshStars: () => void
    // filter props
    filters: Partial<FilterFields>
    updateFilter: (newState: Partial<FilterFields>) => void
    locationFilterProps: LocationFilterProps
    bookmarkedSearches: BookmarkedSearchesType[]
    refreshBookmarkedSearches: () => void
    profileCount: number | undefined
    openFilters?: () => void
    openFiltersModal?: boolean
    highlightFilters?: boolean
    highlightSort?: boolean
    setOpenFiltersModal?: (open: boolean) => void
    // True when the parent renders filtersElement as a docked column instead (desktop),
    // so this component's own slide-over shouldn't also open.
    suppressFiltersModal?: boolean
    filtersElement: ReactElement
  }
>((props, ref) => {
  const {
    youProfile,
    updateFilter,
    locationFilterProps,
    filters,
    bookmarkedSearches,
    refreshBookmarkedSearches,
    starredUsers,
    refreshStars,
    profileCount,
    openFilters,
    openFiltersModal: parentOpenFiltersModal,
    setOpenFiltersModal: parentSetOpenFiltersModal,
    suppressFiltersModal,
    highlightFilters,
    highlightSort,
    filtersElement,
  } = props

  const [internalOpenFiltersModal, setInternalOpenFiltersModal] = useState(false)

  const openFiltersModal = parentOpenFiltersModal ?? internalOpenFiltersModal
  const setOpenFiltersModal = parentSetOpenFiltersModal ?? setInternalOpenFiltersModal

  const sortSelectRef = useRef<HTMLSelectElement>(null)

  const t = useT()

  const handleOpenFilters = () => {
    if (openFilters) {
      openFilters()
    } else {
      setOpenFiltersModal(true)
    }
  }

  useEffect(() => {
    if (highlightSort && sortSelectRef.current) {
      setTimeout(() => {
        if (sortSelectRef.current) {
          sortSelectRef.current.focus()
          // Try multiple approaches to open the dropdown
          sortSelectRef.current.click()
          const event = new MouseEvent('mousedown', {bubbles: true})
          sortSelectRef.current.dispatchEvent(event)
          const event2 = new MouseEvent('click', {bubbles: true})
          sortSelectRef.current.dispatchEvent(event2)
        }
      }, 1000)
    }
  }, [highlightSort])

  const placeholder = t('search.placeholder', 'Search anything...')

  // const [textToType, setTextToType] = useState(getRandomPair())
  // const [_, setCharIndex] = useState(0)
  // const [isHolding, setIsHolding] = useState(false)
  const [openBookmarks, setOpenBookmarks] = useState(false)
  const [openStarBookmarks, setOpenStarBookmarks] = useState(false)
  // const choices = useChoicesContext()

  const [keywordInput, setKeywordInput] = useState(filters.name ?? '')

  const debouncedUpdateFilter = useRef(
    debounceFn((value: string) => {
      updateFilter({name: value || undefined})
    }, 500),
  ).current

  useEffect(() => {
    debouncedUpdateFilter(keywordInput)
  }, [keywordInput, debouncedUpdateFilter])

  useEffect(() => {
    setKeywordInput(filters.name ?? '')
  }, [filters.name])

  // const TYPING_SPEED = 100 // ms per character
  // const HOLD_TIME = 2000 // ms to hold the full word before deleting or switching
  // useEffect(() => {
  //   if (isHolding) return
  //
  //   const interval = setInterval(() => {
  //     setCharIndex((prev) => {
  //       if (prev < textToType.length) {
  //         setPlaceholder(textToType.slice(0, prev + 1))
  //         return prev + 1
  //       } else {
  //         setIsHolding(true)
  //         clearInterval(interval)
  //         setTimeout(() => {
  //           setPlaceholder('')
  //           setCharIndex(0)
  //           setTextToType(getRandomPair(Object.values(choices?.['interests']))) // pick new pair
  //           setIsHolding(false)
  //         }, HOLD_TIME)
  //         return prev
  //       }
  //     })
  //   }, TYPING_SPEED)
  //
  //   return () => clearInterval(interval)
  // }, [textToType, isHolding])

  return (
    <Col className={'text-ink-600 w-full gap-2 py-2 text-sm main-font'}>
      <Row className="mb-2 items-center justify-center gap-1.5 flex-wrap">
        <Input
          ref={ref}
          value={keywordInput}
          placeholder={placeholder}
          className="w-full max-w-md !h-14 !rounded-full !px-5 text-base shadow-md"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setKeywordInput(e.target.value)
          }}
          searchIcon
        />

        <Row className="gap-1.5 shrink-0 items-center">
          <Button
            color="gray-white"
            size="sm"
            className={clsx(
              '!h-10 !rounded-full border border-canvas-200',
              highlightFilters &&
                'border-primary-500 ring-2 ring-primary-300 bg-primary-50 text-primary-700',
            )}
            onClick={handleOpenFilters}
            data-testid="open-filters-button"
          >
            <IoFilterSharp className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('search.filters', 'Filters')}</span>
          </Button>
          <Select
            ref={sortSelectRef}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              if (isOrderBy(e.target.value)) {
                updateFilter({
                  orderBy: e.target.value,
                })
              }
            }}
            value={filters.orderBy || 'created_time'}
            className={clsx(
              '!h-10 w-auto !rounded-full !border-canvas-200 !bg-transparent !shadow-none text-xs text-ink-500',
              highlightSort && 'border-primary-500 ring-2 ring-primary-300',
            )}
          >
            <option value="created_time">{t('common.new', 'New')}</option>
            {youProfile && (
              <option value="compatibility_score">{t('common.compatible', 'Compatible')}</option>
            )}
            <option value="last_online_time">{t('common.active', 'Active')}</option>
          </Select>
          <GetNotifiedButton
            filters={filters}
            locationFilterProps={locationFilterProps}
            bookmarkedSearches={bookmarkedSearches}
            refreshBookmarkedSearches={refreshBookmarkedSearches}
            onSaved={() => setOpenBookmarks(true)}
            iconOnly
            size="sm"
            color="gray-white"
            className="!h-10 !w-10 !rounded-full border border-canvas-200 !p-0"
          />
        </Row>
      </Row>
      <RightModal
        className="bg-canvas-50 w-full sm:w-96 text-sm h-full max-h-screen overflow-y-auto"
        open={openFiltersModal && !suppressFiltersModal}
        setOpen={setOpenFiltersModal}
      >
        <Row className="items-center justify-between px-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <span className="font-medium text-ink-900">{t('search.filters', 'Filters')}</span>
          <Button
            size="2xs"
            color="gray-white"
            onClick={() => setOpenFiltersModal(false)}
            aria-label={t('common.close', 'Close')}
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </Row>
        {filtersElement}
      </RightModal>
      <Row className="items-center justify-between w-full flex-wrap gap-2">
        <Row className={'mb-2 gap-2'}>
          <BookmarkSearchButton
            refreshBookmarkedSearches={refreshBookmarkedSearches}
            bookmarkedSearches={bookmarkedSearches}
            open={openBookmarks}
            setOpen={setOpenBookmarks}
          />

          <BookmarkStarButton
            refreshStars={refreshStars}
            starredUsers={starredUsers}
            open={openStarBookmarks}
            setOpen={(checked) => {
              setOpenStarBookmarks(checked)
              refreshStars()
            }}
          />
        </Row>
        {(profileCount ?? 0) > 0 && (
          <Row className="text-sm text-ink-500 gap-2">
            <p data-testid="people-profile-count">
              {profileCount}{' '}
              {(profileCount ?? 0) > 1
                ? t('common.people', 'people')
                : t('common.person', 'person')}
            </p>
            {!filters.shortBio && (
              <Tooltip
                text={t(
                  'search.include_short_bios_tooltip',
                  'To list incomplete profiles, go to Filters, then Advanced, and tick "Include incomplete profiles"',
                )}
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
              </Tooltip>
            )}
          </Row>
        )}
      </Row>
    </Col>
  )
})
