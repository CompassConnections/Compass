import {Switch} from '@headlessui/react'
import clsx from 'clsx'

import ShortToggle, {ToggleColorMode} from './widgets/short-toggle'

export const SwitchSetting = (props: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: 'Web' | 'Email' | 'Mobile'
  disabled: boolean
  colorMode?: ToggleColorMode
  testId?: string
}) => {
  const {colorMode, checked, onChange, label, disabled, testId} = props
  return (
    <Switch.Group as="div" className="flex items-center gap-3" data-testid={testId}>
      <ShortToggle colorMode={colorMode} on={checked} setOn={onChange} disabled={disabled} />
      {label && (
        <Switch.Label
          className={clsx(
            'text-ink-900 text-sm',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          {label}
        </Switch.Label>
      )}
    </Switch.Group>
  )
}
