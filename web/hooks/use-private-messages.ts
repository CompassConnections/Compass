import {PrivateChatMessage} from 'common/chat-message'
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {millisToTs, tsToMillis} from 'common/supabase/utils'
import {orderBy, uniq, uniqBy} from 'lodash'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useApiSubscription} from 'web/hooks/use-api-subscription'
import {useIsPageVisible} from 'web/hooks/use-page-visible'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {api} from 'web/lib/api'
import {track} from 'web/lib/service/analytics'
import {getSortedChatMessageChannels, getTotalChatMessages} from 'web/lib/supabase/private-messages'

export function usePrivateMessages(channelId: number, limit: number, userId: string) {
  // console.debug('getWebsocketUrl', getWebsocketUrl())
  const key = `private-messages-${channelId}-${limit}-v1`
  const [messages, setMessages] = usePersistentLocalState<PrivateChatMessage[] | undefined>(
    undefined,
    key,
  )

  const fetchMessages = async (id?: number, beforeId?: number) => {
    const data = {
      channelId,
      limit,
      id,
      beforeId,
    }
    const newMessages = await api('get-channel-messages', data)
    // console.debug(key, {newMessages, messages, data})
    if (beforeId) {
      setMessages((prevMessages) =>
        orderBy(
          uniqBy([...(prevMessages ?? []), ...newMessages], (m) => m.id),
          'createdTime',
          'desc',
        ),
      )
    } else {
      setMessages((prevMessages) =>
        orderBy(
          uniqBy([...newMessages, ...(prevMessages && id ? prevMessages : [])], (m) => m.id),
          'createdTime',
          'desc',
        ),
      )
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [channelId, limit])

  useApiSubscription({
    topics: ['private-user-messages/' + userId],
    onBroadcast: () => {
      // console.debug('private-user-messages broadcast', channelId)
      fetchMessages()
    },
  })

  return {messages, fetchMessages, setMessages}
}

export const useUnseenPrivateMessageChannels = (userId: string, ignorePageSeenTime: boolean) => {
  const pathName = usePathname()
  const lastSeenMessagesPageTime = useLastSeenMessagesPageTime()
  const [lastSeenChatTimeByChannelId, setLastSeenChatTimeByChannelId] = useState<
    Record<number, string> | undefined
  >(undefined)

  const {data, refresh} = useAPIGetter(
    'get-channel-memberships',
    {
      lastUpdatedTime: ignorePageSeenTime
        ? new Date(0).toISOString()
        : millisToTs(lastSeenMessagesPageTime),
      limit: 100,
    },
    ['lastUpdatedTime'],
  )
  const {channels} = data ?? {
    channels: [] as PrivateMessageChannel[],
    memberIdsByChannelId: {},
  }

  useEffect(() => {
    refresh()
  }, [pathName])

  const fetchLastSeenTimesPerChannel = async (forChannelIds: number[]) => {
    if (!forChannelIds.length) return
    const seenTimes = await api('get-channel-seen-time', {
      channelIds: forChannelIds,
    })
    const newState = lastSeenChatTimeByChannelId ?? {}
    seenTimes.forEach(([channelId, time]) => {
      newState[channelId] = time
    })
    setLastSeenChatTimeByChannelId(newState)
  }

  useEffect(() => {
    const newMessageRows = channels
      .filter(
        (m) => ignorePageSeenTime || tsToMillis(m.last_updated_time) > lastSeenMessagesPageTime,
      )
      .map((m) => m.channel_id)
    if (newMessageRows?.length) fetchLastSeenTimesPerChannel(uniq(newMessageRows))
  }, [channels?.length])

  useEffect(() => {
    if (
      !lastSeenChatTimeByChannelId ||
      channels.some((c) => lastSeenChatTimeByChannelId[c.channel_id] === undefined)
    ) {
      fetchLastSeenTimesPerChannel(channels.map((c) => c.channel_id))
    }
  }, [channels?.length])

  if (!lastSeenChatTimeByChannelId) return {unseenChannels: [], lastSeenChatTimeByChannelId: {}}
  const unseenChannels = channels.filter((channel) => {
    const channelId = channel.channel_id
    const notifyAfterTime =
      channels?.find((m) => m.channel_id === channelId)?.notify_after_time ?? '0'

    const lastSeenTime = lastSeenChatTimeByChannelId[channelId] ?? 0
    const lastSeenChatTime = notifyAfterTime > lastSeenTime ? notifyAfterTime : (lastSeenTime ?? 0)
    return (
      channel.last_updated_time > lastSeenChatTime &&
      (ignorePageSeenTime || tsToMillis(channel.last_updated_time) > lastSeenMessagesPageTime) &&
      !pathName?.endsWith(`/messages/${channelId}`)
    )
  })
  return {unseenChannels, lastSeenChatTimeByChannelId}
}

const useLastSeenMessagesPageTime = () => {
  const pathname = usePathname()
  const isVisible = useIsPageVisible()

  const [lastSeenMessagesPageTime, setLastSeenMessagesPageTime] = usePersistentLocalState(
    0,
    'last-seen-private-messages-page',
  )
  const [unloadingPage, setUnloadingPage] = usePersistentInMemoryState(
    '',
    'unloading-page-private-messages-page',
  )
  useEffect(() => {
    if (pathname === '/messages' || unloadingPage === '/messages') {
      setLastSeenMessagesPageTime(Date.now())
      track('view messages page')
    }
    setUnloadingPage(pathname)
  }, [pathname, isVisible])

  return lastSeenMessagesPageTime
}

export type ChannelMembership = {
  channels: PrivateMessageChannel[]
  memberIdsByChannelId: {[key: string]: string[]}
}

export const useSortedPrivateMessageMemberships = (
  userId: string | undefined,
  limit: number = 100,
  forChannelId?: number,
) => {
  const [channelMemberships, setChannelMemberships] = usePersistentLocalState<
    ChannelMembership | undefined
  >(undefined, `private-message-memberships-${userId}-${forChannelId}-v1`)

  useEffect(() => {
    if (userId) getSortedChatMessageChannels(limit, forChannelId).then(setChannelMemberships)
  }, [userId, forChannelId])
  return (
    channelMemberships ?? {
      channels: undefined,
      memberIdsByChannelId: undefined,
    }
  )
}

export const useMessagesCount = (isAuthed: boolean | undefined, channelId: number) => {
  const [count, setCount] = usePersistentLocalState<number>(
    0,
    `private-message-count-channel-id-${channelId}`,
  )

  useEffect(() => {
    if (isAuthed) getTotalChatMessages(channelId).then((c) => setCount(c))
  }, [isAuthed])
  return count
}
