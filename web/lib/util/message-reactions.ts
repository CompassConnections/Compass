import {api} from "web/lib/api";
import {toast} from "react-hot-toast";


export const handleReaction = async (
  reaction: string,
  id: number,
  toDelete?: boolean,
) => {
  // console.log('handleReaction', {reaction, id, toDelete})
  try {
    await api('react-to-message', {
      messageId: id,
      reaction,
      toDelete,
    })
  } catch (error) {
    console.error('Error reacting to message:', error)
    toast.error('Failed to add reaction')
  }
}