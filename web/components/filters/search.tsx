import {Profile} from 'common/profiles/profile'
import {useEffect, useState} from 'react'
import {IoFilterSharp} from 'react-icons/io5'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {RightModal} from 'web/components/layout/right-modal'
import {Row} from 'web/components/layout/row'
import {Input} from 'web/components/widgets/input'
import {Select} from 'web/components/widgets/select'
import {DesktopFilters} from './desktop-filters'
import {LocationFilterProps} from './location-filter'
import MobileFilters from './mobile-filters'
import {BookmarkSearchButton, BookmarkStarButton} from "web/components/searches/button";
import {BookmarkedSearchesType} from "web/hooks/use-bookmarked-searches";
import {submitBookmarkedSearch} from "web/lib/supabase/searches";
import {useUser} from "web/hooks/use-user";
import toast from "react-hot-toast";
import {FilterFields} from "common/filters";
import {DisplayUser} from "common/api/user-types";
import {useChoices} from "web/hooks/use-choices";
import {useT} from "web/lib/locale";

function isOrderBy(input: string): input is FilterFields['orderBy'] {
  return ['last_online_time', 'created_time', 'compatibility_score'].includes(
    input
  )
}

const TYPING_SPEED = 100; // ms per character
const HOLD_TIME = 2000; // ms to hold the full word before deleting or switching
export const WORDS: string[] = [
  // Values
  "Minimalism",
  "Sustainability",
  "Veganism",
  "Meditation",
  "Climate",
  "Animal",
  "Community living",
  "Open source",
  "Spirituality",

  // Intellectual interests
  "Philosophy",
  "AI safety",
  "Psychology",

  // Arts & culture
  "Indie film",
  "Jazz",
  "Contemporary art",
  "Folk music",
  "Poetry",
  "Sci-fi",
  "Board games",

  // Relationship intentions
  "Study buddy",
  "Co-founder",

  // Lifestyle
  "Digital nomad",
  "Permaculture",
  "Yoga",

  // Random human quirks (to make it feel alive)
  "Chess",
  "Rock climbing",
  "Stargazing",

  // Other
  "Feminism",
  "Coding",
  "ENFP",
  "INTP",
  "Therapy",
  "Science",
  "Camus",
  "Running",
  "Writing",
  "Reading",
  "Anime",
  "Drawing",
  "Photography",
  "Linux",
  "History",
  "Graphics design",
  "Math",
  "Ethereum",
  "Finance",
]

function getRandomPair(count = 3): string {
  const shuffled = [...WORDS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count).join(", ")
}


const MAX_BOOKMARKED_SEARCHES = 10;
export const Search = (props: {
  youProfile: Profile | undefined | null
  starredUsers: DisplayUser[]
  refreshStars: () => void
  // filter props
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  clearFilters: () => void
  setYourFilters: (checked: boolean) => void
  isYourFilters: boolean
  locationFilterProps: LocationFilterProps
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
  profileCount: number | undefined
}) => {
  const {
    youProfile,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
    filters,
    bookmarkedSearches,
    refreshBookmarkedSearches,
    starredUsers,
    refreshStars,
    profileCount,
  } = props

  const [openFiltersModal, setOpenFiltersModal] = useState(false)

  const [placeholder, setPlaceholder] = useState('');
  const [textToType, setTextToType] = useState(getRandomPair());
  const [_, setCharIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);
  const t = useT()
  const [openBookmarks, setOpenBookmarks] = useState(false);
  const [openStarBookmarks, setOpenStarBookmarks] = useState(false);
  const user = useUser()
  const youSeekingRelationship = youProfile?.pref_relation_styles?.includes('relationship')
  const {choices: interestChoices} = useChoices('interests')
  const {choices: causeChoices} = useChoices('causes')
  const {choices: workChoices} = useChoices('work')
  const choices = {
    interests: interestChoices,
    causes: causeChoices,
    work: workChoices,
  }

  useEffect(() => {
    if (isHolding) return;

    const interval = setInterval(() => {
      setCharIndex((prev) => {
        if (prev < textToType.length) {
          setPlaceholder(textToType.slice(0, prev + 1));
          return prev + 1;
        } else {
          setIsHolding(true);
          clearInterval(interval);
          setTimeout(() => {
            setPlaceholder('');
            setCharIndex(0);
            setTextToType(getRandomPair()); // pick new pair
            setIsHolding(false);
          }, HOLD_TIME);
          return prev;
        }
      });
    }, TYPING_SPEED);

    return () => clearInterval(interval);
  }, [textToType, isHolding]);

  useEffect(() => {
    setTimeout(() => setBookmarked(false), 2000);
  }, [bookmarked]);

  return (
    <Col className={'text-ink-600 w-full gap-2 py-2 text-sm main-font'}>
      <Row className={'mb-2 justify-between gap-2'}>
        <Input
          value={filters.name ?? ''}
          placeholder={placeholder}
          className={'w-full max-w-xs'}
          onChange={(e) => {
            updateFilter({name: e.target.value})
          }}
        />

        <Row className="gap-2">
          <Select
            onChange={(e) => {
              if (isOrderBy(e.target.value)) {
                updateFilter({
                  orderBy: e.target.value,
                })
              }
            }}
            value={filters.orderBy || 'created_time'}
            className={'w-18 border-ink-300 rounded-md'}
          >
            <option value="created_time">{t('common.new', 'New')}</option>
            {youProfile && (
              <option value="compatibility_score">{t('common.compatible', 'Compatible')}</option>
            )}
            <option value="last_online_time">{t('common.active', 'Active')}</option>
          </Select>
          <Button
            color="none"
            size="sm"
            className="border-ink-300 border sm:hidden "
            onClick={() => setOpenFiltersModal(true)}
          >
            <IoFilterSharp className="h-5 w-5"/>
          </Button>
        </Row>
      </Row>
      <Row
        className={
          'border-ink-300 dark:border-ink-300 hidden flex-wrap items-center gap-4 pb-4 pt-1 sm:inline-flex'
        }
      >
        <DesktopFilters
          filters={filters}
          youProfile={youProfile}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          setYourFilters={setYourFilters}
          isYourFilters={isYourFilters}
          locationFilterProps={locationFilterProps}
          includeRelationshipFilters={youSeekingRelationship}
          choices={choices}
        />
      </Row>
      <RightModal
        className="bg-canvas-0 w-2/3 text-sm sm:hidden h-full max-h-screen overflow-y-auto"
        open={openFiltersModal}
        setOpen={setOpenFiltersModal}
      >
        <MobileFilters
          filters={filters}
          youProfile={youProfile}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          setYourFilters={setYourFilters}
          isYourFilters={isYourFilters}
          locationFilterProps={locationFilterProps}
          includeRelationshipFilters={youSeekingRelationship}
          choices={choices}
        />
      </RightModal>
      <Row className="items-center justify-between w-full flex-wrap gap-2">
        <Row className={'mb-2 gap-2'}>
          <Button
            disabled={loadingBookmark}
            loading={loadingBookmark}
            onClick={() => {
              if (bookmarkedSearches.length >= MAX_BOOKMARKED_SEARCHES) {
                toast.error(`You can bookmark maximum ${MAX_BOOKMARKED_SEARCHES} searches; please delete one first.`)
                setOpenBookmarks(true)
                return
              }
              setLoadingBookmark(true)
              submitBookmarkedSearch(filters, locationFilterProps, user?.id)
                .finally(() => {
                  setLoadingBookmark(false)
                  setBookmarked(true)
                  refreshBookmarkedSearches()
                  setOpenBookmarks(true)
                })
            }}
            size={'xs'}
            color={'none'}
            className={'bg-canvas-100 hover:bg-canvas-200'}
          >
            {bookmarked ? t('common.saved', 'Saved!') : loadingBookmark ? '' : t('common.notified', 'Get Notified')}
          </Button>

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
          <Col className="text-sm text-ink-500">
            <p>{profileCount} {(profileCount ?? 0) > 1 ? t('common.people', 'people') : t('common.person', 'person')}</p>
          </Col>
        )}
      </Row>
    </Col>
  )
}
