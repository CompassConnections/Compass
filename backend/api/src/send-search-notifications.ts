import {loadProfiles, profileQueryType} from 'api/get-profiles'
import {MatchesByUserType} from 'common/profiles/bookmarked_searches'
import {Row} from 'common/supabase/utils'
import {sendSearchAlertsEmail} from 'email/functions/helpers'
import {keyBy} from 'lodash'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {from, renderSql, select} from 'shared/supabase/sql-builder'

export function convertSearchRow(row: any): any {
  return row
}

export const notifyBookmarkedSearch = async (matches: MatchesByUserType) => {
  for (const [_, value] of Object.entries(matches)) {
    await sendSearchAlertsEmail(value.user, value.privateUser, value.matches)
  }
}

export const sendSearchNotifications = async () => {
  const pg = createSupabaseDirectClient()

  const search_query = renderSql(select('bookmarked_searches.*'), from('bookmarked_searches'))
  const searches = (await pg.map(
    search_query,
    [],
    convertSearchRow,
  )) as Row<'bookmarked_searches'>[]
  console.debug(`Running ${searches.length} bookmarked searches`)

  const _users = (await pg.map(
    renderSql(select('users.*'), from('users')),
    [],
    convertSearchRow,
  )) as Row<'users'>[]
  const users = keyBy(_users, 'id')
  console.debug('users', users)

  const _privateUsers = (await pg.map(
    renderSql(select('private_users.*'), from('private_users')),
    [],
    convertSearchRow,
  )) as Row<'private_users'>[]
  const privateUsers = keyBy(_privateUsers, 'id')
  console.debug('privateUsers', privateUsers)

  const matches: MatchesByUserType = {}

  for (const row of searches) {
    if (typeof row.search_filters !== 'object') continue
    const {orderBy: _, ...filters} = (row.search_filters ?? {}) as Record<string, any>
    const props = {
      ...filters,
      skipId: row.creator_id,
      userId: row.creator_id,
      lastModificationWithin: '24 hours',
      shortBio: true,
    }
    const {profiles} = await loadProfiles(props as profileQueryType)
    console.debug(profiles.map((item: any) => item.name))
    if (!profiles.length) continue
    if (!(row.creator_id in matches)) {
      if (!privateUsers[row.creator_id]) continue
      matches[row.creator_id] = {
        user: users[row.creator_id],
        privateUser: privateUsers[row.creator_id]['data'],
        matches: [],
      }
    }
    matches[row.creator_id].matches.push({
      id: row.creator_id,
      description: {filters: row.search_filters, location: row.location},
      matches: profiles.map((item: any) => ({
        name: item.name,
        username: item.username,
      })),
    })
  }
  console.debug('matches:', JSON.stringify(matches, null, 2))
  await notifyBookmarkedSearch(matches)

  return {status: 'success'}
}
