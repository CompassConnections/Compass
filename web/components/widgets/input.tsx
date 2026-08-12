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
          'w-full bg-canvas-50 invalid:border-error invalid:text-error  invalid:placeholder-rose-700 focus:outline-none focus:ring-0 disabled:cursor-not-allowed md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0',
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
          <Search className="w-4 h-4 text-ink-400" />
          {elem}
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-ink-400 hover:text-primary-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </Row>
      )

    return elem
  },
)
