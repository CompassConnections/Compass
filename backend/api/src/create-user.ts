import * as admin from 'firebase-admin'
import {PrivateUser} from 'common/user'
import {randomString} from 'common/util/random'
import {cleanDisplayName, cleanUsername} from 'common/util/clean-username'
import {getIp, track} from 'shared/analytics'
import {APIError, APIHandler} from './helpers/endpoint'
import {getDefaultNotificationPreferences} from 'common/user-notification-preferences'
import {removeUndefinedProps} from 'common/util/object'
import {generateAvatarUrl} from 'shared/helpers/generate-and-update-avatar-urls'
import {RESERVED_PATHS} from 'common/envs/constants'
import {getUser, getUserByUsername, log} from 'shared/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {convertPrivateUser, convertUser} from 'common/supabase/users'
import {getBucket} from "shared/firebase-utils";
import {sendWelcomeEmail} from "email/functions/helpers";
import {setLastOnlineTimeUser} from "api/set-last-online-time";
import {IS_LOCAL} from "common/hosting/constants";

export const createUser: APIHandler<'create-user'> = async (
  props,
  auth,
  req
) => {
  const {deviceToken: preDeviceToken} = props
  const firebaseUser = await admin.auth().getUser(auth.uid)

  const testUserAKAEmailPasswordUser =
    firebaseUser.providerData[0].providerId === 'password'

  // if (
  //   testUserAKAEmailPasswordUser &&
  //   adminToken !== process.env.TEST_CREATE_USER_KEY
  // ) {
  //   throw new APIError(
  //     401,
  //     'Must use correct TEST_CREATE_USER_KEY to create user with email/password'
  //   )
  // }

  const host = req.get('referer')
  log(`Create user from: ${host}`)

  const ip = getIp(req)
  const deviceToken = testUserAKAEmailPasswordUser
    ? randomString() + randomString()
    : preDeviceToken

  const fbUser = await admin.auth().getUser(auth.uid)
  const email = fbUser.email
  const emailName = email?.replace(/@.*$/, '')

  const rawName = fbUser.displayName || emailName || 'User' + randomString(4)
  const name = cleanDisplayName(rawName)

  const bucket = getBucket()
  const avatarUrl = fbUser.photoURL
    ? fbUser.photoURL
    : await generateAvatarUrl(auth.uid, name, bucket)

  const pg = createSupabaseDirectClient()

  let username = cleanUsername(name)

  // Check username case-insensitive
  const dupes = await pg.one<number>(
    `select count(*)
     from users
     where username ilike $1`,
    [username],
    (r) => r.count
  )
  const usernameExists = dupes > 0
  const isReservedName = RESERVED_PATHS.includes(username)
  if (usernameExists || isReservedName) username += randomString(4)

  const {user, privateUser} = await pg.tx(async (tx) => {
    const preexistingUser = await getUser(auth.uid, tx)
    if (preexistingUser)
      throw new APIError(403, 'User already exists', {
        userId: auth.uid,
      })

    // Check exact username to avoid problems with duplicate requests
    const sameNameUser = await getUserByUsername(username, tx)
    if (sameNameUser)
      throw new APIError(403, 'Username already taken', {username})

    const user = removeUndefinedProps({
      avatarUrl,
      isBannedFromPosting: Boolean(
        (deviceToken && bannedDeviceTokens.includes(deviceToken)) ||
        (ip && bannedIpAddresses.includes(ip))
      ),
      link: {},
    })

    const privateUser: PrivateUser = {
      id: auth.uid,
      email,
      initialIpAddress: ip,
      initialDeviceToken: deviceToken,
      notificationPreferences: getDefaultNotificationPreferences(),
      blockedUserIds: [],
      blockedByUserIds: [],
    }

    const newUserRow = await insert(tx, 'users', {
      id: auth.uid,
      name,
      username,
      data: user,
    })

    const newPrivateUserRow = await insert(tx, 'private_users', {
      id: privateUser.id,
      data: privateUser,
    })

    return {
      user: convertUser(newUserRow),
      privateUser: convertPrivateUser(newPrivateUserRow),
    }
  })

  log('created user ', {username: user.username, firebaseId: auth.uid})

  const continuation = async () => {
    try {
      await track(auth.uid, 'create profile', {username: user.username})
    } catch (e) {
      console.error('Failed to track create profile', e)
    }
    try {
      if (!IS_LOCAL) await sendWelcomeEmail(user, privateUser)
    } catch (e) {
      console.error('Failed to sendWelcomeEmail', e)
    }
    try {
      await setLastOnlineTimeUser(auth.uid)
    } catch (e) {
      console.error('Failed to set last online time', e)
    }
  }

  return {
    result: {
      user,
      privateUser,
    },
    continue: continuation,
  }
}

// Automatically ban users with these device tokens or ip addresses.
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
