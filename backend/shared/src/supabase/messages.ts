import {convertSQLtoTS, Row, tsToMillis} from "common/supabase/utils";
import {ChatMessage, PrivateChatMessage} from "common/chat-message";
import {decryptMessage} from "shared/encryption";

export type DbPrivateChatMessage = PrivateChatMessage & {
  ciphertext: string
  iv: string
  tag: string
}

export const convertChatMessage = (row: Row<'private_user_messages'>) =>
  convertSQLtoTS<'private_user_messages', ChatMessage>(row, {
    created_time: tsToMillis as any,
  })

export const convertPrivateChatMessage = (row: Row<'private_user_messages'>) => {
  const message = convertSQLtoTS<'private_user_messages', DbPrivateChatMessage>(
    row,
    {created_time: tsToMillis as any,}
  );
  if (message.ciphertext && message.iv && message.tag) {
    const plaintText = decryptMessage({
      ciphertext: message.ciphertext,
      iv: message.iv,
      tag: message.tag,
    });
    message.content = JSON.parse(plaintText)
    delete (message as any).ciphertext
    delete (message as any).iv
    delete (message as any).tag
  }
  return message
}