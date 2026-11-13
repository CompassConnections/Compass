import {JobApplication, POSITION_TITLES} from 'common/careers'
import {sendDiscordMessage} from 'common/discord/core'
import {DOMAIN} from 'common/envs/constants'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

// Discord rejects a message over 2000 characters, and the four answers together can run to 4500.
const DISCORD_CHUNK_LENGTH = 1900

/**
 * Cut `text` into pieces Discord will accept, breaking at a line end where there is one so a
 * paragraph is not split mid-sentence.
 */
export const splitForDiscord = (text: string, max = DISCORD_CHUNK_LENGTH) => {
  const chunks: string[] = []
  let rest = text
  while (rest.length > max) {
    const lineEnd = rest.lastIndexOf('\n', max)
    const cut = lineEnd > 0 ? lineEnd : max
    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut).replace(/^\n/, '')
  }
  if (rest.length > 0) chunks.push(rest)
  return chunks
}

/**
 * Stores an application to a position listed on `/careers` and tells the staff `contact` channel.
 *
 * Applying again replaces the earlier answers: there is one row per member and position, so the page
 * can show what was sent and let the applicant correct it.
 */
export const applyToPosition: APIHandler<'apply-to-position'> = async (props, auth) => {
  const {position, about, plan, rate, availability} = props
  const pg = createSupabaseDirectClient()

  // A token can exist before the account does (sign-up not finished), and `user_id` references
  // `users`. Checked here so that case is a clear refusal and not a foreign-key 500.
  const user = await pg.oneOrNone<{name: string; username: string}>(
    `select name, username from users where id = $1`,
    [auth.uid],
  )
  if (!user) throw APIErrors.forbidden('Finish creating your account before applying')

  // `xmax = 0` is true only for a freshly inserted row, which tells an application from a correction.
  const row = await pg.one<{updated_time: Date; is_new: boolean}>(
    `insert into job_applications (user_id, position, about, plan, rate, availability)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (user_id, position) do update
       set about = excluded.about,
           plan = excluded.plan,
           rate = excluded.rate,
           availability = excluded.availability,
           updated_time = now()
     returning updated_time, (xmax = 0) as is_new`,
    [auth.uid, position, about, plan, rate, availability],
  )

  // Sent before the response, not in a `continue`: Cloud Run throttles the CPU once the response
  // is out, and an application nobody is told about is one nobody reads. A Discord failure must not
  // fail the request, though: the application is already saved.
  try {
    const title = `${row.is_new ? 'New application' : 'Updated application'}: ${POSITION_TITLES[position]}`
    const message = [
      `**${title}** from [@${user.name}](https://${DOMAIN}/${user.username})`,
      `**About**\n${about}`,
      `**First month**\n${plan}`,
      `**Rate**\n${rate}`,
      `**Availability**\n${availability}`,
    ].join('\n\n')
    for (const chunk of splitForDiscord(message)) {
      await sendDiscordMessage(chunk, 'contact')
    }
  } catch (e) {
    log.error('Failed to send job application to discord', {error: e, userId: auth.uid, position})
  }

  const application: JobApplication = {
    position,
    about,
    plan,
    rate,
    availability,
    updatedTime: new Date(row.updated_time).toISOString(),
  }
  return {application}
}
