import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Upsert the two hand-set fields for one member. `undefined` leaves a field alone, `null` clears it —
 * the page edits stage and next action independently, so a write must never blank the other one.
 */
export const updateOutreachContact: APIHandler<'update-outreach-contact'> = async (props, auth) => {
  if (!isAdminId(auth.uid)) throw APIErrors.forbidden('Admin only')

  const {userId, stage, nextAction} = props

  // An empty box means "nothing owed", which is the same state as never having written one.
  const trimmedNextAction = nextAction?.trim() ? nextAction.trim() : null

  const pg = createSupabaseDirectClient()

  await pg.none(
    `insert into outreach_contacts (user_id, stage, next_action)
     values ($(userId), $(stage), $(nextAction))
     on conflict (user_id) do update
       set stage        = case
                            when $(stageProvided) then excluded.stage
                            else outreach_contacts.stage end,
           next_action  = case
                            when $(nextActionProvided) then excluded.next_action
                            else outreach_contacts.next_action end,
           updated_time = now()`,
    {
      userId,
      stage: stage ?? null,
      nextAction: trimmedNextAction,
      stageProvided: stage !== undefined,
      nextActionProvided: nextAction !== undefined,
    },
  )
}
