import {ChatMessage} from 'common/chat-message'
import {useEffect} from 'react'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {api} from 'web/lib/api'

export function useLastPrivateMessages(
  userId: string | undefined,
  channelIds?: number[] | undefined,
): Record<number, ChatMessage> {
  const key = `last-messages-${userId}`
  const [lastMessages, setLastMessages] = usePersistentLocalState<Record<number, ChatMessage>>(
    {},
    key,
  )

  useEffect(() => {
    if (!userId) {
      setLastMessages({})
      return
    }

    const fetchLastMessages = async () => {
      const messages = await api('get-last-messages', {channelIds})
      setLastMessages(messages)
    }

    fetchLastMessages()
  }, [userId, channelIds?.join(',')])

  return lastMessages
}
