import {EllipsisVerticalIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {DisplayUser} from 'common/api/user-types'
import {ChatMessage} from 'common/chat-message'
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {User} from 'common/user'
import {buildArray, filterDefined} from 'common/util/array'
import {cleanDoc} from 'common/util/parse'
import {DAY_MS, YEAR_MS} from 'common/util/time'
import {uniq} from 'lodash'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import {FaFlag, FaUserFriends, FaUserMinus} from 'react-icons/fa'
import {GiSpeakerOff} from 'react-icons/gi'
import {BackButton} from 'web/components/back-button'
import {ChatMessageItem, SystemChatMessageItem} from 'web/components/chat/chat-message'
import {CommentInputTextArea} from 'web/components/comments/comment-input'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {MultipleOrSingleAvatars} from 'web/components/multiple-or-single-avatars'
import {PageBase} from 'web/components/page-base'
import {ReportUser} from 'web/components/profile/report-user'
import {SEO} from 'web/components/SEO'
import {Avatar} from 'web/components/widgets/avatar'
import {useTextEditor} from 'web/components/widgets/editor'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {BannedBadge, UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {
  usePrivateMessages,
  useSortedPrivateMessageMemberships,
} from 'web/hooks/use-private-messages'
import {useRedirectIfSignedOut} from 'web/hooks/use-redirect-if-signed-out'
import {useUser} from 'web/hooks/use-user'
import {useUsersInStore} from 'web/hooks/use-user-supabase'
import {api} from 'web/lib/api'
import {firebaseLogin} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'
import {useGroupedMessages, usePaginatedScrollingMessages} from 'web/lib/supabase/chat-messages'

export default function PrivateMessagesPage() {
  const router = useRouter()
  const t = useT()
  const {channelId: channelIdString} = router.query as {channelId: string}
  const channelId = router.isReady ? parseInt(channelIdString) : undefined
  const user = useUser()
  if (user === null) {
    router.replace(`/signin?returnTo=${encodeURIComponent('/messages')}`)
    return <CompassLoadingIndicator />
  }
  return (
    <PageBase trackPageView={'private messages page'}>
      <SEO
        title={t('messages.title', 'Messages')}
        description={t('messages.seo.description', 'Messages')}
        url={`/messages/${channelIdString}`}
      />
      {router.isReady && channelId && user ? (
        <PrivateMessagesContent user={user} channelId={channelId} />
      ) : (
        <CompassLoadingIndicator />
      )}
    </PageBase>
  )
}

export function PrivateMessagesContent(props: {user: User; channelId: number}) {
  useRedirectIfSignedOut()

  const {channelId, user} = props
  const t = useT()
  const channelMembership = useSortedPrivateMessageMemberships(user.id, 1, channelId)
  const {channels, memberIdsByChannelId} = channelMembership
  const thisChannel = channels?.find((c) => c.channel_id == channelId)
  const loaded = channels !== undefined && channelId
  const memberIds = (thisChannel ? memberIdsByChannelId?.[thisChannel.channel_id] : undefined) ?? []

  return (
    <>
      {user && loaded ? (
        thisChannel ? (
          <PrivateChat channel={thisChannel} user={user} memberIds={memberIds} />
        ) : (
          <div className="flex h-[50vh] flex-col items-center justify-center mx-4">
            <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-8 text-center max-w-md">
              <p className="font-heading text-2xl font-medium text-ink-900 mb-2">
                {t('messages.no_access', 'You do not have access to this conversation.')}
              </p>
              <p className="text-ink-500 text-sm">
                {t('messages.no_access_hint', 'You may have been removed from this chat.')}
              </p>
            </div>
          </div>
        )
      ) : (
        <CompassLoadingIndicator />
      )}
    </>
  )
}

export const getFirstName = (name: string) => {
  const parts = name.trim().split(/\s+/)
  const first = parts[0].endsWith('.') && parts.length > 1 ? parts.slice(0, 2).join(' ') : parts[0]
  return first
}

export const PrivateChat = (props: {
  user: User
  channel: PrivateMessageChannel
  memberIds: string[]
}) => {
  const {user, channel, memberIds} = props
  const t = useT()
  const channelId = channel.channel_id
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isMobile = useIsMobile()

  const noOtherUser = memberIds.length === 0

  const totalMessagesToLoad = 100
  const {
    messages: _messages,
    setMessages,
    fetchMessages,
  } = usePrivateMessages(channelId, totalMessagesToLoad, user.id)

  const messages = _messages?.map(
    (m) =>
      ({
        ...m,
        id: m.id,
      }) as ChatMessage,
  )

  const loadMoreMessages = useCallback(
    (beforeId: number) => {
      fetchMessages(undefined, beforeId)
    },
    [fetchMessages],
  )

  const [showUsers, setShowUsers] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportTarget, setReportTarget] = useState<DisplayUser | null>(null)
  const maxUsersToGet = 100
  const messageUserIds = uniq(
    (messages ?? [])
      .filter((message) => message.userId !== user.id)
      .map((message) => message.userId),
  )

  // Note: we may have messages from users not in the channel, e.g., a system message
  const otherUsers = useUsersInStore(
    uniq(messageUserIds.concat(memberIds)),
    `${channelId}`,
    maxUsersToGet,
  )

  const members = filterDefined(otherUsers?.filter((user) => memberIds.includes(user.id)) ?? [])
  const router = useRouter()

  // Check ban status for messaging restrictions
  const allUsersBanned = members.length > 0 && members.every((member) => member.isBannedFromPosting)

  const {topVisibleRef, showMessages, innerDiv, outerDiv} = usePaginatedScrollingMessages(
    messages,
    user?.id,
    loadMoreMessages,
  )

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  // console.log('editingMessage', editingMessage)

  const editor = useTextEditor({
    key: `private-message-${channelId}-${user.id}`,
    size: 'sm',
    placeholder: t('messages.input_placeholder', 'Send a message'),
  })

  useEffect(() => {
    if (!editor) return
    if (editingMessage) {
      editor.commands.setContent(editingMessage.content)
      editor.commands.focus('end')
    }
  }, [editor, editingMessage])

  useEffect(() => {
    if (editor && !isMobile) {
      editor.commands.focus()
    }
  }, [editor])

  useEffect(() => {
    setAsSeen(channelId)
  }, [JSON.stringify(messages)])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // console.log('messages in privatechat', messages[0]?.reactions)
  const groupedMessages = useGroupedMessages(messages)

  // console.log('groupedMessages', groupedMessages)

  const submitMessage = useCallback(
    async (_type?: 'comment' | 'repost') => {
      if (!user) {
        track('sign in to comment')
        return await firebaseLogin()
      }
      if (!editor || editor.isEmpty || isSubmitting || !channelId) return
      setIsSubmitting(true)

      try {
        const content = cleanDoc(editor.getJSON())
        // console.log('submitting message\n', JSON.stringify(editor.getJSON()), JSON.stringify(content))
        if (editingMessage) {
          // console.log('editingMessage edit-message', editingMessage)
          setMessages((prevMessages) =>
            prevMessages?.map((m) => (m.id === editingMessage.id ? {...m, content: content} : m)),
          )
          await api('edit-message', {
            messageId: editingMessage.id,
            content: content,
          })
          editor.commands.clearContent(true)
          editor.commands.focus()
        } else {
          await api('create-private-user-message', {
            channelId,
            content: content,
          })
          editor.commands.clearContent(true)
          editor.commands.focus()
          fetchMessages()
        }
      } catch (e) {
        toast.error(
          editingMessage
            ? t('messages.toast.edit_failed', "Couldn't edit message.")
            : t(
                'messages.toast.send_failed',
                "Couldn't send message. Please try again later or contact support if the problem persists.",
              ),
        )
        console.error(e)
      } finally {
        setIsSubmitting(false)
        setEditingMessage(null)
      }
    },
    [user, editor, isSubmitting, channelId, editingMessage, setMessages],
  )

  const handleStartEdit = useCallback((chat: ChatMessage) => {
    setEditingMessage(chat)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingMessage(null)
    editor?.commands.clearContent(true)
    editor?.commands.focus()
  }, [editor])

  const SENTINEL_PREFETCH_PX = 1000 // how early to start loading

  const [replyToUserInfo, setReplyToUserInfo] = useState<any>()

  return (
    <Col className="w-full">
      <Row
        className={'bg-canvas-0 border border-canvas-200 h-14 items-center gap-2 rounded-xl px-2'}
      >
        <BackButton className="self-stretch mr-2" />
        {members && members.length > 0 ? (
          <MultipleOrSingleAvatars
            size="sm"
            spacing={0.5}
            startLeft={1}
            avatars={members}
            onClick={() => setShowUsers(true)}
          />
        ) : otherUsers === undefined ? null : (
          <Avatar size="sm" username="?" noLink />
        )}
        {members && members.length > 0 ? (
          <span
            className={clsx(
              'ml-1 cursor-pointer hover:text-primary-600 transition-colors font-medium text-sm text-ink-900',
              noOtherUser && 'italic text-ink-500',
            )}
            onClick={() =>
              members.length === 1 ? router.push(`/${members[0].username}`) : setShowUsers(true)
            }
          >
            {members
              .map((user) =>
                user.name ? getFirstName(user.name) : t('messages.deleted_user', 'Deleted user'),
              )
              .slice(0, 2)
              .join(', ')}
            {members.length > 2 && ` & ${members.length - 2} more`}
          </span>
        ) : otherUsers === undefined ? null : (
          <span className={'ml-1 italic text-ink-500 text-sm'}>
            {t('messages.deleted_user', 'Deleted user')}
          </span>
        )}

        {members?.length == 1 && members[0].isBannedFromPosting && <BannedBadge />}
        <DropdownMenu
          className={'ml-auto [&_button]:p-4'}
          menuWidth={'w-44'}
          icon={<EllipsisVerticalIcon className="h-5 w-5" />}
          items={buildArray(
            {
              icon: <FaUserFriends className={'h-5 w-5'} />,
              name: t('messages.menu.see_members', 'See members'),
              onClick: () => {
                setShowUsers(true)
              },
            },
            {
              icon: <GiSpeakerOff className="h-5 w-5" />,
              name: t('messages.menu.mute_1_day', 'Mute 1 day'),
              onClick: async () => {
                await toast.promise(
                  api('update-private-user-message-channel', {
                    channelId: channelId,
                    notifyAfterTime: Date.now() + DAY_MS,
                  }),
                  {
                    loading: t('messages.toast.muting_1_day.loading', 'Muting for 1 day...'),
                    success: t('messages.toast.muting_1_day.success', 'Muted for 1 day'),
                    error: t('messages.toast.muting_1_day.error', 'Failed to mute'),
                  },
                )
              },
            },
            {
              icon: <GiSpeakerOff className="h-5 w-5" />,
              name: t('messages.menu.mute_forever', 'Mute forever'),
              onClick: async () => {
                await toast.promise(
                  api('update-private-user-message-channel', {
                    channelId: channelId,
                    notifyAfterTime: Date.now() + 100 * YEAR_MS,
                  }),
                  {
                    loading: t('messages.toast.muting_forever.loading', 'Muting forever...'),
                    success: t('messages.toast.muting_forever.success', 'Muted forever'),
                    error: t('messages.toast.muting_forever.error', 'Failed to mute'),
                  },
                )
              },
            },
            {
              icon: <FaFlag className="h-5 w-5" />,
              name: t('messages.menu.report', 'Report'),
              onClick: () => {
                setReportTarget(members.length === 1 ? members[0] : null)
                setShowReport(true)
              },
            },
            {
              icon: <FaUserMinus className="h-5 w-5" />,
              name: t('messages.menu.leave_chat', 'Leave chat'),
              onClick: async () => {
                await api('leave-private-user-message-channel', {
                  channelId: channelId,
                })
                router.push('/messages')
              },
            },
          )}
        />
        {showUsers && (
          <Modal open={showUsers} setOpen={setShowUsers}>
            <Col className={clsx(MODAL_CLASS)}>
              <p className="font-heading text-2xl font-medium text-ink-900 mb-4">
                {t('messages.members', 'Members')}
              </p>
              {members?.map((user) => (
                <div
                  key={user.id}
                  className="w-full bg-canvas-0 border border-canvas-200 rounded-xl p-3 mb-2 transition-all hover:border-primary-300"
                >
                  <UserAvatarAndBadge user={user} />
                </div>
              ))}
            </Col>
          </Modal>
        )}
        {showReport && (
          <Modal
            open={showReport}
            setOpen={(open) => {
              setShowReport(open)
              if (!open) setReportTarget(null)
            }}
          >
            <Col className={clsx(MODAL_CLASS)}>
              {reportTarget ? (
                <ReportUser
                  user={reportTarget}
                  closeModal={() => {
                    setShowReport(false)
                    setReportTarget(null)
                  }}
                />
              ) : members && members.length > 0 ? (
                <>
                  <p className="font-heading text-2xl font-medium text-ink-900 mb-4">
                    {t('messages.report.select_user', 'Select a user to report')}
                  </p>
                  {members.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setReportTarget(user)}
                      className="w-full text-left bg-canvas-0 border border-canvas-200 rounded-xl p-3 mb-2 transition-all hover:border-primary-300"
                    >
                      <UserAvatarAndBadge user={user} />
                    </button>
                  ))}
                </>
              ) : (
                <span>{t('messages.report.no_users', 'No users to report')}</span>
              )}
            </Col>
          </Modal>
        )}
      </Row>
      <Col className="relative h-[calc(100dvh-210px-var(--hloss))] lg:h-[calc(100dvh-184px-var(--hloss))] xl:px-0">
        <div
          ref={outerDiv}
          className="relative h-full overflow-y-auto"
          style={{
            transform: isSafari ? 'translate3d(0, 0, 0)' : 'none',
          }}
          data-testid="conversation"
        >
          <div
            className="relative px-1 pb-4 pt-1 transition-all duration-100"
            ref={innerDiv}
            style={{
              transform: isSafari ? 'translate3d(0, 0, 0)' : 'none',
              opacity: showMessages ? 1 : 0,
            }}
          >
            {groupedMessages === undefined ? (
              <CompassLoadingIndicator />
            ) : (
              <>
                <div
                  className={'absolute h-1 '}
                  ref={topVisibleRef}
                  style={{top: SENTINEL_PREFETCH_PX}}
                />
                {groupedMessages.map((messages, i) => {
                  const firstMessage = messages[0]
                  if (firstMessage.visibility === 'system_status') {
                    return (
                      <SystemChatMessageItem
                        key={firstMessage.id}
                        chats={messages}
                        otherUsers={otherUsers
                          ?.concat([user])
                          .filter((user) => messages.some((m) => m.userId === user.id))}
                      />
                    )
                  }
                  const otherUser = otherUsers?.find((user) => user.id === firstMessage.userId)
                  return (
                    <ChatMessageItem
                      key={firstMessage.id}
                      chats={messages}
                      currentUser={user}
                      otherUser={otherUser}
                      hideAvatar={(otherUsers?.length ?? 0) < 2}
                      beforeSameUser={groupedMessages[i + 1]?.[0].userId === firstMessage.userId}
                      firstOfUser={groupedMessages[i - 1]?.[0].userId !== firstMessage.userId}
                      setMessages={setMessages}
                      onRequestEdit={handleStartEdit}
                      onReplyClick={(chat) =>
                        setReplyToUserInfo({
                          id: chat.userId,
                          username: otherUser?.username ?? '',
                        })
                      }
                    />
                  )
                })}
              </>
            )}
            {messages && messages.length === 0 && (
              <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-8 text-center mt-4">
                <p className="text-ink-500 text-sm">{t('messages.empty', 'No messages yet.')}</p>
                <p className="text-ink-300 text-xs mt-1">
                  {t('messages.empty_hint', 'Be the first to start the conversation!')}
                </p>
              </div>
            )}
          </div>
        </div>
      </Col>
      {allUsersBanned ? (
        <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 text-center m-2">
          <span className="text-ink-500 text-sm">
            {t(
              'messages.cannot_message_banned',
              "The profile was removed for suspicious activity; never send money to someone you haven't met.",
            )}
          </span>
        </div>
      ) : user.isBannedFromPosting ? (
        <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 text-center m-2">
          <span className="text-ink-500 text-sm">
            {t('messages.cannot_message_you_banned', "You can't text them as you got banned.")}
          </span>
        </div>
      ) : noOtherUser ? (
        <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 text-center m-2">
          <span className="text-ink-500 text-sm">
            {t(
              'messages.cannot_message_deleted',
              "You can't text them as they deleted their account.",
            )}
          </span>
        </div>
      ) : (
        <CommentInputTextArea
          editor={editor}
          user={user}
          submit={submitMessage}
          isSubmitting={isSubmitting}
          submitOnEnter={!isMobile}
          replyTo={replyToUserInfo}
          isEditing={!!editingMessage}
          cancelEditing={cancelEditing}
        />
      )}
    </Col>
  )
}

const setAsSeen = async (channelId: number) => {
  return api('set-channel-seen-time', {channelId})
}
