import {Col} from 'web/components/layout/col'
import {groupBy, orderBy} from 'lodash'
import {useLiveCommentsOnProfile} from 'web/hooks/use-comments-on-profile'
import {ProfileCommentInput, ProfileProfileCommentThread,} from 'web/components/profile-comments'
import {User} from 'common/user'
import {Row} from 'web/components/layout/row'
import ShortToggle from 'web/components/widgets/short-toggle'
import {useState} from 'react'
import {updateProfile} from 'web/lib/api'
import {Tooltip} from 'web/components/widgets/tooltip'
import {toast} from 'react-hot-toast'
import {Subtitle} from './widgets/profile-subtitle'
import {Profile} from 'common/profiles/profile'
import {useT} from "web/lib/locale";

export const ProfileCommentSection = (props: {
  onUser: User
  profile: Profile
  currentUser: User | null | undefined
  simpleView?: boolean
}) => {
  const {onUser, currentUser, simpleView} = props
  const t = useT()
  const comments = useLiveCommentsOnProfile(onUser.id).filter((c) => !c.hidden)
  const parentComments = comments.filter((c) => !c.replyToCommentId)
  const commentsByParent = groupBy(comments, (c) => c.replyToCommentId ?? '_')
  const [profile, setProfile] = useState<Profile>(props.profile)
  const isCurrentUser = currentUser?.id === onUser.id

  if (!currentUser && (!profile.comments_enabled || parentComments.length == 0))
    return null

  return (
    <Col className={'mt-4 rounded py-2'}>
      <Row className={'mb-4 justify-between'}>
        <Subtitle>{t('profile.comments.section_title', 'Endorsements')}</Subtitle>
        {isCurrentUser && !simpleView && (
          <Tooltip
            text={
              (profile.comments_enabled ? 'Disable' : 'Enable') +
              ' endorsements from others'
            }
          >
            <ShortToggle
              on={profile.comments_enabled}
              setOn={(on) => {
                const update = {comments_enabled: on}
                setProfile((l) => ({...l, ...update}))
                toast.promise(updateProfile(update), {
                  loading: on
                    ? t('profile.comments.enabling', 'Enabling endorsements from others')
                    : t('profile.comments.disabling', 'Disabling endorsements from others'),
                  success: on
                    ? t('profile.comments.enabled', 'Endorsements enabled from others')
                    : t('profile.comments.disabled', 'Endorsements disabled from others'),
                  error: t('profile.comments.update_error', 'Failed to update endorsement status'),
                })
              }}
            />
          </Tooltip>
        )}
      </Row>
      {!simpleView && (
        <>
          {currentUser && profile.comments_enabled && (
            <>
              <div className="mb-4">
                {isCurrentUser ? (
                  <>{t('profile.comments.current_user_hint', 'Other users can write endorsements of you here.')}</>
                ) : (
                  <>{t('profile.comments.other_user_hint', 'If you know them, write something nice that adds to their profile.')}</>
                )}
              </div>
              {!isCurrentUser && (
                <ProfileCommentInput
                  className="mb-4 mr-px mt-px"
                  onUserId={onUser.id}
                  trackingLocation={'contract page'}
                />
              )}
            </>
          )}
          {!profile.comments_enabled &&
            (isCurrentUser ? (
              <span className={'text-ink-500 text-sm'}>
                {t('profile.comments.feature_disabled_self', 'This feature is disabled')}
              </span>
            ) : (
              <span className={'text-ink-500 text-sm'}>
                {t('profile.comments.feature_disabled_other', '{name} has disabled endorsements from others.', {name: onUser.name})}
              </span>
            ))}
        </>
      )}
      {profile.comments_enabled &&
        orderBy(parentComments, 'createdTime', 'desc').map((c) => (
          <ProfileProfileCommentThread
            key={c.id + 'thread'}
            trackingLocation={onUser.name + 'comments  section'}
            threadComments={commentsByParent[c.id] ?? []}
            parentComment={c}
            onUser={onUser}
            showReplies={true}
            inTimeline={false}
          />
        ))}
    </Col>
  )
}
