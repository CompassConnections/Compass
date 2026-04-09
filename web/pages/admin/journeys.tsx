import clsx from 'clsx'
import {IS_LOCAL} from 'common/hosting/constants'
import {Row as rowfor} from 'common/supabase/utils'
import {groupBy, orderBy} from 'lodash'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {useAdmin} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {usePersistentQueryState} from 'web/hooks/use-persistent-query-state'

export default function Journeys() {
  const [hoursFromNowQ, setHoursFromNowQ] = usePersistentQueryState('h', '5')
  const hoursFromNow = hoursFromNowQ ?? '5'

  const {data} = useAPIGetter('get-user-journeys', {hoursFromNow})

  const users = data?.users ?? []
  const events = data?.events ?? []

  const bannedUsers = users.filter((u) => u.isBannedFromPosting)
  const unBannedUsers = users.filter((u) => !u.isBannedFromPosting)

  const eventsByUser = groupBy(orderBy(events as rowfor<'user_events'>[], 'ts', 'asc'), 'user_id')

  const isAdmin = useAdmin()

  const authorized = isAdmin || IS_LOCAL

  if (!authorized) return <p>Not authorized</p>

  return (
    <Row>
      <NoSEO />
      <div className="text-ink-900 mx-8">
        <div className={'text-primary-700 my-1 text-2xl'}>User Journeys</div>
        <Row className={'items-center gap-2'}>
          Viewing journeys from {unBannedUsers.length} users. Showing users created: {hoursFromNow}h
          ago.
          <Button
            color={'indigo-outline'}
            size={'xs'}
            onClick={() => {
              setHoursFromNowQ((hoursFromNow + 1).toString())
            }}
          >
            +1h
          </Button>
        </Row>
        <Row className={'flex-wrap gap-2 scroll-auto'}>
          {Object.keys(eventsByUser).map((userId) => {
            if (bannedUsers.find((u) => u.id === userId)) return null
            const events = eventsByUser[userId]
            const eventGroups: {[key: string]: any[]} = {}
            let eventName = ''
            let groupKey = ''
            events.forEach((event, index) => {
              if (event.name !== eventName) groupKey = `${event.name}_${index}`
              if (!eventGroups[groupKey]) eventGroups[groupKey] = []
              eventGroups[groupKey].push(event)
              eventName = event.name
            })
            const user = unBannedUsers.find((u) => u.id === userId)

            return (
              <Col className={'mt-4 min-w-[15rem]'} key={userId}>
                <Row
                  className={clsx(
                    'rounded-md p-1',
                    // user && isUserLikelySpammer(user) ? 'bg-amber-100' : ''
                  )}
                >
                  {user ? <UserAvatarAndBadge user={user} /> : userId}
                </Row>
                <ul>
                  <li>{new Date(events[0].ts!).toLocaleString()}</li>
                </ul>
                <Col>
                  {Object.values(eventGroups).map((group, index) => {
                    const name = group[0].name
                    const times = group.length
                    const timePeriod =
                      new Date(group[times - 1].ts!).valueOf() - new Date(group[0].ts!).valueOf()
                    const duration = Math.round(timePeriod / 1000)
                    const data = group
                      .map((g) => {
                        if (!Object.keys(g.data).length) return
                        return Object.entries(g.data)
                          .map(([_k, v]) => `${v}`)
                          .join(' ')
                      })
                      .filter(Boolean)
                      .join('. ')

                    return (
                      <li key={index}>
                        {name} {times > 1 ? `${times}x` : ' '}
                        {duration > 1 ? ` (${duration}s)` : ' '}
                        {data && <ul>{data}</ul>}
                      </li>
                    )
                  })}
                </Col>
                <ul>
                  <li>{new Date(events[events.length - 1].ts!).toLocaleString()}</li>
                </ul>
              </Col>
            )
          })}
        </Row>
      </div>
    </Row>
  )
}
