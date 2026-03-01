import {flip, offset, shift, useFloating} from '@floating-ui/react'
import {Popover, PopoverButton, PopoverPanel, Transition} from '@headlessui/react'
import {ChevronDownIcon, ChevronUpIcon, EllipsisHorizontalIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {toKey} from 'common/parsing'
import {Fragment, ReactNode} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export type DropdownItem = {
  name: string
  icon?: ReactNode
  onClick: () => void | Promise<void>
}

export default function DropdownMenu(props: {
  items: DropdownItem[]
  icon?: ReactNode
  menuWidth?: string
  buttonClass?: string
  className?: string
  menuItemsClass?: string
  buttonDisabled?: boolean
  selectedItemName?: string
  closeOnClick?: boolean
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
    selectedItemName,
    closeOnClick,
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
      {({open, close}) => (
        <>
          <PopoverButton
            ref={refs.setReference}
            className={clsx('text-ink-500 hover-bold flex items-center', buttonClass)}
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
                'py-1',
              )}
            >
              {items.map((item) => (
                <button
                  key={item.name}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    e.preventDefault()
                    item.onClick()
                    if (closeOnClick) close()
                  }}
                  className={clsx(
                    selectedItemName && item.name === selectedItemName
                      ? 'bg-primary-100'
                      : 'hover:bg-canvas-100 hover:text-ink-900',
                    'text-ink-700 flex w-full gap-2 px-4 py-2 text-left text-sm rounded-md',
                  )}
                >
                  {item.icon && <div className="w-5">{item.icon}</div>}
                  {item.name}
                </button>
              ))}
            </PopoverPanel>
          </AnimationOrNothing>
        </>
      )}
    </Popover>
  )
}

export const AnimationOrNothing = (props: {
  animate: boolean
  show: boolean
  children: ReactNode
}) => {
  return props.animate ? (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
      show={props.show}
    >
      {props.children}
    </Transition>
  ) : (
    <>{props.children}</>
  )
}

export function DropdownOptions(props: {
  items: Record<string, any>
  onClick: (item: any) => void
  activeKey: string
  translationPrefix?: string
}) {
  const {items, onClick, activeKey, translationPrefix} = props
  const t = useT()

  const translateOption = (key: string, value: string) => {
    if (!translationPrefix) return value
    return t(`${translationPrefix}.${toKey(key)}`, value)
  }

  return (
    <Col>
      {Object.entries(items).map(([key, item]) => (
        <button
          key={key}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            e.preventDefault()
            onClick(key)
          }}
          className={clsx(
            key === activeKey ? 'bg-primary-100' : 'hover:bg-canvas-100 hover:text-ink-900',
            'text-ink-700 flex w-full gap-2 px-4 py-2 text-left text-sm rounded-md',
          )}
        >
          {item.icon && <div className="w-5">{item.icon}</div>}
          {translateOption(key, item.label ?? item)}
        </button>
      ))}
    </Col>
  )
}

export function DropdownButton(props: {open: boolean; content: ReactNode}) {
  const {open, content} = props
  return (
    <Row className="hover:text-ink-700 items-center gap-0.5 transition-all">
      {content}
      <span className="text-ink-400">
        {open ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
      </span>
    </Row>
  )
}
