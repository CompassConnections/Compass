import {StarIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {useEffect, useState} from 'react'
import {buttonClass} from 'web/components/buttons/button'
import {Tooltip} from 'web/components/widgets/tooltip'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

export const StarButton = (props: {
  targetProfile: Profile
  isStarred: boolean
  refresh: () => Promise<void>
  hideTooltip?: boolean
  className?: string
  size?: string
  onPointerDown?: () => void
}) => {
  const {targetProfile, refresh, hideTooltip, className, size = 'w-6 h-6', onPointerDown} = props
  const targetId = targetProfile.user_id
  const [isStarred, setIsStarred] = useState(props.isStarred)
  const t = useT()

  useEffect(() => {
    setIsStarred(props.isStarred)
  }, [props.isStarred])

  const star = async () => {
    setIsStarred(!isStarred)
    await api('star-profile', {
      targetUserId: targetId,
      remove: isStarred,
    }).catch(() => {
      setIsStarred(isStarred)
    })
    track('star profile', {
      targetId,
      remove: isStarred,
    })
    await refresh()
  }

  const button = (
    <button
      data-testid="star-profile-button"
      className={clsx(
        'border border-canvas-200',
        buttonClass('xs', 'none'),
        isStarred
          ? 'bg-primary-50 border-primary-200 text-primary-600'
          : 'bg-canvas-50 border-canvas-300 text-ink-500 hover:border-primary-400 hover:bg-primary-50',
        className,
      )}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        star()
      }}
      onPointerDown={onPointerDown}
    >
      <StarIcon className={clsx(size, isStarred && 'fill-primary-500')} />
    </button>
  )

  if (hideTooltip) return button

  return (
    <Tooltip
      text={
        isStarred
          ? t('star_button.unsave', 'Unsave Profile')
          : t('star_button.save', 'Save Profile')
      }
      noTap
    >
      {button}
    </Tooltip>
  )
}
