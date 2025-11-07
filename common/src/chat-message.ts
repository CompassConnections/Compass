import { type JSONContent } from '@tiptap/core'
export type ChatVisibility = 'private' | 'system_status' | 'introduction'

export type ChatMessage = {
  id: number
  userId: string
  channelId: string
  content: JSONContent
  createdTime: number
  visibility: ChatVisibility
  isEdited: boolean
  reactions: any
}
export type PrivateChatMessage = Omit<ChatMessage, 'id'> & {
  id: number
  createdTimeTs: string
}
