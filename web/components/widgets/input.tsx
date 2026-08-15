import clsx from 'clsx'
import {Search, X} from 'lucide-react'
import {ComponentPropsWithoutRef, forwardRef, Ref, useState} from 'react'
import {Row} from 'web/components/layout/row'

/** Text input. Wraps html `<input>` */
export const Input = forwardRef(
  (
    props: {
      error?: boolean
      searchIcon?: boolean
    } & ComponentPropsWithoutRef<'input'>,
    ref: Ref<HTMLInputElement>,
  ) => {
    const {error, searchIcon, className, value, onChange, ...rest} = props
    const [hasValue, setHasValue] = useState(!!value)

    // `focus-within` rather than `focus`: with `searchIcon` the border lives on this wrapper while the
    // caret is in a child input, so a plain `focus:` variant never fires and the field lights up
    // nowhere. The ring is the only thing telling you which of forty fields you are typing into.
    const rowClassName = clsx(
      'text-ink-700 bg-canvas-50 h-12 rounded-xl border border-canvas-300 px-4 shadow-sm items-center gap-2',
      'transition-all duration-150 hover:border-primary-300',
      'focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/25',
      className,
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      onChange?.(e)
    }

    const handleClear = () => {
      setHasValue(false)
      // Trigger onChange with empty value
      const syntheticEvent = {
        target: {value: ''},
      } as React.ChangeEvent<HTMLInputElement>
      onChange?.(syntheticEvent)
    }

    const elem = (
      <input
        ref={ref}
        step={0.001} // default to 3 decimal places
        value={value}
        onChange={handleChange}
        className={clsx(
          // `placeholder:text-ink-500`: with nothing set, the placeholder falls through to the
          // browser's own #808080, a flat neutral grey in a palette that has no neutral greys in it
          // — beside warm-tan labels and warm-tan typed text it was the one cool thing in the row.
          // `ink-500` is the same muted tone every secondary label uses, a step quieter than the
          // `ink-700` a real answer is typed in. Deliberately not the accent: gold here would make
          // an empty field read as a filled or active one.
          'w-full bg-canvas-50 placeholder:text-ink-500 invalid:border-error invalid:text-error  invalid:placeholder-rose-700 focus:outline-none focus:ring-0 disabled:cursor-not-allowed md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0',
          // Firefox ignores the -webkit- spin-button rules above and draws its own pair of arrows
          // inside the field, which on a narrow numeric input (a year, a height) takes a third of
          // the box. `appearance: textfield` is the half of the trick that it does listen to.
          rest.type === 'number' && '[appearance:textfield]',
          error
            ? 'border-error text-error focus:border-error focus:ring-error placeholder-rose-700' // matches invalid: styles
            : '',
          !searchIcon && rowClassName,
        )}
        {...rest}
      />
    )

    if (searchIcon)
      return (
        <Row className={rowClassName}>
          {/* `ink-500`, not `ink-400`: in dark mode `ink-400` is a literal neutral grey while the
              rest of the ramp is warm, so the icon read as a different family from the toolbar
              buttons standing right next to it, which are `ink-500` too. */}
          <Search className="w-4 h-4 text-ink-500" />
          {elem}
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-ink-500 hover:text-primary-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </Row>
      )

    return elem
  },
)
