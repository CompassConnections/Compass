import clsx from 'clsx'
import {ComponentPropsWithoutRef, forwardRef} from 'react'

export const Col = forwardRef(function Col(
  props: ComponentPropsWithoutRef<'div'>,
  ref: React.Ref<HTMLDivElement>,
) {
  const {children, className, ...rest} = props

  return (
    <div className={clsx(className, 'flex flex-col')} ref={ref} {...rest}>
      {children}
    </div>
  )
})
