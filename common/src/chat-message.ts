import { type JSONContent } from '@tiptap/core'
export type ChatVisibility = 'private' | 'system_status' | 'introduction'

export type ChatMessage = {
  id: string
  userId: string
  channelId: string
  content: JSONContent
  createdTime: number
  visibility: ChatVisibility
}
export type PrivateChatMessage = Omit<ChatMessage, 'id'> & {
  id: number
  createdTimeTs: string
}
