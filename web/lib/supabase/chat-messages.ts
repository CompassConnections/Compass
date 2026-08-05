import {ChatMessage} from 'common/chat-message'
import {debug} from 'common/logger'
import {richTextToString} from 'common/util/parse'
import {HOUR_MS, MINUTE_MS} from 'common/util/time'
import {forEach, last, uniq} from 'lodash'
import {Dispatch, SetStateAction, useEffect, useMemo, useRef, useState} from 'react'
import {useIsVisible} from 'web/hooks/use-is-visible'

// export const getMessagesKey = (messages: ChatMessage[] | undefined) => {
//   return messages
//     ?.map(m => `${m.id}:${JSON.stringify(m.content)}:${JSON.stringify(m.reactions)}:${JSON.stringify(m.isEdited)}`)
//     .join('|')
// }

export function updateReactionUI(
  message: any,
  user: any,
  reaction: string,
  setMessages?: Dispatch<SetStateAction<ChatMessage[] | undefined>>,
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
              [reaction]: toDelete
                ? m.reactions?.[reaction]?.filter((id: string) => id !== user.id) || []
                : uniq([...(m.reactions?.[reaction] || []), user.id]),
            },
          }
        : m,
    ),
  )
}

// How close to the bottom still counts as "at the bottom" (sub-pixel layout, rounding).
const BOTTOM_TOLERANCE_PX = 2

export const usePaginatedScrollingMessages = (
  messages: ChatMessage[] | undefined,
  userId: string | undefined,
  loadMore?: (oldestMessageId: number) => void,
) => {
  messages = messages ?? []
  const initialScroll = useRef(messages === undefined)
  const outerDiv = useRef<HTMLDivElement | null>(null)
  const innerDiv = useRef<HTMLDivElement | null>(null)
  const scrollToOldTop = useRef(false)
  const isLoadingMore = useRef(false)
  // A scroll-to-bottom we asked for that hasn't landed yet. Smooth scrolling takes a few hundred ms,
  // and `scrollTop` reads from the middle of that animation look exactly like "the user scrolled up".
  // That's the case when a channel is restored from localStorage: the cached messages trigger a smooth
  // scroll, then the fetched ones arrive mid-animation and we'd wrongly decide not to follow them.
  const pendingScrollToBottom = useRef(false)
  const [prevInnerDivHeight, setPrevInnerDivHeight] = useState<number>()
  const expectedLengthAfterLoad = useRef<number>(0)
  const {ref: topVisibleRef} = useIsVisible(() => {
    if (loadMore && messages && messages.length > 0 && !isLoadingMore.current) {
      isLoadingMore.current = true
      loadMore(messages[messages.length - 1].id)
    }
    scrollToOldTop.current = true
    expectedLengthAfterLoad.current = messages.length + 5
  })

  const [showMessages, setShowMessages] = useState(false)
  useEffect(() => {
    isLoadingMore.current = false
  }, [messages?.length])

  // Resolve `pendingScrollToBottom`: either the scroll reached the bottom, or the user took over.
  useEffect(() => {
    const el = outerDiv.current
    if (!el) return

    const onScroll = () => {
      if (!pendingScrollToBottom.current) return
      if (el.scrollHeight - el.clientHeight - el.scrollTop <= BOTTOM_TOLERANCE_PX) {
        pendingScrollToBottom.current = false
      }
    }
    // A user gesture cancels the browser's smooth scroll, so it must cancel our intent too — otherwise
    // scrolling up to read history would get yanked back down by the next message.
    const onUserScroll = () => {
      pendingScrollToBottom.current = false
    }

    el.addEventListener('scroll', onScroll, {passive: true})
    el.addEventListener('wheel', onUserScroll, {passive: true})
    el.addEventListener('touchmove', onUserScroll, {passive: true})
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onUserScroll)
      el.removeEventListener('touchmove', onUserScroll)
    }
  }, [])

  useEffect(() => {
    const outerDivHeight = outerDiv?.current?.clientHeight ?? 0
    const innerDivHeight = innerDiv?.current?.clientHeight ?? 0
    const outerDivScrollTop = outerDiv?.current?.scrollTop ?? 0
    const difference = prevInnerDivHeight
      ? prevInnerDivHeight - outerDivHeight - outerDivScrollTop
      : 0
    // `difference` is derived from a scrollTop that may belong to a smooth scroll still in flight, so a
    // scroll-to-bottom we already asked for counts as being at the bottom.
    const isScrolledToBottom = difference <= 0 || pendingScrollToBottom.current

    const scrollToBottom = (behavior: ScrollBehavior) => {
      pendingScrollToBottom.current = true
      outerDiv?.current?.scrollTo({
        top: innerDivHeight! - outerDivHeight!,
        left: 0,
        behavior,
      })
    }

    if (scrollToOldTop.current && messages?.length > expectedLengthAfterLoad.current) {
      debug('Loaded more messages, holding position')
      // Loaded more messages, scroll to old top position
      const height = innerDivHeight! - prevInnerDivHeight!
      pendingScrollToBottom.current = false
      outerDiv?.current?.scrollTo({
        top: height,
        left: 0,
        behavior: 'auto',
      })
      scrollToOldTop.current = false
    } else if (!prevInnerDivHeight || isScrolledToBottom || initialScroll.current) {
      if (messages) {
        debug('Scenario 2')
        scrollToBottom(prevInnerDivHeight ? 'smooth' : 'auto')
        setShowMessages(true)
        initialScroll.current = false
      }
    } else if (messages[0]?.createdTime > Date.now() - 5000) {
      debug('Sent message')
      // Sent a message, scroll to bottom
      scrollToBottom('smooth')
    }

    setPrevInnerDivHeight(innerDivHeight)
  }, [messages])
  return {topVisibleRef, showMessages, outerDiv, innerDiv}
}

export const useGroupedMessages = (messages: ChatMessage[] | undefined) => {
  return useMemo(() => {
    if (!messages) return

    // Group messages created within a short time of each other.
    const tempGrouped: ChatMessage[][] = []
    let systemStatusGroup: ChatMessage[] = []

    messages = messages ?? []
    messages = messages.slice().reverse()

    forEach(messages, (message, i) => {
      const isSystemStatus = message.visibility === 'system_status'
      const systemType = systemStatusType(message)
      if (isSystemStatus && systemType === 'left') return

      if (i === 0) {
        if (isSystemStatus) systemStatusGroup.push(message)
        else tempGrouped.push([message])
      } else {
        if (!messages) return
        const prevMessage = messages[i - 1]
        const timeDifference = Math.abs(message.createdTime - prevMessage.createdTime)
        const creatorsMatch = message.userId === prevMessage.userId
        const isMatchingPrevSystemStatus =
          prevMessage.visibility === 'system_status' && systemStatusType(prevMessage) === systemType

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
        } else if (timeDifference < 2 * MINUTE_MS && creatorsMatch && !isMatchingPrevSystemStatus) {
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
