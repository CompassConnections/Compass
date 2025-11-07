import {ChatMessage, PrivateChatMessage} from 'common/chat-message'
import {Dispatch, SetStateAction, useEffect, useMemo, useRef, useState} from 'react'
import {useIsVisible} from 'web/hooks/use-is-visible'
import {forEach, last, uniq} from 'lodash'
import {HOUR_MS, MINUTE_MS} from 'common/util/time'
import {richTextToString} from 'common/util/parse'

// export const getMessagesKey = (messages: ChatMessage[] | undefined) => {
//   return messages
//     ?.map(m => `${m.id}:${JSON.stringify(m.content)}:${JSON.stringify(m.reactions)}:${JSON.stringify(m.isEdited)}`)
//     .join('|')
// }

export function updateReactionUI(
  message: any,
  user: any,
  reaction: string,
  setMessages?: Dispatch<SetStateAction<PrivateChatMessage[] | undefined>>,
  toDelete?: boolean,
) {
  if (!user) return
  if (!setMessages) return
  setMessages?.((prevMessages) =>
    prevMessages?.map((m) =>
      m.id === message.id && user?.id
        ? {
          ...m,
          reactions: {
            ...m.reactions,
            [reaction]: toDelete ?
              m.reactions?.[reaction]?.filter((id: string) => id !== user.id) || []
              : uniq([
                ...(m.reactions?.[reaction] || []),
                user.id
              ])
          }
        }
        : m
    ))
}

export const usePaginatedScrollingMessages = (
  realtimeMessages: ChatMessage[] | undefined,
  heightFromTop: number,
  userId: string | undefined
) => {
  const messagesPerPage = 50
  const initialScroll = useRef(realtimeMessages === undefined)
  const outerDiv = useRef<HTMLDivElement | null>(null)
  const innerDiv = useRef<HTMLDivElement | null>(null)
  const scrollToOldTop = useRef(false)
  const [page, setPage] = useState(1)
  const [prevInnerDivHeight, setPrevInnerDivHeight] = useState<number>()
  const {ref: topVisibleRef} = useIsVisible(() => {
    scrollToOldTop.current = true
    setPage(page + 1)
  })

  const [showMessages, setShowMessages] = useState(false)
  const messages = useMemo(
    () => (realtimeMessages ?? []).slice(0, messagesPerPage * page).reverse(),
    [JSON.stringify(realtimeMessages), page]
  )
  useEffect(() => {
    const outerDivHeight = outerDiv?.current?.clientHeight ?? 0
    const innerDivHeight = innerDiv?.current?.clientHeight ?? 0
    const outerDivScrollTop = outerDiv?.current?.scrollTop ?? 0
    // For the private messages page a tolerance of 0 suffices, but for some reason the tv page requires a tolerance of 43
    const tolerance = 43
    const difference = prevInnerDivHeight
      ? prevInnerDivHeight - outerDivHeight - outerDivScrollTop
      : 0
    const isScrolledToBottom = difference <= tolerance
    if (
      (!prevInnerDivHeight || isScrolledToBottom || initialScroll.current) &&
      realtimeMessages
    ) {
      outerDiv?.current?.scrollTo({
        top: innerDivHeight! - outerDivHeight!,
        left: 0,
        behavior: prevInnerDivHeight ? 'smooth' : 'auto',
      })
      setShowMessages(true)
      initialScroll.current = false
    } else if (scrollToOldTop.current) {
      // Loaded more messages, scroll to old top
      const height = innerDivHeight! - prevInnerDivHeight! + heightFromTop
      outerDiv?.current?.scrollTo({
        top: height,
        left: 0,
        behavior: 'auto',
      })
      scrollToOldTop.current = false
    } else if (last(messages)?.userId === userId) {
      // Sent a message, scroll to bottom
      outerDiv?.current?.scrollTo({
        top: innerDivHeight! - outerDivHeight!,
        left: 0,
        behavior: 'smooth',
      })
    }

    setPrevInnerDivHeight(innerDivHeight)
  }, [messages])
  return {topVisibleRef, showMessages, messages, outerDiv, innerDiv}
}

export const useGroupedMessages = (messages: ChatMessage[]) => {
  // Create a string key that changes when any message's content or reactions change
  console.log('messages in useGroupedMessages', messages[0]?.reactions)

  return useMemo(() => {
    // Group messages created within a short time of each other.
    const tempGrouped: ChatMessage[][] = []
    let systemStatusGroup: ChatMessage[] = []

    forEach(messages, (message, i) => {
      const isSystemStatus = message.visibility === 'system_status'
      const systemType = systemStatusType(message)
      if (isSystemStatus && systemType === 'left') return

      if (i === 0) {
        if (isSystemStatus) systemStatusGroup.push(message)
        else tempGrouped.push([message])
      } else {
        const prevMessage = messages[i - 1]
        const timeDifference = Math.abs(
          message.createdTime - prevMessage.createdTime
        )
        const creatorsMatch = message.userId === prevMessage.userId
        const isMatchingPrevSystemStatus =
          prevMessage.visibility === 'system_status' &&
          systemStatusType(prevMessage) === systemType

        if (isSystemStatus) {
          // Check if the current message should be grouped with the previous system_status message(s)
          if (isMatchingPrevSystemStatus && timeDifference < 4 * HOUR_MS) {
            systemStatusGroup.push(message)
          } else {
            if (systemStatusGroup.length > 0) {
              tempGrouped.push([...systemStatusGroup])
              systemStatusGroup = []
            }
            systemStatusGroup.push(message)
          }
        } else if (
          timeDifference < 2 * MINUTE_MS &&
          creatorsMatch &&
          !isMatchingPrevSystemStatus
        ) {
          last(tempGrouped)?.push(message)
        } else {
          if (systemStatusGroup.length > 0) {
            tempGrouped.push([...systemStatusGroup])
            systemStatusGroup = []
          }
          tempGrouped.push([message])
        }
      }
    })

    if (systemStatusGroup.length > 0) tempGrouped.push(systemStatusGroup)

    return tempGrouped
  }, [JSON.stringify(messages)])
}
const systemStatusType = (message: ChatMessage) => {
  const chatContent = richTextToString(message.content)
  return chatContent.includes('left the chat')
    ? 'left'
    : chatContent.includes('joined the chat')
      ? 'joined'
      : 'other'
}
