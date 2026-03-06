import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {sendDiscordMessage} from 'common/discord/core'
import {debug} from 'common/logger'
import {jsonToMarkdown} from 'common/md'
import {trimStrings} from 'common/parsing'
import {HOUR_MS, MINUTE_MS, sleep} from 'common/util/time'
import {tryCatch} from 'common/util/try-catch'
import {track} from 'shared/analytics'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updateUser} from 'shared/supabase/users'
import {insert} from 'shared/supabase/utils'
import {getUser, log} from 'shared/utils'

export const createProfile: APIHandler<'create-profile'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  const {data: existingProfile} = await tryCatch(
    pg.oneOrNone<{id: string}>('select id from profiles where user_id = $1', [auth.uid]),
  )
  if (existingProfile) {
    throw APIErrors.badRequest('Profile already exists')
  }

  await removePinnedUrlFromPhotoUrls(body)
  trimStrings(body)

  const user = await getUser(auth.uid)
  if (!user) throw APIErrors.unauthorized('Your account was not found')
  if (user.createdTime > Date.now() - HOUR_MS) {
    // If they just signed up, set their avatar to be their pinned photo
    updateUser(pg, auth.uid, {avatarUrl: body.pinned_url || undefined})
  }

  debug('body', body)

  const {data, error} = await tryCatch(insert(pg, 'profiles', {user_id: auth.uid, ...body}))

  if (error) {
    log.error('Error creating user: ' + error.message)
    throw APIErrors.internalServerError('Error creating user')
  }

  log('Created profile', data)

  const continuation = async () => {
    try {
      await track(auth.uid, 'create profile', {username: user.username})
    } catch (e) {
      console.error('Failed to track create profile', e)
    }
    try {
      // Let the user fill in the optional form with all their info and pictures before notifying discord of their arrival.
      // So we can sse their full profile as soon as we get the notif on discord. And that allows OG to pull their pic for the link preview.
      // Regardless, you need to wait for at least 5 seconds that the profile is fully in the db—otherwise ISR may cache "profile not created yet"
      await sleep(10 * MINUTE_MS)
      let message: string = `[**${user.name}**](https://www.compassmeet.com/${user.username}) just created a profile`
      if (body.bio) {
        const bioText = jsonToMarkdown(body.bio)
        if (bioText) message += `\n${bioText}`
      }
      await sendDiscordMessage(message, 'members')
    } catch (e) {
      console.error('Failed to send discord new profile', e)
    }
    try {
      const nProfiles = await pg.one<number>(`SELECT count(*) FROM profiles`, [], (r) =>
        Number(r.count),
      )

      const isMilestone = (n: number) => {
        return (
          [15, 20, 30, 40].includes(n) || // early milestones
          n % 50 === 0
        )
      }
      debug(nProfiles, isMilestone(nProfiles))
      if (isMilestone(nProfiles)) {
        await sendDiscordMessage(`We just reached **${nProfiles}** total profiles! 🎉`, 'general')
      }
    } catch (e) {
      console.error('Failed to send discord user milestone', e)
    }
  }

  return {
    result: data,
    continue: continuation,
  }
}
