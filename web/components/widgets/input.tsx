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

    const rowClassName = clsx(
      'bg-canvas-50 h-12 rounded-xl border border-canvas-200 px-4 shadow-sm transition-colors items-center gap-2',
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
          'w-full bg-canvas-50 invalid:border-error invalid:text-error  invalid:placeholder-rose-700 focus:outline-none focus:ring-1 disabled:cursor-not-allowed md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0',
          error
            ? 'border-error text-error focus:border-error focus:ring-error placeholder-rose-700' // matches invalid: styles
            : 'focus:border-canvas-200 focus:ring-transparent',
          !searchIcon && rowClassName,
        )}
        {...rest}
      />
    )

    if (searchIcon)
      return (
        <Row className={rowClassName}>
          <Search className="w-4 h-4 text-canvas-400" />
          {elem}
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-canvas-400 hover:text-primary-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </Row>
      )

    return elem
  },
)
