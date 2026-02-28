import {createSupabaseDirectClient} from 'shared/supabase/init'

export async function deleteFromDb(user_id: string) {
  const db = createSupabaseDirectClient()
  try {
    const deleteEntryById = `DELETE FROM users WHERE id = $1 RETURNING *`
    const result = await db.query(deleteEntryById, [user_id])

    if (!result.length) {
      throw new Error(`No user found with id: ${user_id}`)
    }

    console.log('Deleted data: ', {
      id: result[0].id,
      name: result[0].name,
      username: result[0].username,
    })
  } catch (error) {
    throw error
  }
}

export async function userInformationFromDb(account: any) {
  const db = createSupabaseDirectClient()
  try {
    const queryUserById = `
                SELECT p.*
                FROM users AS p
                WHERE username = $1
            `
    const userResults = await db.query(queryUserById, [account.username])
    const queryProfileById = `
                SELECT p.*
                FROM profiles AS p
                WHERE user_id = $1
            `
    const profileResults = await db.query(queryProfileById, [userResults[0].id])

    return {
      user: userResults[0],
      profile: profileResults[0],
    }
  } catch (error) {
    throw error
  }
}
