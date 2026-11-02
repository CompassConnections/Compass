import clsx from 'clsx'
import {FilterFields, hasSearchCriteria} from 'common/filters'
import {Bell} from 'lucide-react'
import {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import {Button, ColorType, SizeType} from 'web/components/buttons/button'
import {LocationFilterProps} from 'web/components/filters/location-filter'
import {Tooltip} from 'web/components/widgets/tooltip'
import {BookmarkedSearchesType} from 'web/hooks/use-bookmarked-searches'
import {useIsClearedFilters} from 'web/hooks/use-is-cleared-filters'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {submitBookmarkedSearch, updateBookmarkedSearch} from 'web/lib/supabase/searches'

const MAX_BOOKMARKED_SEARCHES = 10

// Saves the current search as a bookmarked search so the user gets notified when new
// profiles match it. Shared between the top search bar (icon) and the empty results state
// (full CTA) so the save/loading/"Saved!" behavior stays identical in both places.
// With `editingSavedSearchId` set, the same button overwrites that saved search instead of creating
// a new one — the filters column is the only place a search can be built, so editing a saved search
// is "load it, change it, save it back over itself".
export function GetNotifiedButton(props: {
  filters: Partial<FilterFields>
  locationFilterProps: LocationFilterProps
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
  editingSavedSearchId?: number
  onSaved?: () => void
  iconOnly?: boolean
  size?: SizeType
  color?: ColorType
  className?: string
}) {
  const {
    filters,
    locationFilterProps,
    bookmarkedSearches,
    refreshBookmarkedSearches,
    editingSavedSearchId,
    onSaved,
    iconOnly,
    size = 'md',
    color = 'none',
    className,
  } = props

  const user = useUser()
  const t = useT()
  const isClearedFilters = useIsClearedFilters(filters)
  // An unfiltered search matches everyone who ever signs up, so it would fire on every signup and
  // stop meaning anything. Same rule the endpoint enforces — see `hasSearchCriteria`.
  const canSave = hasSearchCriteria(filters, locationFilterProps?.location)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!bookmarked) return
    const timeout = setTimeout(() => setBookmarked(false), 2000)
    return () => clearTimeout(timeout)
  }, [bookmarked])

  const isEditing = editingSavedSearchId !== undefined

  const label = bookmarked
    ? t('common.saved', 'Saved!')
    : !canSave
      ? t(
          'common.notified_needs_filter',
          'Add a filter first — an empty search would notify you about everyone',
        )
      : isEditing
        ? t('saved_searches.update', 'Save the changes to this saved search')
        : isClearedFilters
          ? t('common.notified_any', 'Get notified for any new profile')
          : t('common.notified', 'Notify me when this search matches someone')

  const buttonText = bookmarked
    ? label
    : isEditing
      ? t('saved_searches.update_short', 'Update search')
      : t('common.get_notified', 'Get notified')

  const handleClick = () => {
    if (!canSave) return
    // Overwriting keeps the count where it is, so the cap only applies to a new search.
    if (!isEditing && bookmarkedSearches.length >= MAX_BOOKMARKED_SEARCHES) {
      toast.error(
        `You can bookmark maximum ${MAX_BOOKMARKED_SEARCHES} searches; please delete one first.`,
      )
      onSaved?.()
      return
    }
    setLoading(true)
    const save = isEditing
      ? updateBookmarkedSearch(editingSavedSearchId, filters, locationFilterProps)
      : submitBookmarkedSearch(filters, locationFilterProps, user?.id)
    save
      .then(() => {
        setBookmarked(true)
        refreshBookmarkedSearches()
        onSaved?.()
      })
      .catch(() => {
        toast.error(t('saved_searches.save_failed', "Couldn't save this search. Please try again."))
      })
      .finally(() => setLoading(false))
  }

  const button = (
    <Button
      // A natively `disabled` button swallows pointer events, so the tap never reaches the Tooltip
      // wrapper and touch users get no explanation for why the button is dead. Mark it disabled for
      // assistive tech only (`aria-disabled`) and let `handleClick` no-op instead.
      disabled={loading}
      aria-disabled={!canSave || undefined}
      loading={loading}
      onClick={handleClick}
      size={size}
      color={color}
      className={clsx(className, !canSave && 'cursor-not-allowed opacity-50')}
      aria-label={label}
    >
      <Bell className={clsx('h-4 w-4', !iconOnly && 'mr-1.5', bookmarked && 'fill-current')} />
      {!iconOnly && (loading ? '' : buttonText)}
    </Button>
  )

  // An edit changes what the bell does, and an icon alone cannot say so: it gets its text back —
  // from `sm` up. At phone width the row has no room for it, so there the filled colour is what says
  // "this is not the usual bell", and the filters column's banner spells the rest out.
  if (iconOnly && isEditing) {
    return (
      // `flex`, not the span's inline default: an inline wrapper carries line-height slack below the
      // button, so the row centred its neighbours on a box taller than the button itself.
      <Tooltip text={label} className="flex">
        <Button
          disabled={loading}
          aria-disabled={!canSave || undefined}
          loading={loading}
          onClick={handleClick}
          size={size}
          color="primary"
          // `primary` ships an `mb-4` of its own; in a row of 40px controls that margin made this
          // one's box 56px tall and pushed its neighbours off centre.
          className={clsx('!mb-0', className, !canSave && 'cursor-not-allowed opacity-50')}
          aria-label={label}
          data-testid="update-saved-search"
        >
          <Bell className={clsx('h-4 w-4 sm:mr-1.5', bookmarked && 'fill-current')} />
          <span className="hidden sm:inline">{loading ? '' : buttonText}</span>
        </Button>
      </Tooltip>
    )
  }

  // The full-width variant normally says what it does on the face of it, but a disabled button with no
  // explanation is just a dead control — so the reason gets a tooltip there too.
  return iconOnly || !canSave ? (
    <Tooltip text={label} className="flex">
      {button}
    </Tooltip>
  ) : (
    button
  )
}
