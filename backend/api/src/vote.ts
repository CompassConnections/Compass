import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const vote: APIHandler<'vote'> = async ({voteId, choice, priority}, auth) => {
  const user = await getUser(auth.uid)
  if (!user) throw APIErrors.unauthorized('Your account was not found')

  const pg = createSupabaseDirectClient()

  // Map string choice to smallint (-1, 0, 1)
  const choiceMap: Record<string, number> = {
    for: 1,
    abstain: 0,
    against: -1,
  }
  const choiceVal = choiceMap[choice]
  if (choiceVal === undefined) {
    throw APIErrors.badRequest('Invalid choice')
  }

  // Upsert the vote result to ensure one vote per user per vote
  // Assuming table vote_results with unique (user_id, vote_id)
  const query = `
    insert into vote_results (user_id, vote_id, choice, priority)
    values ($1, $2, $3, $4)
    on conflict (user_id, vote_id)
        do update set choice   = excluded.choice,
                      priority = excluded.priority
    returning *;
  `

  try {
    const result = await pg.one(query, [user.id, voteId, choiceVal, priority])
    return {data: result}
  } catch (e) {
    throw APIErrors.internalServerError('Error recording vote', {originalError: String(e)})
  }
}
