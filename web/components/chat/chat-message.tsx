import {Col} from 'web/components/layout/col'
import clsx from 'clsx'
import {Row} from 'web/components/layout/row'
import {Avatar} from 'web/components/widgets/avatar'
import {RelativeTimestamp} from 'web/components/relative-timestamp'
import {Content} from 'web/components/widgets/editor'
import {ChatMessage, PrivateChatMessage} from 'common/chat-message'
import {first, last} from 'lodash'
import {Dispatch, memo, SetStateAction, useRef, useState} from 'react'
import {MultipleOrSingleAvatars} from 'web/components/multiple-or-single-avatars'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {compassUserId} from 'common/profiles/constants'
import {DisplayUser} from 'common/api/user-types'
import {MessageActions} from "web/components/chat/message-actions"
import {MessageReactions} from "web/components/chat/message-reactions";

export function ChatMessageItem(props: {
  chats: ChatMessage[]
  currentUser: DisplayUser | undefined | null
  otherUser?: DisplayUser | null
  onReplyClick?: (chat: ChatMessage) => void
  beforeSameUser: boolean
  firstOfUser: boolean
  hideAvatar: boolean
  onRequestEdit?: (chat: ChatMessage) => void
  setMessages?: Dispatch<SetStateAction<PrivateChatMessage[] | undefined>>
}) {
  const {
    chats,
    onReplyClick,
    currentUser,
    otherUser,
    beforeSameUser,
    firstOfUser,
    hideAvatar,
    onRequestEdit,
    setMessages,
  } = props
  const chat = first(chats)

  const [emojiOpenForId, setEmojiOpenForId] = useState<number | null>(null)
  const [emojiKey, setEmojiKey] = useState(0)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!chat) return null

  // console.log('chat', chat)

  const isMe = currentUser?.id === chat.userId
  const {username, avatarUrl, id} =
    !isMe && otherUser
      ? otherUser
      : isMe && currentUser
        ? currentUser
        : {username: '', avatarUrl: undefined, id: ''}

  const startLongPress = (messageId: number) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(() => {
      setEmojiOpenForId(messageId)
      setEmojiKey((k) => k + 1)
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  return (
    <Row
      className={clsx(
        '@container items-end justify-start gap-1',
        isMe && 'flex-row-reverse',
        firstOfUser ? 'mt-2' : 'mt-1'
      )}
    >
      {!isMe && !hideAvatar && (
        <MessageAvatar
          beforeSameUser={beforeSameUser}
          username={username}
          userAvatarUrl={avatarUrl}
          userId={id}
        />
      )}
      <Col className="sm:max-w-[calc(100vw-6rem)] md:max-w-[70%]">
        <Col className="gap-1">
          {chats.map((chat) => (
            <div
              className={clsx(
                'group flex items-end gap-1',
                isMe && 'flex-row-reverse'
              )}
              key={chat.id}
            >
              <div className="group relative">
                <Row>
                  <div
                    className={clsx(
                      'rounded-3xl px-3 py-2',
                      chat.visibility !== 'system_status' && '',
                      chat.visibility === 'system_status'
                        ? 'bg-canvas-50 italic'
                        : isMe
                          ? 'bg-primary-100 items-end self-end rounded-r-none group-first:rounded-tr-3xl'
                          : 'bg-canvas-0 items-start self-start rounded-l-none group-first:rounded-tl-3xl'
                    )}
                    onMouseDown={() => startLongPress(chat.id)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => startLongPress(chat.id)}
                    onTouchEnd={cancelLongPress}
                    onTouchCancel={cancelLongPress}
                  >
                    <Content size={'sm'} content={chat.content} key={chat.id}/>
                  </div>
                </Row>
                {/* Hidden host for emoji picker, opened via long-press */}
                <div className="absolute right-0 top-0 -mt-2">
                  <MessageActions
                    message={{
                      id: chat.id,
                      userId: chat.userId,
                      content: chat.content,
                      isEdited: chat.isEdited,
                      reactions: chat.reactions,
                    }}
                    setMessages={setMessages}
                    hideTrigger
                    openEmojiPickerKey={emojiOpenForId === chat.id ? emojiKey : undefined}
                  />
                </div>
                <MessageReactions
                  message={{
                    id: chat.id,
                    reactions: chat.reactions as Record<string, string[]> | undefined,
                  }}
                  className={clsx(
                    'ml-2',
                    isMe ? 'justify-end' : 'justify-start'
                  )}
                  setMessages={setMessages}
                />
              </div>
              <Col
                className="mb-2 mr-1 text-xs"
              >
                {chat.visibility !== 'system_status' && (
                  <Row className={'items-center gap-3'}>
                    {/*{!isMe &&*/}
                    {/*    <Link*/}
                    {/*        href={'/' + username}*/}
                    {/*        className="text-ink-500 dark:text-ink-600 pl-3 text-sm"*/}
                    {/*    >*/}
                    {/*      {name}*/}
                    {/*    </Link>*/}
                    {/*}*/}
                    {onReplyClick && (
                      <div className="flex items-center gap-1">
                        {/*<button*/}
                        {/*  className="text-ink-400 hover:text-ink-600"*/}
                        {/*  onClick={() => onReplyClick?.(chat)}*/}
                        {/*>*/}
                        {/*  <ReplyIcon className="h-4 w-4"/>*/}
                        {/*</button>*/}
                        <MessageActions
                          message={{
                            id: chat.id,
                            userId: chat.userId,
                            content: chat.content,
                            isEdited: chat.isEdited,
                            reactions: chat.reactions,
                          }}
                          setMessages={setMessages}
                          onRequestEdit={() => onRequestEdit?.(chat)}
                          className="text-xs group-last:block"
                        />
                      </div>
                    )}
                  </Row>
                )}
                <RelativeTimestamp
                  time={chat.createdTime}
                  shortened
                  className="hidden text-xs group-last:block"
                />
              </Col>
            </div>
          ))}
        </Col>
      </Col>
      <div className={clsx(isMe ? 'pr-1' : '', 'pb-2')}></div>
    </Row>
  )
}

export const SystemChatMessageItem = memo(
  function SystemChatMessageItem(props: {
    chats: ChatMessage[]
    otherUsers: DisplayUser[] | undefined
  }) {
    const {chats, otherUsers} = props
    const chat = last(chats)
    const [showUsers, setShowUsers] = useState(false)
    if (!chat) return null
    const totalUsers = otherUsers?.length || 1
    const hideAvatar =
      chat.visibility === 'system_status' &&
      chat.userId === compassUserId &&
      chats.length === 1 ||
      totalUsers < 2
    return (
      <Row className={clsx('flex-row-reverse items-center gap-1')}>
        <Row className="grow"/>
        <Col className={clsx('grow-y justify-end pb-2')}>
          <RelativeTimestamp
            time={chat.createdTime}
            shortened
            className="text-xs"
          />
        </Col>
        <Col className="max-w-[calc(100vw-6rem)] md:max-w-[80%]">
          <Col className={clsx(' bg-canvas-50  px-1 py-2 text-sm italic')}>
            {totalUsers > 1 ? (
              <span>
                  {totalUsers} user{totalUsers > 1 ? 's' : ''} joined the chat!
                </span>
            ) : (
              <>
                <Content content={chat.content} size={'sm'}/>
                {chat.visibility !== 'system_status' && (
                  <div
                    className="invisible absolute right-0 top-0 -mt-2 flex translate-x-2 items-center opacity-0 transition-all group-hover:visible group-hover:translate-x-0 group-hover:opacity-100">
                    <MessageActions
                      message={{
                        id: chat.id,
                        userId: chat.userId,
                        content: chat.content,
                        isEdited: chat.isEdited,
                        reactions: chat.reactions,
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </Col>
        </Col>
        {!hideAvatar && (
          <MultipleOrSingleAvatars
            size={'xs'}
            spacing={0.3}
            startLeft={0.6}
            avatars={otherUsers || []}
            onClick={() => setShowUsers(true)}
          />
        )}
        {showUsers && (
          <MultiUserModal
            showUsers={showUsers}
            setShowUsers={setShowUsers}
            otherUsers={otherUsers ?? []}
          />
        )}
      </Row>
    )
  }
)
export const MultiUserModal = (props: {
  showUsers: boolean
  setShowUsers: (show: boolean) => void
  otherUsers: DisplayUser[]
}) => {
  const {showUsers, setShowUsers, otherUsers} = props
  return (
    <Modal open={showUsers} setOpen={setShowUsers}>
      <Col className={clsx(MODAL_CLASS)}>
        {otherUsers?.map((user) => (
          <Row
            key={user.id}
            className={'w-full items-center justify-start gap-2'}
          >
            <UserAvatarAndBadge user={user}/>
          </Row>
        ))}
      </Col>
    </Modal>
  )
}

function MessageAvatar(props: {
  beforeSameUser: boolean
  userAvatarUrl?: string
  username?: string
  userId: string
}) {
  const {beforeSameUser, userAvatarUrl, username} = props
  return (
    <Col
      className={clsx(
        beforeSameUser ? 'pointer-events-none invisible' : '',
        'grow-y justify-end pb-2 pr-1'
      )}
    >
      <Avatar avatarUrl={userAvatarUrl} username={username} size="xs"/>
    </Col>
  )
}
