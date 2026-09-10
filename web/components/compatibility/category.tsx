import clsx from 'clsx'
import {compatibilityCategoryLabel} from 'common/profiles/compatibility-categories'
import DropdownMenu, {DropdownButton} from 'web/components/comments/dropdown-menu'
import {useT} from 'web/lib/locale'

/**
 * A stored category rendered in the reader's language, falling back to the raw stored value.
 *
 * `compatibility_prompts.category` is free text and only partly populated, so anything not in
 * `COMPATIBILITY_CATEGORIES` is shown as it is stored rather than hidden — a mislabelled prompt
 * should be visible, not invisible.
 */
export const useCategoryLabel = () => {
  const t = useT()
  return (category: string) =>
    t(`compatibility.category.${category}`, compatibilityCategoryLabel(category))
}

/**
 * The domain a prompt belongs to, as a quiet outlined pill.
 *
 * Deliberately not in the primary amber: on both surfaces that show it, the loud colours already
 * mean something else (the answer you picked, what you accept), and a category is context rather
 * than a value — so it stays in the neutral ink ramp with the same small uppercase treatment the
 * other metadata labels in a prompt row use.
 */
export function CompatibilityCategoryTag(props: {category: string; className?: string}) {
  const {category, className} = props
  const label = useCategoryLabel()
  return (
    <span
      className={clsx(
        'border-canvas-200 text-ink-500 font-dm-sans w-fit shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 uppercase',
        className,
      )}
      style={{fontSize: '10px', letterSpacing: '0.12em'}}
    >
      {label(category)}
    </span>
  )
}

/**
 * Category filter, matching `CompatibilitySortWidget` so the two read as one row of controls.
 *
 * Renders nothing when the loaded questions carry no categories at all — the column is largely
 * unpopulated, and a filter whose only option is "All" is furniture.
 */
export function CompatibilityCategoryFilter(props: {
  category: string | null
  setCategory: (category: string | null) => void
  categories: string[]
  className?: string
}) {
  const {category, setCategory, categories, className} = props
  const t = useT()
  const label = useCategoryLabel()

  if (categories.length === 0) return null

  const allLabel = t('compatibility.category.all', 'All categories')

  return (
    <DropdownMenu
      className={className}
      items={[
        {name: allLabel, onClick: () => setCategory(null)},
        ...categories.map((c) => ({name: label(c), onClick: () => setCategory(c)})),
      ]}
      closeOnClick
      buttonClass={''}
      buttonContent={(open: boolean) => (
        <DropdownButton content={category ? label(category) : allLabel} open={open} />
      )}
      menuItemsClass={'bg-canvas-50'}
      menuWidth="w-56"
      selectedItemName={category ? label(category) : allLabel}
    />
  )
}

export const matchesCategory = (
  question: {category?: string | null} | undefined,
  category: string | null,
) => !category || question?.category === category
