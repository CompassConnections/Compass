import clsx from 'clsx'
import { HeartIcon } from '@heroicons/react/outline'
import { useState } from 'react'

import { api } from 'web/lib/api'
import { Button, buttonClass } from 'web/components/buttons/button'
import { track } from 'web/lib/service/analytics'
import { Tooltip } from 'web/components/widgets/tooltip'
import { Col } from 'web/components/layout/col'
import { MODAL_CLASS, Modal } from 'web/components/layout/modal'
import { Row } from 'web/components/layout/row'
import { Profile } from 'common/love/lover'
import { useUserById } from 'web/hooks/use-user-supabase'
import { MatchAvatars } from '../matches/match-avatars'
import { useProfile } from 'web/hooks/use-lover'
import { useAPIGetter } from 'web/hooks/use-api-getter'

export const LikeButton = (props: {
  targetProfile: Profile
  liked: boolean
  refresh: () => Promise<void>
  className?: string
}) => {
  const { targetProfile, liked, refresh, className } = props
  const targetId = targetProfile.user_id
  const [isLoading, setIsLoading] = useState(false)

  const { data, refresh: refreshHasFreeLike } = useAPIGetter(
    'has-free-like',
    {}
  )
  const hasFreeLike = data?.hasFreeLike ?? false

  const [showConfirmation, setShowConfirmation] = useState(false)

  const like = async () => {
    setShowConfirmation(false)
    setIsLoading(true)
    await api('like-lover', { targetUserId: targetId, remove: liked })
    track('like lover', {
      targetId,
      remove: liked,
    })
    await refresh()
    setIsLoading(false)
    await refreshHasFreeLike()
  }

  return (
    <Tooltip text={liked ? 'Unlike' : 'Send like'} noTap>
      <button
        disabled={isLoading}
        className={clsx(
          buttonClass('md', 'none'),
          'text-ink-500 disabled:text-ink-500 bg-canvas-0 active:bg-canvas-100 disabled:bg-canvas-100 border-ink-100 dark:border-ink-300 !rounded-full border shadow',
          isLoading && 'animate-pulse',
          className
        )}
        onClick={() => setShowConfirmation(true)}
      >
        <Col className="items-center">
          <HeartIcon
            className={clsx(
              'h-8 w-8',
              liked &&
                'fill-primary-400 stroke-primary-500 dark:stroke-primary-600'
            )}
          />
          <div className="p-2 pb-0 pt-0">{liked ? <>Liked!</> : <>Like</>}</div>
        </Col>
      </button>
      <LikeConfirmationDialog
        targetProfile={targetProfile}
        hasFreeLike={hasFreeLike}
        submit={like}
        open={!liked && showConfirmation}
        setOpen={setShowConfirmation}
      />
      <CancelLikeConfimationDialog
        targetProfile={targetProfile}
        submit={like}
        open={liked && showConfirmation}
        setOpen={setShowConfirmation}
      />
    </Tooltip>
  )
}

const LikeConfirmationDialog = (props: {
  targetProfile: Profile
  hasFreeLike: boolean
  open: boolean
  setOpen: (open: boolean) => void
  submit: () => void
}) => {
  const { open, setOpen, targetProfile, hasFreeLike, submit } = props
  const youProfile = useProfile()
  const user = useUserById(targetProfile.user_id)

  return (
    <Modal
      open={open}
      className={clsx(
        MODAL_CLASS,
        'pointer-events-auto max-h-[32rem] overflow-auto'
      )}
    >
      <Col className="gap-4">
        <div className="text-xl">Like {user ? user.name : ''}?</div>

        <Col className="gap-2">
          <div className="text-ink-500">
            They will get a notification. Unlocks messaging them.
          </div>
          <div className="text-ink-500">You get one like per day</div>
        </Col>

        {youProfile && user && (
          <MatchAvatars
            profileProfile={youProfile}
            matchedProfile={{ ...targetProfile, user: user as any }}
          />
        )}

        <Row className="mt-2 items-center justify-between">
          <Button color="gray-outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {
            <Button onClick={() => submit()} disabled={!hasFreeLike}>
              {hasFreeLike ? 'Use like for today' : 'Come back tomorrow!'}
            </Button>
          }
        </Row>
      </Col>
    </Modal>
  )
}

const CancelLikeConfimationDialog = (props: {
  targetProfile: Profile
  open: boolean
  setOpen: (open: boolean) => void
  submit: () => void
}) => {
  const { open, setOpen, targetProfile, submit } = props
  const user = useUserById(targetProfile.user_id)
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className={clsx(
        MODAL_CLASS,
        'pointer-events-auto max-h-[32rem] overflow-auto'
      )}
    >
      <Col className="gap-4">
        <div className="text-xl">Remove like of {user ? user.name : ''}</div>

        <Row className="mt-2 items-center justify-between">
          <Button color="gray-outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => submit()}>Remove like</Button>
        </Row>
      </Col>
    </Modal>
  )
}
