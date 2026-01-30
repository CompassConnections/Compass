import {APIError, APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser, log} from 'shared/utils'
import {HOUR_MS, MINUTE_MS, sleep} from 'common/util/time'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import {track} from 'shared/analytics'
import {updateUser} from 'shared/supabase/users'
import {tryCatch} from 'common/util/try-catch'
import {insert} from 'shared/supabase/utils'
import {sendDiscordMessage} from "common/discord/core";
import {jsonToMarkdown} from "common/md";
import {trimStrings} from "common/parsing";

export const createProfile: APIHandler<'create-profile'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  const { data: existingUser } = await tryCatch(
    pg.oneOrNone<{ id: string }>('select id from profiles where user_id = $1', [
      auth.uid,
    ])
  )
  if (existingUser) {
    throw new APIError(400, 'User already exists')
  }

  await removePinnedUrlFromPhotoUrls(body)
  trimStrings(body)

  const user = await getUser(auth.uid)
  if (!user) throw new APIError(401, 'Your account was not found')
  if (user.createdTime > Date.now() - HOUR_MS) {
    // If they just signed up, set their avatar to be their pinned photo
    updateUser(pg, auth.uid, { avatarUrl: body.pinned_url })
  }

  console.debug('body', body)

  const { data, error } = await tryCatch(
    insert(pg, 'profiles', { user_id: auth.uid, ...body })
  )

  if (error) {
    log.error('Error creating user: ' + error.message)
    throw new APIError(500, 'Error creating user')
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
      const nProfiles = await pg.one<number>(
        `SELECT count(*) FROM profiles`,
        [],
        (r) => Number(r.count)
      )

      const isMilestone = (n: number) => {
        return (
          [15, 20, 30, 40].includes(n) || // early milestones
          n % 50 === 0
        )
      }
      console.debug(nProfiles, isMilestone(nProfiles))
      if (isMilestone(nProfiles)) {
        await sendDiscordMessage(
          `We just reached **${nProfiles}** total profiles! 🎉`,
          'general',
        )
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
