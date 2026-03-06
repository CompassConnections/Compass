import {setLastOnlineTimeUser} from 'api/set-last-online-time'
import {defaultLocale} from 'common/constants'
import {RESERVED_PATHS} from 'common/envs/constants'
import {convertPrivateUser, convertUser} from 'common/supabase/users'
import {PrivateUser} from 'common/user'
import {getDefaultNotificationPreferences} from 'common/user-notification-preferences'
import {cleanDisplayName, cleanUsername} from 'common/util/clean-username'
import {removeUndefinedProps} from 'common/util/object'
import {randomString} from 'common/util/random'
import {sendWelcomeEmail} from 'email/functions/helpers'
import * as admin from 'firebase-admin'
import {getIp, track} from 'shared/analytics'
import {getBucket} from 'shared/firebase-utils'
import {generateAvatarUrl} from 'shared/helpers/generate-and-update-avatar-urls'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {getUser, getUserByUsername, log} from 'shared/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'

/**
 * Create User API Handler
 *
 * Creates a new user account with associated profile and private user data.
 * This endpoint is called after Firebase authentication to initialize
 * the user's presence in the Compass database.
 *
 * Process:
 * 1. Validates Firebase authentication token
 * 2. Creates user record in users table
 * 3. Creates private user record in private_users table
 * 4. Generates default profile data
 * 5. Sends welcome email asynchronously
 * 6. Tracks user creation event
 *
 * @param props - Request parameters including device token and locale
 * @param auth - Authenticated user information from Firebase
 * @param req - Express request object for accessing headers/IP
 * @returns User and private user objects with continuation function for async tasks
 * @throws {APIError} 403 if user already exists or username is taken
 */
export const createUser: APIHandler<'create-user'> = async (props, auth, req) => {
  const {deviceToken, locale = defaultLocale} = props

  const host = req.get('referer')
  log(`Create user from: ${host}, ${props}`)

  const ip = getIp(req)

  const fbUser = await admin.auth().getUser(auth.uid)
  const email = fbUser.email
  const emailName = email?.replace(/@.*$/, '')

  const rawName = fbUser.displayName || emailName || 'User' + randomString(4)
  const name = cleanDisplayName(rawName)

  const bucket = getBucket()
  const avatarUrl = fbUser.photoURL ?? (await generateAvatarUrl(auth.uid, name, bucket))

  const pg = createSupabaseDirectClient()

  let username = cleanUsername(name)

  // Check username case-insensitive
  const dupes = await pg.one<number>(
    `select count(*)
     from users
     where username ilike $1`,
    [username],
    (r) => r.count,
  )
  const usernameExists = dupes > 0
  const isReservedName = RESERVED_PATHS.has(username)
  if (usernameExists || isReservedName) username += randomString(4)

  const {user, privateUser} = await pg.tx(async (tx) => {
    const preexistingUser = await getUser(auth.uid, tx)
    if (preexistingUser)
      throw APIErrors.forbidden('User already exists', {
        field: 'userId',
        context: `User with ID ${auth.uid} already exists`,
      })

    // Check exact username to avoid problems with duplicate requests
    const sameNameUser = await getUserByUsername(username, tx)
    if (sameNameUser)
      throw APIErrors.conflict('Username already taken', {
        field: 'username',
        context: `Username "${username}" is already taken`,
      })

    const user = removeUndefinedProps({
      avatarUrl,
      isBannedFromPosting: Boolean(
        (deviceToken && bannedDeviceTokens.includes(deviceToken)) ||
          (ip && bannedIpAddresses.includes(ip)),
      ),
      link: {},
    })

    const privateUser: PrivateUser = {
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
      await sendWelcomeEmail(user, privateUser)
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
