import clsx from 'clsx'
import {PrivateChatMessage} from 'common/chat-message'
import {Dispatch, SetStateAction, useMemo} from 'react'
import {useUser} from 'web/hooks/use-user'
import {updateReactionUI} from 'web/lib/supabase/chat-messages'
import {handleReaction} from 'web/lib/util/message-reactions'

interface MessageReactionsProps {
  message: {
    id: number
    reactions?: Record<string, string[]>
  }
  className?: string
  setMessages?: Dispatch<SetStateAction<PrivateChatMessage[] | undefined>>
}

export function MessageReactions({message, className, setMessages}: MessageReactionsProps) {
  const user = useUser()
  const reactions = message.reactions || {}
  // console.log(reactions)

  const reactionGroups = useMemo(() => {
    const groups: {emoji: string; users: string[]}[] = []

    // Group reactions by emoji
    for (const [emoji, userIds] of Object.entries(reactions)) {
      if (userIds && userIds.length > 0) {
        groups.push({
          emoji,
          users: Array.isArray(userIds) ? userIds : [userIds as unknown as string],
        })
      }
    }

    return groups
  }, [reactions])

  if (reactionGroups.length === 0) return null

  return (
    <div className={clsx('mt-1 flex flex-wrap gap-1', className)}>
      {reactionGroups.map(({emoji, users}) => {
        const hasReacted = users.includes(user?.id || '')
        return (
          <button
            key={emoji}
            onClick={async () => {
              updateReactionUI(message, user, emoji, setMessages, true)
              await handleReaction(emoji, message.id, true)
            }}
            className={clsx(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm',
              hasReacted
                ? 'bg-primary-50 border-primary-200 text-primary-600'
                : 'bg-canvas-50 border-ink-200 text-ink-600 hover:bg-ink-50',
            )}
          >
            <span className="text-base">{emoji}</span>
            <span className="text-xs">{users.length}</span>
          </button>
        )
      })}
    </div>
  )
}
