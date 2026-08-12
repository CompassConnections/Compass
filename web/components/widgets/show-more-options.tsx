import clsx from 'clsx'

/**
 * The "there are more options than these" link, sized to sit *in* the row of chips rather than on a
 * line of its own beneath it.
 *
 * Every one of these follows a wrapping row of pills that rarely fills its last line, so putting the
 * link on its own line spent a whole row of vertical space to say six words — on the profile form,
 * four times over. Passed to `MultiCheckbox`'s `trailing` (or as a child of `ChoicesToggleGroup`) it
 * flows as one more item in the same wrap container: it sits at the end of the last line when there
 * is room, and drops to its own line only when there is not.
 *
 * Deliberately not a pill, and deliberately quiet: muted, small and unweighted, so the eye reads the
 * options first and finds this only when none of them fit. In the accent colour at the chips' own
 * size it competed with both the chips and the section label above them — three things shouting on a
 * row where only the options matter.
 */
export const ShowMoreOptions = (props: {
  label: string
  onClick: () => void
  className?: string
}) => {
  const {label, onClick, className} = props
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'text-ink-500 hover:text-ink-700 inline-flex items-center whitespace-nowrap px-1 py-1.5 text-xs underline-offset-2 transition-colors hover:underline',
        className,
      )}
    >
      {label}
    </button>
  )
}
