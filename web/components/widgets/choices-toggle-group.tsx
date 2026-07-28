import {RadioGroup} from '@headlessui/react'
import clsx from 'clsx'
import {toKey} from 'common/parsing'
import {useT} from 'web/lib/locale'

// Selected states mirror MultiCheckbox's chip exactly, including the amber lift on the filled one, so
// a single-choice control and a multi-choice control read as the same kind of thing.
const SELECTED_CTA =
  'aria-checked:border-cta aria-checked:bg-cta aria-checked:text-white aria-checked:shadow-[0_2px_8px_rgba(193,127,62,0.28)]'
const UNSELECTED =
  'border-canvas-300 bg-canvas-0 text-ink-600 hover:border-primary-400 hover:text-primary-700'

/**
 * The pill's shape, motion and focus ring, split out so other single-choice controls that are not
 * built on `RadioGroup` — the theme picker in settings — can be the same object rather than a
 * lookalike. Pair it with `pillColors[...]`, which keys off `aria-checked`, so any control using
 * these must set that attribute.
 */
export const pillBase = clsx(
  'inline-flex cursor-pointer select-none items-center rounded-full border px-3.5 py-1.5 text-sm font-medium outline-none transition-all duration-150',
  'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas-50',
)

const colorClasses = {
  'indigo-dark': `${UNSELECTED} ${SELECTED_CTA}`,
  indigo: `${UNSELECTED} aria-checked:border-primary-400 aria-checked:bg-primary-100 aria-checked:text-primary-900`,
  green: `${UNSELECTED} aria-checked:border-teal-500 aria-checked:bg-teal-500 aria-checked:text-ink-0`,
  red: `${UNSELECTED} aria-checked:border-scarlet-500 aria-checked:bg-scarlet-500 aria-checked:text-ink-0`,
}

export const pillColors = colorClasses

export type ColorType = keyof typeof colorClasses

export function ChoicesToggleGroup<T extends Record<string, string | number | boolean>>(props: {
  currentChoice: T[keyof T] | undefined | null
  choicesMap: T
  disabled?: boolean
  disabledOptions?: Array<T[keyof T]>
  /** Receives `null` when the selected option is clicked again to clear it. */
  setChoice: (val: T[keyof T] | null) => void
  /** Opt out where the field genuinely has no empty state. */
  allowDeselect?: boolean
  color?: ColorType
  className?: string
  toggleClassName?: string
  children?: React.ReactNode
  translationPrefix?: string
}) {
  const {
    currentChoice,
    setChoice,
    disabled,
    disabledOptions,
    choicesMap,
    color = 'indigo-dark',
    className,
    children,
    toggleClassName,
    translationPrefix,
    allowDeselect = true,
  } = props
  const t = useT()
  // Object.entries(choicesMap).map(([choiceKey, choice]) => (
  //   console.log(`${translationPrefix}.${toKey(String(choice))}`)
  // ))
  return (
    // No container box. A bordered well holding segments was a second selection language sitting
    // beside the pills that MultiCheckbox renders — and on the profile form the two appear within a
    // few hundred pixels of each other. Free-floating pills, styled to match, are the one language.
    <RadioGroup
      className={clsx(
        className,
        'flex flex-row flex-wrap gap-2',
        disabled && '!cursor-not-allowed',
      )}
      value={currentChoice ?? undefined}
      onChange={setChoice}
      disabled={disabled}
    >
      {Object.entries(choicesMap).map(([choiceKey, choice]) => (
        <RadioGroup.Option
          key={choiceKey}
          value={choice}
          disabled={disabledOptions?.includes(choice as any)}
          // A radio group has no way back to empty: once an answer is picked the field is committed
          // for good, which is wrong on a form where every field is optional. Clicking the selected
          // option clears it. RadioGroup fires no `onChange` when the value is unchanged, so this
          // handler is the only thing that runs on that click.
          onClick={() => {
            if (allowDeselect && choice === currentChoice) setChoice(null)
          }}
          title={
            allowDeselect && choice === currentChoice
              ? t('common.click_to_clear', 'Click to clear')
              : undefined
          }
          className={({disabled}) =>
            clsx(
              pillBase,
              disabled
                ? 'border-canvas-200 bg-canvas-100 text-ink-300 cursor-not-allowed'
                : colorClasses[color],
              toggleClassName,
            )
          }
        >
          <RadioGroup.Label as="span">
            {translationPrefix
              ? t(`${translationPrefix}.${toKey(String(choice))}`, choiceKey)
              : choiceKey}
          </RadioGroup.Label>
        </RadioGroup.Option>
      ))}
      {children}
    </RadioGroup>
  )
}
