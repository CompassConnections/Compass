import clsx from 'clsx'
import { StarIcon } from '@heroicons/react/outline'
import { useState, useEffect } from 'react'

import { api } from 'web/lib/api'
import { buttonClass } from 'web/components/buttons/button'
import { track } from 'web/lib/service/analytics'
import { Tooltip } from 'web/components/widgets/tooltip'
import { Profile } from 'common/love/profile'

export const StarButton = (props: {
  targetProfile: Profile
  isStarred: boolean
  refresh: () => Promise<void>
  hideTooltip?: boolean
  className?: string
}) => {
  const { targetProfile, refresh, hideTooltip, className } = props
  const targetId = targetProfile.user_id
  const [isStarred, setIsStarred] = useState(props.isStarred)

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
      className={clsx(
        buttonClass('xs', 'none'),
        'text-ink-500 group !rounded-full',
        className
      )}
      onClick={(e) => {
        e.preventDefault()
        star()
      }}
    >
      <StarIcon
        className={clsx(
          'h-8 w-8 transition-colors group-hover:fill-yellow-400/70',
          isStarred &&
            'fill-yellow-400 stroke-yellow-500 dark:stroke-yellow-600'
        )}
      />
    </button>
  )

  if (hideTooltip) return button

  return (
    <Tooltip text={isStarred ? 'Unsave Profile' : 'Save Profile'} noTap>
      {button}
    </Tooltip>
  )
}
