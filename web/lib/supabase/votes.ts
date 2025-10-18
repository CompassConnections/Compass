import {run} from 'common/supabase/utils'
import {db} from 'web/lib/supabase/db'

import {OrderBy} from "common/votes/constants";

export const getVotes = async (params: { orderBy: OrderBy }) => {
  const { orderBy } = params
  const {data, error} = await db.rpc('get_votes_with_results' as any, {
    order_by: orderBy,
  });
  if (error) throw error;

  return data
}

export const getVoteCreator = async (creatorId: string) => {
  const {data} = await run(
    db
      .from('users')
      .select(`id, name, username`)
      .eq('id', creatorId)
      .limit(1)
  )

  return data[0]
}
