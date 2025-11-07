import {DotsHorizontalIcon, PencilIcon, TrashIcon} from '@heroicons/react/outline'
import {EmojiHappyIcon} from '@heroicons/react/solid'
import {Dispatch, SetStateAction, useEffect, useRef, useState} from 'react'
import {useUser} from 'web/hooks/use-user'
import {toast} from 'react-hot-toast'
import {api} from "web/lib/api"
import clsx from "clsx"
import DropdownMenu, {DropdownItem} from "web/components/comments/dropdown-menu"
import {JSONContent} from "@tiptap/react"
import {handleReaction} from "web/lib/util/message-reactions"
import {useClickOutside} from "web/hooks/use-click-outside"
import {PrivateChatMessage} from "common/chat-message";
import {updateReactionUI} from "web/lib/supabase/chat-messages";

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👎']

export function MessageActions(props: {
  message: {
    id: number
    userId: string
    content: JSONContent
    isEdited?: boolean
    reactions?: Record<string, boolean>
  }
  onRequestEdit?: () => void
  setMessages?: Dispatch<SetStateAction<PrivateChatMessage[] | undefined>>
  className?: string
  // If provided, when this key changes, the emoji picker will open
  openEmojiPickerKey?: number
  // If true, hide the trigger menu button and only render the picker anchor
  hideTrigger?: boolean
}) {
  const {message, onRequestEdit, className, setMessages, openEmojiPickerKey, hideTrigger} = props
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const user = useUser()
  const isOwner = user?.id === message.userId

  useClickOutside(emojiPickerRef, () => {
    setShowEmojiPicker(false)
  })

  // Open emoji picker when external key changes
  useEffect(() => {
    if (openEmojiPickerKey !== undefined) {
      setShowEmojiPicker(true)
    }
  }, [openEmojiPickerKey])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return
    const messageId = message.id
    try {
      await api('delete-message', {messageId})
      toast.success('Message deleted')
      setMessages?.((prevMessages) => {
        if (!prevMessages) return prevMessages
        return prevMessages.filter((m) => m.id !== messageId)
      })
    } catch (error) {
      toast.error('Failed to delete message')
      console.error(error)
    }
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div className="relative">
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={clsx(
              "absolute top-full mb-2 rounded-lg bg-canvas-200 p-2 shadow-lg pr-10 z-10",
              isOwner && 'right-0',
              !isOwner && 'left-0',
            )}
          >
            <div className="grid grid-cols-6 gap-8">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction}
                  className="text-2xl hover:scale-125"
                  onClick={async () => {
                    setShowEmojiPicker(false)
                    updateReactionUI(message, user, reaction, setMessages)
                    await handleReaction(reaction, message.id)
                  }}
                >
                  {reaction}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {!hideTrigger && (
        <DropdownMenu
          items={[
            isOwner && {
              name: 'Edit',
              icon: <PencilIcon className="h-4 w-4"/>,
              onClick: onRequestEdit,
            },
            isOwner && {
              name: 'Delete',
              icon: <TrashIcon className="h-4 w-4"/>,
              onClick: handleDelete,
            },
            {
              name: 'Add Reaction',
              icon: <EmojiHappyIcon className="h-4 w-4"/>,
              onClick: () => {
                setShowEmojiPicker(!showEmojiPicker)
              },
            },
          ].filter(Boolean) as DropdownItem[]}
          closeOnClick={true}
          icon={<DotsHorizontalIcon className="h-5 w-5 text-gray-500"/>}
          menuWidth="w-40"
          className="text-ink-500 hover:text-ink-700 rounded-full p-1 hover:bg-gray-100"
        />
      )}
      {/*{message.isEdited && (*/}
      {/*  <span className="text-xs text-gray-400">edited</span>*/}
      {/*)}*/}
    </div>
  )
}
