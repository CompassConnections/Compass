import {setLastOnlineTimeUser} from 'api/set-last-online-time'
import {setProfileOptions} from 'api/update-options'
import {APIErrors} from 'common/api/utils'
import {defaultLocale} from 'common/constants'
import {sendDiscordMessage} from 'common/discord/core'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {debug} from 'common/logger'
import {trimStrings} from 'common/parsing'
import {convertPrivateUser, convertUser} from 'common/supabase/users'
import {PrivateUser} from 'common/user'
import {getDefaultNotificationPreferences} from 'common/user-notification-preferences'
import {cleanDisplayName} from 'common/util/clean-username'
import {removeUndefinedProps} from 'common/util/object'
import {sendWelcomeEmail} from 'email/functions/helpers'
import * as admin from 'firebase-admin'
import {getIp, track} from 'shared/analytics'
import {getBucket} from 'shared/firebase-utils'
import {generateAvatarUrl} from 'shared/helpers/generate-and-update-avatar-urls'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {getUserByUsername, log} from 'shared/utils'

import {APIHandler} from './helpers/endpoint'
import {validateUsername} from './validate-username'

export const createUserAndProfile: APIHandler<'create-user-and-profile'> = async (
  props,
  auth,
  req,
) => {
  trimStrings(props)
  const {
    deviceToken,
    locale = defaultLocale,
    username,
    name,
    link,
    profile,
    interests,
    causes,
    work,
  } = props
  await removePinnedUrlFromPhotoUrls(profile)

  // const host = req.get('referer')

  const ip = getIp(req)

  const pg = createSupabaseDirectClient()

  const cleanName = cleanDisplayName(name || 'User')

  const fbUser = await admin.auth().getUser(auth.uid)
  const email = fbUser.email

  const bucket = getBucket()
  const avatarUrl = await generateAvatarUrl(auth.uid, cleanName, bucket)

  let finalUsername = username
  const validation = await validateUsername(username)
  if (validation.suggestedUsername) {
    finalUsername = validation.suggestedUsername
  } else if (!validation.valid) {
    throw APIErrors.badRequest(validation.message || 'Invalid username', {
      field: 'username',
      resolution:
        'Usernames must be 3–25 characters and contain only letters, numbers, or underscores.',
    })
  }

  // The pg.tx() call wraps several database operations in a single atomic transaction,
  // ensuring they either all succeed or all fail together.
  const {user, privateUser, newProfileRow} = await pg.tx(async (tx) => {
    const existingUser = await tx.oneOrNone('select id from users where id = $1', [auth.uid])
    if (existingUser) {
      throw APIErrors.conflict('An account for this user already exists', {
        resolution:
          'If you already have an account, try logging in. If you believe this is a mistake, contact support.',
      })
    }

    const sameNameUser = await getUserByUsername(finalUsername, tx)
    if (sameNameUser) {
      throw APIErrors.conflict('Username is already taken', {
        field: 'username',
        resolution: 'Please choose a different username.',
      })
    }

    const userData = removeUndefinedProps({
      avatarUrl,
      isBannedFromPosting: Boolean(
        (deviceToken && bannedDeviceTokens.includes(deviceToken)) ||
          (ip && bannedIpAddresses.includes(ip)),
      ),
      link: link,
    })

    const privateUserData: PrivateUser = {
      id: auth.uid,
      email,
      locale,
      initialIpAddress: ip,
      initialDeviceToken: deviceToken,
      notificationPreferences: getDefaultNotificationPreferences(),
      blockedUserIds: [],
      blockedByUserIds: [],
    }

    const newUserRow = await insert(tx, 'users', {
      id: auth.uid,
      name: cleanName,
      username: finalUsername,
      data: userData,
    })

    const newPrivateUserRow = await insert(tx, 'private_users', {
      id: privateUserData.id,
      data: privateUserData,
    })

    const profileData = removeUndefinedProps(profile)

    const newProfileRow = await insert(tx, 'profiles', {
      user_id: auth.uid,
      ...profileData,
    })

    const profileId = newProfileRow.id

    await setProfileOptions(tx, profileId, auth.uid, 'interests', interests)
    await setProfileOptions(tx, profileId, auth.uid, 'causes', causes)
    await setProfileOptions(tx, profileId, auth.uid, 'work', work)

    return {
      user: convertUser(newUserRow),
      privateUser: convertPrivateUser(newPrivateUserRow),
      newProfileRow,
    }
  })

  log('created user and profile', {username: user.username, firebaseId: auth.uid})

  const continuation = async () => {
    try {
      await track(auth.uid, 'create profile', {username: user.username})
    } catch (e) {
      console.error('Failed to track create profile', e)
    }
    try {
      await sendWelcomeEmail(user, privateUser)
    } catch (e) {
      console.error('Failed to sendWelcomeEmail', e)
    }
    try {
      await setLastOnlineTimeUser(auth.uid)
    } catch (e) {
      console.error('Failed to set last online time', e)
    }
    try {
      const message: string = `[**${user.name}**](${DEPLOYED_WEB_URL}/${user.username}) just created a profile`
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
    result: {
      // include everything the frontend needs
      user,
      privateUser,
      profile: {
        ...newProfileRow,
        interests: interests ?? [],
        causes: causes ?? [],
        work: work ?? [],
      },
    },
    continue: continuation,
  }
}

const bannedDeviceTokens = [
  'fa807d664415',
  'dcf208a11839',
  'bbf18707c15d',
  '4c2d15a6cc0c',
  '0da6b4ea79d3',
]
const bannedIpAddresses: string[] = [
  '24.176.214.250',
  '2607:fb90:bd95:dbcd:ac39:6c97:4e35:3fed',
  '2607:fb91:389:ddd0:ac39:8397:4e57:f060',
  '2607:fb90:ed9a:4c8f:ac39:cf57:4edd:4027',
  '2607:fb90:bd36:517a:ac39:6c91:812c:6328',
]
