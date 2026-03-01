import clsx from 'clsx'
import {ComponentPropsWithoutRef, forwardRef} from 'react'

export const Row = forwardRef(function Row(
  props: ComponentPropsWithoutRef<'div'>,
  ref: React.Ref<HTMLDivElement>,
) {
  const {children, className, ...rest} = props
  return (
    <div className={clsx(className, 'flex flex-row')} ref={ref} {...rest}>
      {children}
    </div>
  )
})
