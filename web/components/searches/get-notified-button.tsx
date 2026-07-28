import clsx from 'clsx'
import {FilterFields} from 'common/filters'
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
import {submitBookmarkedSearch} from 'web/lib/supabase/searches'

const MAX_BOOKMARKED_SEARCHES = 10

// Saves the current search as a bookmarked search so the user gets notified when new
// profiles match it. Shared between the top search bar (icon) and the empty results state
// (full CTA) so the save/loading/"Saved!" behavior stays identical in both places.
export function GetNotifiedButton(props: {
  filters: Partial<FilterFields>
  locationFilterProps: LocationFilterProps
  bookmarkedSearches: BookmarkedSearchesType[]
  refreshBookmarkedSearches: () => void
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
    onSaved,
    iconOnly,
    size = 'md',
    color = 'none',
    className,
  } = props

  const user = useUser()
  const t = useT()
  const isClearedFilters = useIsClearedFilters(filters)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!bookmarked) return
    const timeout = setTimeout(() => setBookmarked(false), 2000)
    return () => clearTimeout(timeout)
  }, [bookmarked])

  const label = bookmarked
    ? t('common.saved', 'Saved!')
    : isClearedFilters
      ? t('common.notified_any', 'Get notified for any new profile')
      : t('common.notified', 'Notify me when this search matches someone')

  const buttonText = bookmarked ? label : t('common.get_notified', 'Get notified')

  const handleClick = () => {
    if (bookmarkedSearches.length >= MAX_BOOKMARKED_SEARCHES) {
      toast.error(
        `You can bookmark maximum ${MAX_BOOKMARKED_SEARCHES} searches; please delete one first.`,
      )
      onSaved?.()
      return
    }
    setLoading(true)
    submitBookmarkedSearch(filters, locationFilterProps, user?.id).finally(() => {
      setLoading(false)
      setBookmarked(true)
      refreshBookmarkedSearches()
      onSaved?.()
    })
  }

  const button = (
    <Button
      disabled={loading}
      loading={loading}
      onClick={handleClick}
      size={size}
      color={color}
      className={className}
      aria-label={label}
    >
      <Bell className={clsx('h-4 w-4', !iconOnly && 'mr-1.5', bookmarked && 'fill-current')} />
      {!iconOnly && (loading ? '' : buttonText)}
    </Button>
  )

  return iconOnly ? <Tooltip text={label}>{button}</Tooltip> : button
}
