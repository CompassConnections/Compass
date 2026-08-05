import {CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function LookingForToggle(props: {
  setLookingForFilters: (checked: boolean) => void
  youProfile: Profile | undefined | null
  checked: boolean
  hidden: boolean
}) {
  const {setLookingForFilters, checked, hidden} = props
  const t = useT()
  if (hidden) {
    return <></>
  }

  // Same wording as the profile editor's "Who I'm looking for" section, since that's exactly the set of
  // fields this copies into the search (age, gender, connection type).
  const label = t('filter.looking_for_toggle', "Who I'm looking for")

  // Deliberately NOT chip-shaped: it sits right under the active-filter chips, and a pill there
  // reads as one more chip — i.e. as state — when it is actually an action that writes a bundle of
  // filters. Full-width and rectangular separates the two.
  return (
    <Row className="w-full">
      <label
        className={clsx(
          'group relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-150',
          'focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-1 focus-within:ring-offset-canvas-50',
          checked
            ? 'border-cta bg-cta/10 text-cta'
            : 'border-canvas-300 bg-canvas-0 text-ink-600 hover:border-primary-400 hover:text-primary-700',
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => setLookingForFilters(!checked)}
        />
        <span className="font-medium">{label}</span>
        {checked ? (
          <CheckIcon className="h-4 w-4 flex-shrink-0" strokeWidth={3} />
        ) : (
          <span className="text-xs text-ink-400 whitespace-nowrap">
            {t('filter.looking_for_toggle.apply', 'Apply')}
          </span>
        )}
      </label>
    </Row>
  )
}
