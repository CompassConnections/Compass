import {APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from "shared/supabase/init";

export const getMessagesCount: APIHandler<'get-messages-count'> = async (_, auth) => {
  const pg = createSupabaseDirectClient()
  const result = await pg.one(
    `
        SELECT COUNT(*) AS count
        FROM private_user_messages;
    `,
    []
  );
  const count = Number(result.count);
  console.debug('private_user_messages count:', count);
  return {
    count: count,
  }
}
