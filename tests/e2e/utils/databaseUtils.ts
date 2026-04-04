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
