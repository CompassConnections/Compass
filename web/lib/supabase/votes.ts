import {db} from 'web/lib/supabase/db'

import {OrderBy} from "common/votes/constants";

export const getVotes = async (params: { orderBy: OrderBy }) => {
  const {orderBy} = params
  const {data, error} = await db.rpc('get_votes_with_results' as any, {
    order_by: orderBy,
  });
  if (error) throw error;

  return data
}
