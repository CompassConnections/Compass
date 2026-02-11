import clsx from 'clsx'
import {useState} from 'react'
import {EyeOffIcon} from '@heroicons/react/outline'
import {Tooltip} from 'web/components/widgets/tooltip'
import {api} from 'web/lib/api'
import toast from 'react-hot-toast'
import {useT} from 'web/lib/locale'

export type HideProfileButtonProps = {
  hiddenUserId: string
  onHidden?: (userId: string) => void
  className?: string
  iconClassName?: string
  tooltip?: string
  ariaLabel?: string
  stopPropagation?: boolean
  suppressToast?: boolean
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
    suppressToast,
  } = props

  const t = useT()
  const [submitting, setSubmitting] = useState(false)

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (stopPropagation) e.stopPropagation()
    if (submitting) return
    setSubmitting(true)
    try {
      await api('hide-profile', {hiddenUserId})
      onHidden?.(hiddenUserId)
      if (!suppressToast)
        toast.success(
          t(
            'profiles.hidden_success',
            'Profile hidden. You will no longer see this person in search results.'
          )
        )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Tooltip text={tooltip ?? t('profile_grid.hide_profile', "Don't show again in search results")} noTap>
      <button
        className={clsx(
          'rounded-full p-1 hover:bg-canvas-200 shadow focus:outline-none',
          className
        )}
        onClick={onClick}
        aria-label={ariaLabel ?? t('profile_grid.hide_profile', 'Hide this profile')}
      >
        <EyeOffIcon className={clsx('h-5 w-5 guidance', iconClassName)}/>
      </button>
    </Tooltip>
  )
}

export default HideProfileButton
