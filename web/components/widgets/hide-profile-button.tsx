import {EyeIcon, EyeOffIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import {useMemo, useState} from 'react'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useHiddenProfiles} from 'web/hooks/use-hidden-profiles'
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
  eyeOff?: boolean
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
    eyeOff,
  } = props

  const t = useT()
  const [submitting, setSubmitting] = useState(false)
  const {hiddenProfiles, refreshHiddenProfiles} = useHiddenProfiles()
  const [optimisticHidden, setOptimisticHidden] = useState<boolean | undefined>(undefined)
  const hidden = useMemo(() => {
    if (optimisticHidden !== undefined) return optimisticHidden
    return hiddenProfiles?.some((u) => u.id === hiddenUserId) ?? false
  }, [hiddenProfiles, hiddenUserId, optimisticHidden])

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (stopPropagation) e.stopPropagation()
    if (submitting) return
    setSubmitting(true)

    // Optimistically update hidden state
    setOptimisticHidden(!hidden)

    try {
      if (hidden) {
        await api('unhide-profile', {hiddenUserId})
      } else {
        await api('hide-profile', {hiddenUserId})
      }
      refreshHiddenProfiles()
      onHidden?.(hiddenUserId)
    } catch (e) {
      console.error('Failed to toggle hide profile', e)
      // Revert optimistic update on failure
      setOptimisticHidden(hidden)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Tooltip
      text={
        hidden
          ? t('profile_grid.unhide_profile', 'Show again in search results')
          : (tooltip ?? t('profile_grid.hide_profile', "Don't show again in search results"))
      }
      noTap
    >
      <button
        className={clsx(
          'rounded-full p-1 hover:bg-canvas-200 shadow focus:outline-none',
          className,
        )}
        disabled={submitting}
        onClick={onClick}
        aria-label={
          ariaLabel ??
          (hidden
            ? t('profile_grid.unhide_profile', 'Unhide this profile')
            : t('profile_grid.hide_profile', 'Hide this profile'))
        }
      >
        {hidden || eyeOff ? (
          <EyeOffIcon className={clsx('h-5 w-5 guidance', iconClassName)} />
        ) : (
          <EyeIcon className={clsx('h-5 w-5 guidance', iconClassName)} />
        )}
      </button>
    </Tooltip>
  )
}

export default HideProfileButton
