import {DotsHorizontalIcon, EyeIcon, LockClosedIcon, PencilIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import Router from 'next/router'
import Link from 'next/link'
import {User, UserActivity} from 'common/user'
import {Button} from 'web/components/buttons/button'
import {MoreOptionsUserButton} from 'web/components/buttons/more-options-user-button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import ProfilePrimaryInfo from './profile-primary-info'
import {track} from 'web/lib/service/analytics'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {ShareProfileButton} from '../widgets/share-profile-button'
import {Profile} from 'common/profiles/profile'
import {useUser} from 'web/hooks/use-user'
import {linkClass} from 'web/components/widgets/site-link'
import {updateProfile} from 'web/lib/api'
import {useState} from 'react'
import {VisibilityConfirmationModal} from './visibility-confirmation-modal'
import toast from "react-hot-toast";
import {StarButton} from "web/components/widgets/star-button";
import {disableProfile} from "web/lib/util/disable";
import {useT} from 'web/lib/locale'
import {Tooltip} from "web/components/widgets/tooltip";

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
    starredUserIds,
    refreshStars,
    showMessageButton,
    refreshProfile,
  } = props
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const [showVisibilityModal, setShowVisibilityModal] = useState(false)
  const disabled = profile.disabled
  const t = useT()

  console.debug('ProfileProfileHeader', {user, profile, userActivity, currentUser})

  return (
    <Col className="w-full">
      <Row className={clsx('flex-wrap justify-between gap-2 py-1')}>
        <Row className="items-center gap-1">
          <Col className="gap-1">
            {currentUser && isCurrentUser && disabled &&
                <div className="text-red-500">{t('profile.header.disabled_notice', 'You disabled your profile, so no one else can access it.')}</div>}
            <Row className="items-center gap-1 text-xl">
              {/*{!isCurrentUser && <OnlineIcon last_online_time={userActivity?.last_online_time}/>}*/}
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
            <Tooltip text={t('more_options_user.edit_profile', 'Edit profile')} noTap>
            <Button
              color={'gray-outline'}
              onClick={() => {
                track('editprofile')
                Router.push('profile')
              }}
              size="sm"
            >
              <PencilIcon className=" h-4 w-4"/>
            </Button>
            </Tooltip>

            <Tooltip text={t('more_options_user.profile_options', 'Profile options')} noTap>
            <DropdownMenu
              menuWidth={'w-52'}
              icon={
                <DotsHorizontalIcon className="h-5 w-5" aria-hidden="true"/>
              }
              items={[
                {
                  name:
                    profile.visibility === 'member'
                      ? t('profile.header.menu.list_public', 'List Profile Publicly')
                      : t('profile.header.menu.limit_members', 'Limit to Members Only'),
                  icon:
                    profile.visibility === 'member' ? (
                      <EyeIcon className="h-4 w-4"/>
                    ) : (
                      <LockClosedIcon className="h-4 w-4"/>
                    ),
                  onClick: () => setShowVisibilityModal(true),
                },
                {
                  name: disabled ? t('profile.header.menu.enable_profile', 'Enable profile') : t('profile.header.menu.disable_profile', 'Disable profile'),
                  icon: null,
                  onClick: async () => {
                    const confirmed = true // confirm(
                    //   'Are you sure you want to disable your profile? This will hide your profile from searches and listings..'
                    // )
                    if (confirmed) {
                      toast
                        .promise(disableProfile(!disabled), {
                          loading: disabled
                            ? t('profile.header.toast.enabling', 'Enabling profile...')
                            : t('profile.header.toast.disabling', 'Disabling profile...'),
                          success: () => {
                            return disabled
                              ? t('profile.header.toast.enabled', 'Profile enabled')
                              : t('profile.header.toast.disabled', 'Profile disabled')
                          },
                          error: () => {
                            return disabled
                              ? t('profile.header.toast.failed_enable', 'Failed to enable profile')
                              : t('profile.header.toast.failed_disable', 'Failed to disable profile')
                          },
                        })
                        .then(() => {
                          refreshProfile()
                        })
                        .catch(() => {
                          // return false
                        })
                    }
                  },
                },
              ]}
            />
            </Tooltip>
          </Row>
        ) : (
          <Row className="items-center gap-1 sm:gap-2">
            {/*TODO: Add score to profile page once we can efficiently compute it (i.e., not recomputing it for every profile)*/}
            {/*<CompatibleBadge compatibility={compatibilityScore}/>*/}
            <ShareProfileButton
              className="sm:flex"
              username={user.username}
            />
            {currentUser && (
              <StarButton
                targetProfile={profile}
                isStarred={starredUserIds.includes(user.id)}
                refresh={refreshStars}
              />
            )}
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
