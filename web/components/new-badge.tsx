import clsx from "clsx"

export function NewBadge(props: { classes: string | undefined }) {
  return <span
    className={clsx(
      "absolute z-10 rounded px-1 text-xs text-primary-500 font-semibold tracking-wide shadow",
      props.classes
    )}
  >
    new
  </span>
}