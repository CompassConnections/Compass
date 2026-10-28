import {Editor} from '@tiptap/react'
import {ChatMessage} from 'common/chat-message'
import {useEffect, useRef, useState} from 'react'
import {useApiSubscription} from 'web/hooks/use-api-subscription'
import {api} from 'web/lib/api'

// While someone types, their composer pings at most this often...
const TYPING_PING_INTERVAL_MS = 3000
// ...and the other side keeps showing the indicator this long after the last ping. A bit more than
// one interval so a ping arriving late doesn't make the dots flicker off and on.
const TYPING_EXPIRY_MS = 5000

/**
 * The WhatsApp-style "… is typing" indicator for a private chat. Sends pings while `editor` is being
 * typed into, and returns the ids of the other members currently typing in `channelId`.
 *
 * `sendEnabled` is off while editing an already-sent message: that isn't a new message on its way.
 */
export function useTypingIndicator(props: {
  channelId: number
  userId: string
  editor: Editor | null
  messages: ChatMessage[] | undefined
  sendEnabled: boolean
}) {
  const {channelId, userId, editor, messages, sendEnabled} = props

  // Sending
  const lastPingRef = useRef(0)
  useEffect(() => {
    if (!editor || !sendEnabled) return
    const onUpdate = ({transaction}: {transaction: {docChanged: boolean}}) => {
      // Clearing the composer after a send is also an update; only text being added counts.
      if (!transaction.docChanged || editor.isEmpty) return
      const now = Date.now()
      if (now - lastPingRef.current < TYPING_PING_INTERVAL_MS) return
      lastPingRef.current = now
      api('set-channel-typing', {channelId}).catch(() => {
        // Best effort: a missed ping only means the dots don't show.
      })
    }
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor, channelId, sendEnabled])

  // A sent message ends that bout of typing, so the next keystroke announces itself straight away.
  const newestMessageId = messages?.[0]?.id
  useEffect(() => {
    lastPingRef.current = 0
  }, [newestMessageId])

  // Receiving: user id -> when their indicator lapses.
  const [typingUntil, setTypingUntil] = useState<Record<string, number>>({})

  // The subscription keeps the handler it was first given, so the channel is read through a ref.
  const channelIdRef = useRef(channelId)
  channelIdRef.current = channelId

  useApiSubscription({
    topics: [`private-user-messages/${userId}/typing`],
    onBroadcast: ({data}) => {
      if (data.channelId !== channelIdRef.current || typeof data.userId !== 'string') return
      const typingUserId = data.userId
      setTypingUntil((prev) => ({...prev, [typingUserId]: Date.now() + TYPING_EXPIRY_MS}))
    },
  })

  // Their message arrived: they're done typing it.
  const newestMessage = messages?.[0]
  useEffect(() => {
    if (!newestMessage) return
    setTypingUntil((prev) => {
      if (!(newestMessage.userId in prev)) return prev
      const {[newestMessage.userId]: _, ...rest} = prev
      return rest
    })
  }, [newestMessage?.id])

  // Drop whoever has gone quiet.
  useEffect(() => {
    const deadlines = Object.values(typingUntil)
    if (!deadlines.length) return
    const next = Math.min(...deadlines)
    const timeout = setTimeout(
      () => {
        const now = Date.now()
        setTypingUntil((prev) =>
          Object.fromEntries(Object.entries(prev).filter(([, until]) => until > now)),
        )
      },
      Math.max(0, next - Date.now()),
    )
    return () => clearTimeout(timeout)
  }, [typingUntil])

  // Switching chats starts with nobody typing.
  useEffect(() => {
    setTypingUntil({})
  }, [channelId])

  return Object.keys(typingUntil)
}
