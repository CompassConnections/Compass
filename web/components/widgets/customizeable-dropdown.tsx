import {flip, offset, shift, useFloating} from '@floating-ui/react'
import {Popover, PopoverButton, PopoverPanel} from '@headlessui/react'
import clsx from 'clsx'
import {NewBadge} from 'web/components/new-badge'

import {AnimationOrNothing} from '../comments/dropdown-menu'

export function CustomizeableDropdown(props: {
  menuWidth?: string
  buttonContent: (open: boolean) => React.ReactNode
  dropdownMenuContent: React.ReactNode | ((close: () => void) => React.ReactNode)
  buttonClass?: string
  className?: string
  buttonDisabled?: boolean
  closeOnClick?: boolean
  withinOverflowContainer?: boolean
  popoverClassName?: string
  showNewBadge?: boolean
  newBadgeClassName?: string
}) {
  const {
    menuWidth,
    buttonContent,
    dropdownMenuContent,
    buttonClass,
    className,
    buttonDisabled,
    withinOverflowContainer,
    popoverClassName,
    showNewBadge,
    newBadgeClassName,
  } = props

  const {refs, floatingStyles} = useFloating({
    strategy: withinOverflowContainer ? 'fixed' : 'absolute',
    middleware: [offset(8), flip(), shift({padding: 8})],
  })

  return (
    <Popover className={clsx('relative inline-block text-left', className)}>
      {({open, close}) => (
        <>
          <PopoverButton
            ref={refs.setReference}
            className={clsx('flex items-center relative hover-bold', buttonClass)}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
            disabled={buttonDisabled}
          >
            {showNewBadge && <NewBadge classes={newBadgeClassName} />}
            {buttonContent(open)}
          </PopoverButton>

          <AnimationOrNothing show={open} animate={!withinOverflowContainer}>
            <PopoverPanel
              ref={refs.setFloating}
              style={floatingStyles}
              className={clsx(
                'bg-canvas-0 ring-ink-1000 z-30 rounded-md px-2 py-2 shadow-lg ring-1 ring-opacity-5 focus:outline-none',
                menuWidth ?? 'w-36',
                popoverClassName,
              )}
            >
              {typeof dropdownMenuContent === 'function'
                ? dropdownMenuContent(close)
                : dropdownMenuContent}
            </PopoverPanel>
          </AnimationOrNothing>
        </>
      )}
    </Popover>
  )
}
