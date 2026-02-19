import {Popover} from '@headlessui/react'
import clsx from 'clsx'
import {useState} from 'react'
import {usePopper} from 'react-popper'
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
  // When true, shows a tiny "new" badge at the top-left of the button
  showNewBadge?: boolean
  // Optional extra classes for the badge container (to tweak position/size)
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
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>()
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>()
  const {styles, attributes} = usePopper(referenceElement, popperElement, {
    strategy: withinOverflowContainer ? 'fixed' : 'absolute',
  })
  return (
    <Popover className={clsx('relative inline-block text-left', className)}>
      {({open, close}) => (
        <>
          <Popover.Button
            ref={setReferenceElement}
            className={clsx('flex items-center relative hover-bold', buttonClass)}
            onClick={(e: any) => {
              e.stopPropagation()
            }}
            disabled={buttonDisabled}
          >
            {showNewBadge && <NewBadge classes={newBadgeClassName} />}
            {buttonContent(open)}
          </Popover.Button>

          <AnimationOrNothing show={open} animate={!withinOverflowContainer}>
            <Popover.Panel
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className={clsx(
                'bg-canvas-0 ring-ink-1000 z-30 rounded-md px-2 py-2 shadow-lg ring-1 ring-opacity-5 focus:outline-none',
                menuWidth ?? 'w-36',
                popoverClassName,
              )}
            >
              {typeof dropdownMenuContent === 'function'
                ? dropdownMenuContent(close)
                : dropdownMenuContent}
            </Popover.Panel>
          </AnimationOrNothing>
        </>
      )}
    </Popover>
  )
}
