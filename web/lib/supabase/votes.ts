import {run} from 'common/supabase/utils'
import {db} from 'web/lib/supabase/db'

export const getVotes = async () => {
  const {data, error} = await db.rpc('get_votes_with_results' as any);
  if (error) throw error;

  // data.forEach((vote: any) => {
  //   console.log(vote.title, vote.votes_for, vote.votes_against, vote.votes_abstain);
  // });

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
