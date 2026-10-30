import {EllipsisVerticalIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {DisplayUser} from 'common/api/user-types'
import {ChatMessage} from 'common/chat-message'
import {isAdminUserId} from 'common/envs/constants'
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {User} from 'common/user'
import {buildArray, filterDefined} from 'common/util/array'
import {cleanDoc, richTextToString} from 'common/util/parse'
import {DAY_MS, YEAR_MS} from 'common/util/time'
import dayjs from 'dayjs'
import {keyBy, uniq} from 'lodash'
import Link from 'next/link'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useRef, useState} from 'react'
import toast from 'react-hot-toast'
import {FaFlag, FaRegCopy, FaUserFriends, FaUserMinus, FaUserSlash} from 'react-icons/fa'
import {GiSpeakerOff} from 'react-icons/gi'
import {BackButton} from 'web/components/back-button'
import {ChatMessageItem, SystemChatMessageItem} from 'web/components/chat/chat-message'
import {PendingOpenerBubble} from 'web/components/chat/pending-opener'
import {TypingIndicator} from 'web/components/chat/typing-indicator'
import {CommentInputTextArea} from 'web/components/comments/comment-input'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {ChatProfilePanel} from 'web/components/messaging/chat-profile-panel'
import {
  AccountOnHoldNotice,
  isAutoBanUnderReviewError,
} from 'web/components/moderation/account-on-hold'
import {
  isFirstMessageRejectedError,
  isOpenerReviewRejection,
} from 'web/components/moderation/profile-incomplete'
import {MultipleOrSingleAvatars} from 'web/components/multiple-or-single-avatars'
import {PageBase} from 'web/components/page-base'
import {blockUser, unblockUser} from 'web/components/profile/block-user'
import {ReportUser} from 'web/components/profile/report-user'
import {ConversationSafetyTip} from 'web/components/safety-note'
import {SEO} from 'web/components/SEO'
import {Avatar} from 'web/components/widgets/avatar'
import {useTextEditor} from 'web/components/widgets/editor'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {AdminBadge, BannedBadge, UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {useElementSize} from 'web/hooks/use-element-size'
import {useHideBottomNavOnKeyboard} from 'web/hooks/use-hide-bottom-nav-on-keyboard'
import {useIsMobile} from 'web/hooks/use-is-mobile'
import {useIsPageVisible} from 'web/hooks/use-page-visible'
import {usePreserveScrollFromBottom} from 'web/hooks/use-preserve-scroll-from-bottom'
import {
  usePrivateMessages,
  useSortedPrivateMessageMemberships,
} from 'web/hooks/use-private-messages'
import {useRedirectIfSignedOut} from 'web/hooks/use-redirect-if-signed-out'
import {useReviewPromptOnConversationExit} from 'web/hooks/use-review-prompt'
import {useSharePromptOnConversationExit} from 'web/hooks/use-share-prompt'
import {useTypingIndicator} from 'web/hooks/use-typing-indicator'
import {isBlocked, usePrivateUser, useUser} from 'web/hooks/use-user'
import {useUsersInStore} from 'web/hooks/use-user-supabase'
import {useVisualViewportHeight} from 'web/hooks/use-visual-viewport-height'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {clearPendingOpener, setPendingOpener, usePendingOpener} from 'web/lib/pending-openers'
import {track} from 'web/lib/service/analytics'
import {useGroupedMessages, usePaginatedScrollingMessages} from 'web/lib/supabase/chat-messages'
import {copyToClipboard} from 'web/lib/util/copy'
import {promptSignIn} from 'web/lib/util/signup'

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
    <PageBase trackPageView={'private messages page'} className={'col-span-10 lg:!mt-2'} hideFooter>
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
  const {channels, memberIdsByChannelId, leftMemberIdsByChannelId} = channelMembership
  const thisChannel = channels?.find((c) => c.channel_id == channelId)
  const loaded = channels !== undefined && channelId
  const memberIds = (thisChannel ? memberIdsByChannelId?.[thisChannel.channel_id] : undefined) ?? []
  const leftMemberIds =
    (thisChannel ? leftMemberIdsByChannelId?.[thisChannel.channel_id] : undefined) ?? []

  return (
    <>
      {user && loaded ? (
        thisChannel ? (
          <PrivateChat
            channel={thisChannel}
            user={user}
            memberIds={memberIds}
            leftMemberIds={leftMemberIds}
          />
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

/**
 * Renders the loaded messages as a plain-text transcript, oldest first:
 *   [2026-08-03 14:32] Martin (me): hello
 *
 *   [2026-08-03 14:35] Liz: hi
 * Timestamps are in the reader's local timezone. System status messages (joined/left the chat) are
 * left out.
 */
export const messagesToPlainText = (
  messages: ChatMessage[] | undefined,
  user: User,
  otherUsers: DisplayUser[] | undefined,
  t: ReturnType<typeof useT>,
) => {
  const usersById = keyBy(filterDefined(otherUsers ?? []), 'id')
  const nameOf = (userId: string) => {
    if (userId === user.id)
      return `${getFirstName(user.name)} ${t('messages.copy.me_suffix', '(me)')}`
    const name = usersById[userId]?.name
    return name ? getFirstName(name) : t('messages.deleted_user', 'Deleted user')
  }

  return (
    (messages ?? [])
      // usePrivateMessages returns newest first; a transcript reads oldest first.
      .slice()
      .reverse()
      .filter((m) => m.visibility !== 'system_status')
      .map(
        (m) =>
          `[${dayjs(m.createdTime).format('YYYY-MM-DD HH:mm')}] ${nameOf(m.userId)}: ${richTextToString(
            m.content,
          ).trim()}`,
      )
      .join('\n\n')
  )
}

export const PrivateChat = (props: {
  user: User
  channel: PrivateMessageChannel
  memberIds: string[]
  // Members who left the chat. Only displayed when nobody else is left, so a group chat names the
  // people you can still talk to rather than everyone who ever passed through.
  leftMemberIds?: string[]
}) => {
  const {user, channel, memberIds, leftMemberIds = []} = props
  const t = useT()
  useHideBottomNavOnKeyboard()
  useVisualViewportHeight()
  const channelId = channel.channel_id
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isMobile = useIsMobile()

  // No one else is still in the channel: either they left, or they deleted their account. The two
  // read very differently to the reader, so they're told apart below by whether the user still exists.
  const noOtherUser = memberIds.length === 0
  const displayedMemberIds = noOtherUser ? uniq(leftMemberIds) : memberIds

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

  // Someone else wrote in here, and it isn't a join/leave notice. The whole of what this page claims
  // to know: there was something in this thread worth feeling good about, and they have just read it.
  // Whether the exchange is two-way enough to earn an ask is decided server-side, against every
  // conversation rather than this one.
  const sawReply = (messages ?? []).some(
    (m) => m.userId !== user.id && m.visibility !== 'system_status',
  )
  useReviewPromptOnConversationExit(sawReply)
  // Same moment, every platform; in the app it waits for the review card to have its turn first.
  useSharePromptOnConversationExit(sawReply)

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
    uniq(messageUserIds.concat(displayedMemberIds)),
    `${channelId}`,
    maxUsersToGet,
  )

  const members = filterDefined(
    otherUsers?.filter((user) => displayedMemberIds.includes(user.id)) ?? [],
  )
  // They left the chat but their account is still around, so we can name them.
  const leftMembers = members.filter((member) => leftMemberIds.includes(member.id))

  // Blocking leaves the thread readable but not writable. Hiding it outright would destroy the
  // evidence someone needs to file a report right after blocking, so the history stays and only the
  // composer is replaced. The server refuses the send either way — see
  // `backend/api/src/create-private-user-message.ts`.
  const privateUser = usePrivateUser()
  const blockedInChannel = (otherUsers ?? []).some((member) => isBlocked(privateUser, member.id))
  const router = useRouter()

  // Wide screens put the other person's profile beside a 1-on-1 chat. The chat column is at least
  // wide enough for an 80-character message plus a small gutter, and also wide enough that sidebar
  // plus chat fill half the window — this is the chat page, so the chat never becomes the minor
  // column. The panel takes the rest, and appears only once that rest reaches its minimum width.
  // Measured on the page area rather than the window so a collapsed sidebar counts, and decided in
  // JS rather than CSS so the panel's requests never fire on screens that wouldn't show it.
  const layoutRef = useRef<HTMLDivElement>(null)
  const layoutSize = useElementSize(layoutRef)
  const rootFontPx =
    typeof window === 'undefined'
      ? 16
      : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const isOneOnOne = displayedMemberIds.length === 1
  // Everything left of the chat (sidebar, page gutter), re-read whenever the area resizes, which is
  // also what a sidebar collapse or a window resize does.
  const layoutLeft =
    layoutSize && layoutRef.current ? layoutRef.current.getBoundingClientRect().left : 0
  const chatColumnPx =
    typeof window === 'undefined'
      ? CHAT_COLUMN_REM * rootFontPx
      : Math.max(CHAT_COLUMN_REM * rootFontPx, window.innerWidth / 2 - layoutLeft)
  // "Name | Messages | Compass" in the tab once we know who this is with: first names only, as in
  // the header. Until then the page's plain "Messages" title stands.
  const memberNames = members.map((member) =>
    member.name ? getFirstName(member.name) : t('messages.deleted_user', 'Deleted user'),
  )
  const chatTitle =
    otherUsers === undefined
      ? undefined
      : memberNames.length === 0
        ? t('messages.deleted_user', 'Deleted user')
        : memberNames.length === 1
          ? memberNames[0]
          : memberNames.slice(0, 2).join(', ') +
            (memberNames.length > 2 ? ` & ${memberNames.length - 2} more` : '')

  const showProfilePanel =
    isOneOnOne &&
    !!layoutSize &&
    layoutSize.width >= chatColumnPx + (PANEL_GAP_REM + PROFILE_PANEL_MIN_REM) * rootFontPx

  // Check ban status for messaging restrictions
  const allUsersBanned = members.length > 0 && members.every((member) => member.isBannedFromPosting)

  const {topVisibleRef, showMessages, innerDiv, outerDiv} = usePaginatedScrollingMessages(
    messages,
    user?.id,
    loadMoreMessages,
  )

  // When the keyboard opens the list shrinks by the keyboard height; re-anchor to the bottom so the
  // messages the user was reading stay on screen instead of sliding under the composer.
  usePreserveScrollFromBottom(outerDiv)

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  // console.log('editingMessage', editingMessage)

  // A first message sent from a profile, still being checked by the API (or just refused). Drawn
  // below the stored messages until the API answers — see `web/lib/pending-openers.ts`.
  const pendingOpener = usePendingOpener(channelId)
  useEffect(() => {
    if (pendingOpener?.status !== 'sent') return
    // Accepted: the stored message replaces the pending bubble once it is fetched.
    fetchMessages().then(() => clearPendingOpener(channelId))
  }, [pendingOpener?.status, channelId])

  const editor = useTextEditor({
    key: `private-message-${channelId}-${user.id}`,
    size: 'sm',
    uploadFolder: 'messages',
    placeholder: t('messages.input_placeholder', 'Send a message'),
    // 16px to match the sent bubble (chat-message.tsx), and because iOS Safari zooms into any
    // focused field under 16px. `sm` is kept for its tighter spacing.
    className: '!text-[1rem]',
  })

  useEffect(() => {
    if (!editor) return
    if (editingMessage) {
      editor.commands.setContent(editingMessage.content)
      editor.commands.focus('end')
    }
  }, [editor, editingMessage])

  const typingUserIds = useTypingIndicator({
    channelId,
    userId: user.id,
    editor,
    messages,
    sendEnabled: !editingMessage,
  })
  const typingNames = filterDefined(
    typingUserIds.map((id) => otherUsers?.find((u) => u.id === id)?.name),
  ).map(getFirstName)

  // The dots join the bottom of the transcript; if the reader was already at the bottom, follow them
  // in, the way a new message is followed. Someone reading history further up is left where they are.
  const isTyping = typingNames.length > 0
  useEffect(() => {
    const el = outerDiv.current
    if (!isTyping || !el) return
    const TYPING_BUBBLE_ALLOWANCE_PX = 80
    if (el.scrollHeight - el.clientHeight - el.scrollTop <= TYPING_BUBBLE_ALLOWANCE_PX) {
      el.scrollTo({top: el.scrollHeight, behavior: 'smooth'})
    }
  }, [isTyping])

  useEffect(() => {
    if (editor && !isMobile) {
      editor.commands.focus()
    }
  }, [editor])

  // Only mark the chat as read while it is actually on screen: messages that arrive in a background
  // tab stay unread (and show in the tab title) until the user comes back to it.
  const isPageVisible = useIsPageVisible()
  useEffect(() => {
    if (isPageVisible) setAsSeen(channelId)
  }, [JSON.stringify(messages), isPageVisible])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // console.log('messages in privatechat', messages[0]?.reactions)
  const groupedMessages = useGroupedMessages(messages)

  // console.log('groupedMessages', groupedMessages)

  const submitMessage = useCallback(
    async (_type?: 'comment' | 'repost') => {
      if (!user) {
        track('sign in to comment')
        return await promptSignIn()
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
        // Refused by the model review: shown the same way as when the opener was sent from a
        // profile — the message in a refused bubble with the reason, "Edit and try again", and the
        // note that the check is new and can be contested (`OpenerReviewNote`).
        if (!editingMessage && isOpenerReviewRejection(e)) {
          setPendingOpener(channelId, {
            content: cleanDoc(editor.getJSON()),
            status: 'rejected',
            reason: (e as Error).message,
            reviewed: true,
          })
          editor.commands.clearContent(true)
          return
        }
        // A refused first message carries its reason — too short, nothing in it about the person,
        // or the account was just put on hold for a copy-pasted opener — and that reason is the
        // one thing the sender needs to read. Everything else gets the generic line.
        const explained = isFirstMessageRejectedError(e) || isAutoBanUnderReviewError(e)
        toast.error(
          explained
            ? (e as Error).message
            : editingMessage
              ? t('messages.toast.edit_failed', "Couldn't edit message.")
              : t(
                  'messages.toast.send_failed',
                  "Couldn't send message. Please try again later or contact support if the problem persists.",
                ),
          explained ? {duration: 12000} : undefined,
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
    // Sized to the visual viewport (see useVisualViewportHeight) so the keyboard can't push the header
    // off-screen: the header and composer are fixed rows, only the message list scrolls. `--vvo` is
    // added back because this page's document is locked, so the browser reveals the caret by panning
    // the visual viewport — without it the page stops that many px short of the keyboard.
    <div
      ref={layoutRef}
      className={clsx('w-full', showProfilePanel && 'grid gap-4')}
      style={
        showProfilePanel
          ? {gridTemplateColumns: `${Math.round(chatColumnPx)}px minmax(0, 1fr)`}
          : undefined
      }
    >
      {chatTitle && (
        <SEO
          title={`${chatTitle} | ${t('messages.title', 'Messages')}`}
          description={t('messages.seo.description', 'Messages')}
          url={`/messages/${channelId}`}
        />
      )}
      <Col className="w-full overflow-hidden h-[calc(var(--vvh,100dvh)+var(--vvo,0px)-var(--hloss)-var(--bnv))] lg:h-[calc(100dvh-var(--hloss)-0.5rem)]">
        <Row
          className={
            'bg-canvas-0 border border-canvas-200 h-14 shrink-0 items-center gap-2 rounded-xl px-2'
          }
        >
          <BackButton className="self-stretch mr-2" />
          {/* With the profile panel open beside the chat, the avatar and name here only repeat it. */}
          {showProfilePanel ? null : members && members.length > 0 ? (
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
          {showProfilePanel ? null : members && members.length > 0 ? (
            (() => {
              // Members here can include someone who left the chat — they're still a real person with a
              // real profile, so they're shown like any other member.
              const nameClassName =
                'ml-1 cursor-pointer hover:text-primary-700 transition-colors font-medium text-sm text-ink-900'
              const nameContent = (
                <>
                  {members
                    .map((user) =>
                      user.name
                        ? getFirstName(user.name)
                        : t('messages.deleted_user', 'Deleted user'),
                    )
                    .slice(0, 2)
                    .join(', ')}
                  {members.length > 2 && ` & ${members.length - 2} more`}
                </>
              )
              // A real anchor for the 1-on-1 case so the browser context menu offers
              // "Copy link address" / "Open in new tab" instead of doing nothing.
              return members.length === 1 && members[0].username ? (
                <Link href={`/${members[0].username}`} className={nameClassName}>
                  {nameContent}
                </Link>
              ) : (
                <span className={nameClassName} onClick={() => setShowUsers(true)}>
                  {nameContent}
                </span>
              )
            })()
          ) : otherUsers === undefined ? null : (
            <span className={'ml-1 italic text-ink-500 text-sm'}>
              {t('messages.deleted_user', 'Deleted user')}
            </span>
          )}

          {/* Whoever is in the room, named on the header or not — see the same call in the messages
            list. Sits outside the name link so a tap on it can't navigate away. Hidden with the name
            when the profile panel is open: a badge with no name next to it reads as noise. */}
          {!showProfilePanel && members.some((member) => isAdminUserId(member.id)) && (
            <AdminBadge className="ml-1.5" />
          )}
          {!showProfilePanel && members?.length == 1 && members[0].isBannedFromPosting && (
            <BannedBadge />
          )}
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
              // Blocking is a call about one person, so it's only offered where there's exactly one
              // other member. Same action as the profile page's more-options modal; the thread
              // stays readable afterwards, only the composer goes (see `blockedInChannel`).
              members.length === 1 && {
                icon: <FaUserSlash className="h-5 w-5" />,
                name: isBlocked(privateUser, members[0].id)
                  ? `${t('block_user.unblock', 'Unblock')} ${getFirstName(members[0].name)}`
                  : `${t('block_user.block', 'Block')} ${getFirstName(members[0].name)}`,
                onClick: async () => {
                  if (isBlocked(privateUser, members[0].id)) await unblockUser(members[0].id, t)
                  else await blockUser(members[0].id, t)
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
              {
                icon: <FaRegCopy className="h-5 w-5" />,
                name: t('messages.menu.copy_plain_text', 'Copy as plain text'),
                onClick: () => {
                  const text = messagesToPlainText(messages, user, otherUsers, t)
                  if (!text) {
                    toast.error(t('messages.toast.copy_empty', 'No messages to copy'))
                    return
                  }
                  copyToClipboard(text)
                  toast.success(t('messages.toast.copy_success', 'Conversation copied'))
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
        <Col className="relative min-h-0 flex-1 xl:px-0">
          {/* overscroll-contain: at the top of the feed, further upward scrolling stays here instead of
            chaining to the document and dragging the header/composer with it. */}
          <div
            ref={outerDiv}
            className="relative h-full overflow-y-auto overscroll-contain"
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
              {pendingOpener && pendingOpener.status !== 'sent' && messages && (
                <PendingOpenerBubble
                  pending={pendingOpener}
                  onEdit={() => {
                    editor?.commands.setContent(pendingOpener.content)
                    editor?.commands.focus('end')
                    clearPendingOpener(channelId)
                  }}
                />
              )}
              {typingNames.length > 0 && <TypingIndicator names={typingNames} />}
              {messages && messages.length === 0 && !pendingOpener && (
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
        {/* relative z-10: the composer is a static box, so the positioned message bubbles above it would
          otherwise paint over its border / focus ring as they scroll past. */}
        <div className="relative z-10 shrink-0">
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
            <AccountOnHoldNotice reason={user.banReason} className="m-2" compact />
          ) : blockedInChannel ? (
            <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 text-center m-2">
              <span className="text-ink-500 text-sm">
                {t(
                  'messages.cannot_message_blocked',
                  "This conversation is blocked, so you can't reply. You can still read it and report it.",
                )}
              </span>
            </div>
          ) : noOtherUser ? (
            <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 text-center m-2">
              <span className="text-ink-500 text-sm">
                {leftMembers.length > 0
                  ? leftMembers.length === 1
                    ? t(
                        'messages.cannot_message_left',
                        "{name} left the chat, so you can't reply.",
                        {
                          name: getFirstName(leftMembers[0].name),
                        },
                      )
                    : t(
                        'messages.cannot_message_all_left',
                        "Everyone else left the chat, so you can't reply.",
                      )
                  : t(
                      'messages.cannot_message_deleted',
                      "You can't text them as they deleted their account.",
                    )}
              </span>
            </div>
          ) : (
            <>
              {/* Only at the start of a conversation, and only until it is dismissed once: the two
                things this says (stay on the platform, never send money) are worth saying before the
                first reply, and worth nothing on the four-hundredth. */}
              {(messages?.length ?? 0) <= 3 && <ConversationSafetyTip className="mx-2 mb-2" />}
              <CommentInputTextArea
                editor={editor}
                // Cap the composer at 40% of the *visible* viewport (the default max-h-[60vh] tracks the
                // layout viewport, so with the keyboard up a long draft swallowed the whole feed).
                maxHeight="max-h-[calc(var(--vvh)*0.4)]"
                // A drag started in the composer stays in it rather than scrolling the transcript
                // behind it.
                overscrollContain
                user={user}
                submit={submitMessage}
                isSubmitting={isSubmitting}
                // Same as mobile: enter starts a new paragraph, sending goes through the send button
                // (or ctrl/cmd+enter), so a multi-paragraph message never gets fired off half-written.
                submitOnEnter={false}
                replyTo={replyToUserInfo}
                isEditing={!!editingMessage}
                cancelEditing={cancelEditing}
              />
            </>
          )}
        </div>
      </Col>
      {showProfilePanel && (
        <ChatProfilePanel
          member={members[0]}
          loading={otherUsers === undefined}
          className="lg:h-[calc(100dvh-var(--hloss)-0.5rem)]"
        />
      )}
    </div>
  )
}

// Widths for the wide-screen profile panel, in rem so they follow zoom and font settings. The chat
// column is an 80-character bubble (~40rem of 16px text plus padding), the "…"/timestamp column
// beside it, and a ~3rem gutter so their messages stop short of the edge. That is the minimum: the
// column also grows until sidebar plus chat cover half the window (see chatColumnPx).
const CHAT_COLUMN_REM = 47
const PANEL_GAP_REM = 1
const PROFILE_PANEL_MIN_REM = 20

const setAsSeen = async (channelId: number) => {
  return api('set-channel-seen-time', {channelId})
}
