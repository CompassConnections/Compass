import clsx from 'clsx'
import {useState} from 'react'
import {EyeIcon, EyeOffIcon} from '@heroicons/react/outline'
import {Tooltip} from 'web/components/widgets/tooltip'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

export type HideProfileButtonProps = {
  hiddenUserId: string
  onHidden?: (userId: string) => void
  className?: string
  iconClassName?: string
  tooltip?: string
  ariaLabel?: string
  stopPropagation?: boolean
}

export function HideProfileButton(props: HideProfileButtonProps) {
  const {
    hiddenUserId,
    onHidden,
    className,
    iconClassName,
    tooltip,
    ariaLabel,
    stopPropagation,
  } = props

  const t = useT()
  const [submitting, setSubmitting] = useState(false)
  const [clicked, setClicked] = useState(false)

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (stopPropagation) e.stopPropagation()
    if (submitting) return
    setSubmitting(true)
    setClicked(true)
    try {
      await api('hide-profile', {hiddenUserId})
      onHidden?.(hiddenUserId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Tooltip
      text={!clicked ? (tooltip ?? t('profile_grid.hide_profile', "Don't show again in search results")) : t('profile_grid.unhide_profile', "Show again in search results")}
      noTap>
      <button
        className={clsx(
          'rounded-full p-1 hover:bg-canvas-200 shadow focus:outline-none',
          className
        )}
        onClick={onClick}
        aria-label={
          ariaLabel ?? (!clicked
            ? t('profile_grid.hide_profile', 'Hide this profile')
            : t('profile_grid.unhide_profile', 'Unhide this profile'))
        }
      >
        {clicked || submitting ? <EyeIcon className={clsx('h-5 w-5 guidance', iconClassName)}/> :
          <EyeOffIcon className={clsx('h-5 w-5 guidance', iconClassName)}/>}
      </button>
    </Tooltip>
  )
}

export default HideProfileButton
