import {flip, offset, shift, useFloating} from '@floating-ui/react'
import {Popover, PopoverButton, PopoverPanel} from '@headlessui/react'
import {EllipsisHorizontalIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {ReactNode} from 'react'
import {AnimationOrNothing} from 'web/components/comments/dropdown-menu'
import {Col} from 'web/components/layout/col'

export default function DropdownMenu(props: {
  items: ReactNode[]
  icon?: ReactNode
  menuWidth?: string
  buttonClass?: string
  className?: string
  menuItemsClass?: string
  buttonDisabled?: boolean
  withinOverflowContainer?: boolean
  buttonContent?: (open: boolean) => ReactNode
}) {
  const {
    items,
    menuItemsClass,
    menuWidth,
    buttonClass,
    className,
    buttonDisabled,
    withinOverflowContainer,
    buttonContent,
  } = props

  const {refs, floatingStyles} = useFloating({
    strategy: withinOverflowContainer ? 'fixed' : 'absolute',
    middleware: [offset(8), flip(), shift({padding: 8})],
  })

  const icon = props.icon ?? <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />

  return (
    <Popover className={clsx('relative inline-block text-left', className)}>
      {({open}) => (
        <>
          <PopoverButton
            ref={refs.setReference}
            className={clsx('text-ink-500 hover:text-ink-800 flex items-center', buttonClass)}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
            disabled={buttonDisabled}
          >
            <span className="sr-only">Open options</span>
            {buttonContent ? buttonContent(open) : icon}
          </PopoverButton>

          <AnimationOrNothing show={open} animate={!withinOverflowContainer}>
            <PopoverPanel
              ref={refs.setFloating}
              style={floatingStyles}
              className={clsx(
                'bg-canvas-0 ring-ink-1000 z-30 mt-2 rounded-md shadow-lg ring-1 ring-opacity-5 focus:outline-none',
                menuWidth ?? 'w-34',
                menuItemsClass,
                'p-1',
              )}
            >
              <Col className="gap-1">{items}</Col>
            </PopoverPanel>
          </AnimationOrNothing>
        </>
      )}
    </Popover>
  )
}
