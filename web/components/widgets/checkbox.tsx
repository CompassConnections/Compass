import clsx from 'clsx'

export function Checkbox(props: {
  label: string
  checked: boolean
  toggle: (checked: boolean) => void
  className?: string
  disabled?: boolean
}) {
  const {label, checked, toggle, className, disabled} = props

  return (
    <div className={clsx(className, 'space-y-5 px-2 py-1')}>
      <label
        className={clsx(
          'relative flex items-center cursor-pointer select-none hover-bold',
          disabled && 'cursor-not-allowed',
        )}
      >
        <input
          id={label}
          type="checkbox"
          className="border-ink-300 bg-canvas-0 dark:border-ink-500 text-primary-600 focus:ring-primary-500 h-5 w-5 rounded hover:bg-canvas-300"
          checked={checked}
          onChange={(e) => toggle(e.target.checked)}
          disabled={disabled}
        />
        <span
          className={clsx(
            'ml-3 whitespace-nowrap font-medium',
            disabled ? 'text-ink-300' : 'text-ink-700',
          )}
        >
          {label}
        </span>
      </label>
    </div>
  )
}
