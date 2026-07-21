import clsx from 'clsx'
import {ChatMessage} from 'common/chat-message'
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {User} from 'common/user'
import {parseJsonContentToText} from 'common/util/parse'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {EmailVerificationPrompt} from 'web/components/messaging/email-verification-prompt'
import NewMessageButton from 'web/components/messaging/new-message-button'
import {MultipleOrSingleAvatars} from 'web/components/multiple-or-single-avatars'
import {PageBase} from 'web/components/page-base'
import {RelativeTimestamp} from 'web/components/relative-timestamp'
import {SEO} from 'web/components/SEO'
import {Avatar} from 'web/components/widgets/avatar'
import {BannedBadge} from 'web/components/widgets/user-link'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import {useLastPrivateMessages} from 'web/hooks/use-last-private-messages'
import {
  useSortedPrivateMessageMemberships,
  useUnseenPrivateMessageChannels,
} from 'web/hooks/use-private-messages'
import {useRedirectIfSignedOut} from 'web/hooks/use-redirect-if-signed-out'
import {useUser} from 'web/hooks/use-user'
import {useUsersInStore} from 'web/hooks/use-user-supabase'
import {useT} from 'web/lib/locale'

export default function MessagesPage() {
  useRedirectIfSignedOut()

  const currentUser = useUser()
  const firebaseUser = useFirebaseUser()
  const t = useT()
  return (
    <PageBase trackPageView={'messages page'} className={'py-2 px-2 xl:!px-6'}>
      <SEO
        title={t('messages.title', 'Messages')}
        description={t('messages.seo.description', 'Your Messages')}
        url={`/messages`}
      />
      {currentUser &&
        firebaseUser &&
        (firebaseUser?.emailVerified ? (
          <MessagesContent currentUser={currentUser} />
        ) : (
          <EmailVerificationPrompt t={t} />
        ))}
    </PageBase>
  )
}

export function MessagesContent(props: {currentUser: User}) {
  const {currentUser} = props
  const t = useT()
  const {channels, memberIdsByChannelId} = useSortedPrivateMessageMemberships(currentUser.id)
  const {lastSeenChatTimeByChannelId} = useUnseenPrivateMessageChannels(true)
  const lastMessages = useLastPrivateMessages(currentUser.id)

  return (
    <>
      <Row className="justify-between items-center mb-4">
        <h1 className="font-heading text-4xl font-medium text-ink-900">
          {t('messages.title', 'Messages')}
        </h1>
        <NewMessageButton />
      </Row>
      <Col className={'w-full overflow-hidden gap-2'} data-testid="messages-table">
        {channels && channels.length === 0 && (
          <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-8 text-center mt-4">
            <p className="text-ink-500 text-sm mb-1">
              {t('messages.empty', 'You have no messages, yet.')}
            </p>
            <p className="text-ink-300 text-xs">
              {t(
                'messages.empty_hint',
                'Start a conversation with someone who resonates with you.',
              )}
            </p>
          </div>
        )}
        {channels?.map((channel) => {
          const userIds = memberIdsByChannelId?.[channel.channel_id]?.map((m) => m) || []
          return (
            <MessageChannelRow
              key={channel.channel_id}
              otherUserIds={userIds}
              currentUser={currentUser}
              channel={channel}
              lastSeenTime={lastSeenChatTimeByChannelId[channel.channel_id]}
              lastMessage={lastMessages[channel.channel_id]}
            />
          )
        })}
      </Col>
    </>
  )
}

export const MessageChannelRow = (props: {
  otherUserIds: string[]
  currentUser: User
  channel: PrivateMessageChannel
  lastSeenTime: Date | undefined
  lastMessage?: ChatMessage
}) => {
  const {otherUserIds, lastSeenTime, currentUser, channel, lastMessage} = props
  const channelId = channel.channel_id
  const otherUsers = useUsersInStore(otherUserIds, `${channelId}`, 100)
  const unseen = lastSeenTime ? new Date(lastMessage?.createdTime ?? 0) > lastSeenTime : false
  const numOthers = otherUsers?.length ?? 0
  const t = useT()

  const isBanned = otherUsers?.length == 1 && otherUsers[0].isBannedFromPosting
  return (
    <Row
      className={
        'items-center gap-3 bg-canvas-50 border border-canvas-200 rounded-xl p-3 transition-all hover:border-primary-300 hover:shadow-sm hover:bg-canvas-100'
      }
      data-testid="messages-row"
    >
      {otherUsers && otherUsers.length > 0 ? (
        <MultipleOrSingleAvatars
          size="md"
          spacing={numOthers === 2 ? 0.3 : 0.15}
          startLeft={numOthers === 2 ? 2.2 : 1.2}
          avatars={otherUsers}
          className={numOthers > 1 ? '-ml-2' : ''}
        />
      ) : (
        <Avatar size="md" username="?" noLink />
      )}
      <Link className="w-full group" key={channelId} href={'/messages/' + channelId}>
        <Col className={'gap-1'}>
          <Row className={'items-center justify-between'}>
            <span
              className={
                'font-medium text-ink-900 text-sm group-hover:text-primary-600 transition-colors'
              }
              data-testid="messages-username"
            >
              {otherUsers && otherUsers.length > 0 ? (
                <span>
                  {otherUsers
                    .map((user) =>
                      user.name
                        ? user.name.split(' ')[0].trim()
                        : t('messages.deleted_user', 'Deleted user'),
                    )
                    .slice(0, 2)
                    .join(', ')}
                  {otherUsers.length > 2 && (
                    <>
                      {` & ${otherUsers.length - 2}`}
                      {t('messages.more', ' more')}
                    </>
                  )}
                </span>
              ) : (
                otherUserIds.length == 0 && (
                  <span className="italic text-ink-500">
                    {t('messages.deleted_user', 'Deleted user')}
                  </span>
                )
              )}
              {isBanned && <BannedBadge />}
            </span>
            <span className={'text-ink-300 text-xs'} data-testid="messages-timestamp">
              {lastMessage && <RelativeTimestamp time={lastMessage.createdTime} />}
            </span>
          </Row>
          <Row className="items-center justify-between gap-1">
            <span
              className={clsx(
                'line-clamp-1 text-sm',
                unseen ? 'text-ink-900 font-medium' : 'text-ink-500',
              )}
            >
              {lastMessage && (
                <>
                  {lastMessage.userId == currentUser.id && (
                    <span className="text-ink-300">{t('messages.you_prefix', 'You: ')}</span>
                  )}
                  {parseJsonContentToText(lastMessage.content)}
                </>
              )}
            </span>
            {unseen && <div className="bg-primary-500 h-2.5 w-2.5 rounded-full shrink-0" />}
          </Row>
        </Col>
      </Link>
    </Row>
  )
}
