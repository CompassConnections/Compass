import { run } from 'common/supabase/utils'
import { db } from 'web/lib/supabase/db'
import {DisplayUser} from "common/api/user-types";

export const getStars = async (creatorId: string) => {
  const { data } = await run(
    db
      .from('love_stars')
      .select('*')
      .filter('creator_id', 'eq', creatorId)
      .order('created_time', { ascending: false })
  )

  if (!data) return []

  const ids = data.map((d) => d.target_id as string)
  const {data: users} = await run(
    db
      .from('users')
      .select(`id, name, username`)
      .in('id', ids)
  )

  return users as unknown as DisplayUser[]
}
