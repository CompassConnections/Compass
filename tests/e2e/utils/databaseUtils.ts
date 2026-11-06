import {createSupabaseDirectClient} from 'shared/supabase/init'

export async function deleteFromDb(user_id: string) {
  const db = createSupabaseDirectClient()
  const deleteEntryById = `DELETE FROM users WHERE id = $1 RETURNING *`
  const result = await db.query(deleteEntryById, [user_id])

  if (!result.length) {
    console.debug(`No user found with id: ${user_id}`)
    return
  }

  console.log('Deleted data: ', {
    id: result[0].id,
    name: result[0].name,
    username: result[0].username,
  })
}

export async function userInformationFromDb(account: any) {
  const db = createSupabaseDirectClient()
  const queryUserById = `
                SELECT *
                FROM users
                WHERE username = $1
            `
  const userResults = await db.query(queryUserById, [account.username])

  if (userResults.length === 0) {
    throw new Error(`No user found with username: ${account.username}`)
  }

  const queryProfileById = `
                SELECT p.*
                FROM profiles AS p
                WHERE user_id = $1
            `
  const profileResults = await db.query(queryProfileById, [userResults[0].id])

  if (profileResults.length === 0) {
    throw new Error(`No profile found for user: ${userResults[0].id}`)
  }

  return {
    user: userResults[0],
    profile: profileResults[0],
  }
}

export async function dbUserExists(username: string): Promise<boolean> {
  const db = createSupabaseDirectClient()
  const query = `SELECT 1 FROM users WHERE username = $1 LIMIT 1`
  const result = await db.query(query, [username])
  return result.length > 0
}

/** Sets columns on a member's profile, for state the UI cannot reach or a test should not wait on. */
export async function setProfileColumns(username: string, columns: Record<string, unknown>) {
  const db = createSupabaseDirectClient()
  await db.none(
    `update profiles
     set ${sets(columns)}
     where user_id = (select id from users where username = $(username))`,
    {...columns, username},
  )
}

const sets = (columns: Record<string, unknown>) =>
  Object.keys(columns)
    .map((column) => `"${column}" = $(${column})`)
    .join(', ')

export async function banUser(username: string, banReason: string) {
  const db = createSupabaseDirectClient()
  await db.none(
    `update users set is_banned_from_posting = true, ban_reason = $2 where username = $1`,
    [username, banReason],
  )
}

/** Answers every compatibility prompt on a member's behalf, so that others have someone to score against. */
export async function seedCompatibilityAnswers(username: string) {
  const db = createSupabaseDirectClient()
  await db.none(
    `insert into compatibility_answers (creator_id, question_id, multiple_choice, pref_choices, importance)
     select (select id from users where username = $1), id, 0, '{0, 1}', 1
     from compatibility_prompts`,
    [username],
  )
}

export async function notificationPreferencesOf(username: string) {
  const db = createSupabaseDirectClient()
  const {preferences} = await db.one(
    `select pu.data -> 'notificationPreferences' as preferences
     from private_users pu
     join users u on u.id = pu.id
     where u.username = $1`,
    [username],
  )
  return preferences
}
