import {DotsHorizontalIcon, EyeIcon, LockClosedIcon, PencilIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import Router from 'next/router'
import router from 'next/router'
import Link from 'next/link'
import {User, UserActivity} from 'common/user'
import {Button} from 'web/components/buttons/button'
import {MoreOptionsUserButton} from 'web/components/buttons/more-options-user-button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import ProfilePrimaryInfo from './profile-primary-info'
import {OnlineIcon} from '../online-icon'
import {track} from 'web/lib/service/analytics'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {ShareProfileButton} from '../widgets/share-profile-button'
import {Profile} from 'common/love/profile'
import {useUser} from 'web/hooks/use-user'
import {linkClass} from 'web/components/widgets/site-link'
import {updateProfile} from 'web/lib/api'
import {useState} from 'react'
import {VisibilityConfirmationModal} from './visibility-confirmation-modal'
import {deleteAccount} from "web/lib/util/delete";
import toast from "react-hot-toast";

export default function ProfileHeader(props: {
  user: User
  userActivity?: UserActivity
  profile: Profile
  simpleView?: boolean
  starredUserIds: string[]
  refreshStars: () => Promise<void>
  showMessageButton: boolean
  refreshProfile: () => void
}) {
  const {
    user,
    profile,
    userActivity,
    simpleView,
    // starredUserIds,
    // refreshStars,
    showMessageButton,
    refreshProfile,
  } = props
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const [showVisibilityModal, setShowVisibilityModal] = useState(false)

  console.debug('ProfileProfileHeader', {user, profile, userActivity, currentUser})

  return (
    <Col className="w-full">
      <Row className={clsx('flex-wrap justify-between gap-2 py-1')}>
        <Row className="items-center gap-1">
          <Col className="gap-1">
            <Row className="items-center gap-1 text-xl">
              {!isCurrentUser && <OnlineIcon last_online_time={userActivity?.last_online_time}/>}
              <span>
                {simpleView ? (
                  <Link className={linkClass} href={`/${user.username}`}>
                    <span className="font-semibold">{user.name}</span>
                  </Link>
                ) : (
                  <span className="font-semibold">{user.name}</span>
                )}
                {profile.age ? `, ${profile.age}` : ''}
              </span>
            </Row>
            <ProfilePrimaryInfo profile={profile}/>
          </Col>
        </Row>
        {currentUser && isCurrentUser ? (
          <Row className={'items-center gap-1 sm:gap-2'}>
            <ShareProfileButton
              className="hidden sm:flex"
              username={user.username}
            />
            <Button
              color={'gray-outline'}
              onClick={() => {
                track('edit love profile')
                Router.push('profile')
              }}
              size="sm"
            >
              <PencilIcon className=" h-4 w-4"/>
            </Button>

            <DropdownMenu
              menuWidth={'w-52'}
              icon={
                <DotsHorizontalIcon className="h-5 w-5" aria-hidden="true"/>
              }
              items={[
                {
                  name:
                    profile.visibility === 'member'
                      ? 'List Profile Publicly'
                      : 'Limit to Members Only',
                  icon:
                    profile.visibility === 'member' ? (
                      <EyeIcon className="h-4 w-4"/>
                    ) : (
                      <LockClosedIcon className="h-4 w-4"/>
                    ),
                  onClick: () => setShowVisibilityModal(true),
                },
                {
                  name: 'Delete profile',
                  icon: null,
                  onClick: async () => {
                    const confirmed = confirm(
                      'Are you sure you want to delete your profile? This cannot be undone.'
                    )
                    if (confirmed) {
                      toast
                        .promise(deleteAccount(user.username), {
                          loading: 'Deleting account...',
                          success: () => {
                            router.push('/')
                            return 'Your account has been deleted.'
                          },
                          error: () => {
                            return 'Failed to delete account.'
                          },
                        })
                        .then(() => {
                          // return true
                        })
                        .catch(() => {
                          // return false
                        })
                    }
                  },
                },
              ]}
            />
          </Row>
        ) : (
          <Row className="items-center gap-1 sm:gap-2">
            {/*TODO: Add score to profile page once we can efficiently compute it (i.e., not recomputing it for every profile)*/}
            {/*<CompatibleBadge compatibility={compatibilityScore}/>*/}
            <ShareProfileButton
              className="sm:flex"
              username={user.username}
            />
            {/*{currentUser && (*/}
            {/*  <StarButton*/}
            {/*    targetProfile={profile}*/}
            {/*    isStarred={starredUserIds.includes(user.id)}*/}
            {/*    refresh={refreshStars}*/}
            {/*  />*/}
            {/*)}*/}
            {currentUser && showMessageButton && (
              <SendMessageButton toUser={user} currentUser={currentUser}/>
            )}
            <MoreOptionsUserButton user={user}/>
          </Row>
        )}
      </Row>

      {/*<Row className="justify-end sm:hidden">*/}
      {/*  <ShareProfileButton username={user.username} />*/}
      {/*</Row>*/}

      <VisibilityConfirmationModal
        open={showVisibilityModal}
        setOpen={setShowVisibilityModal}
        currentVisibility={profile.visibility}
        onConfirm={async () => {
          const newVisibility =
            profile.visibility === 'member' ? 'public' : 'member'
          await updateProfile({visibility: newVisibility})
          refreshProfile()
        }}
      />
    </Col>
  )
}
