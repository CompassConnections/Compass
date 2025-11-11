// This is a script to add a user to the DB: entries in the users and private_users table
// Run with:
// export ENVIRONMENT=DEV && ./../scripts/build_api.sh && npx tsx users.ts

import {createSupabaseDirectClient} from "shared/lib/supabase/init";
import {insert} from "shared/lib/supabase/utils";
import {PrivateUser} from "common/lib/user";
import {getDefaultNotificationPreferences} from "common/lib/user-notification-preferences";
import {randomString} from "common/lib/util/random";

(async () => {

  const userId = '...'
  const email = '...'
  const name = '...'
  const username = '...'
  const ip = '...'
  const deviceToken = randomString()
  const pg = createSupabaseDirectClient()

  const user = {
    // avatarUrl,
    isBannedFromPosting: false,
    link: {},
  }

  const privateUser: PrivateUser = {
    id: userId,
    email,
    initialIpAddress: ip,
    initialDeviceToken: deviceToken,
    notificationPreferences: getDefaultNotificationPreferences(),
    blockedUserIds: [],
    blockedByUserIds: [],
  }

  await pg.tx(async (tx) => {

    const newUserRow = await insert(tx, 'users', {
      id: userId,
      name,
      username,
      data: user,
    })

    console.log(newUserRow)

    const newPrivateUserRow = await insert(tx, 'private_users', {
      id: userId,
      data: privateUser,
    })

    console.log(newPrivateUserRow)

  })

  process.exit(0)
})()
