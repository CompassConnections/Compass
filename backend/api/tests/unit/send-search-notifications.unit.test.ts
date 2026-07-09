jest.mock('shared/supabase/init')
jest.mock('api/get-profiles')
jest.mock('api/profile-snapshot')
jest.mock('email/functions/helpers')
jest.mock('common/discord/core')

import * as profileModules from 'api/get-profiles'
import * as snapshotModules from 'api/profile-snapshot'
import * as searchNotificationModules from 'api/send-search-notifications'
import * as helperModules from 'email/functions/helpers'
import * as supabaseInit from 'shared/supabase/init'

const CREATOR_ID = 'creator-1'

const search = (id: number, creator_id = CREATOR_ID) => ({
  id,
  created_time: '2026-07-01T00:00:00Z',
  creator_id,
  search_filters: {genders: ['female']},
  location: null,
  last_notified_at: null,
  last_checked_at: null,
  search_name: null,
})

const profile = (user_id: string) => ({
  user_id,
  name: `name-${user_id}`,
  user: {id: user_id, name: `name-${user_id}`, username: user_id},
})

describe('sendSearchNotifications', () => {
  let mockPg = {} as any
  let takenAt: Date

  beforeEach(() => {
    jest.resetAllMocks()
    takenAt = new Date()

    mockPg = {
      manyOrNone: jest.fn(),
      none: jest.fn().mockResolvedValue(undefined),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)

    // A healthy, freshly built snapshot with one changed profile in it.
    ;(snapshotModules.hasStagingSnapshot as jest.Mock).mockResolvedValue(false)
    ;(snapshotModules.buildStagingSnapshot as jest.Mock).mockResolvedValue(undefined)
    ;(snapshotModules.isSnapshotUsable as jest.Mock).mockResolvedValue(true)
    ;(snapshotModules.promoteStagingSnapshot as jest.Mock).mockResolvedValue(undefined)
    ;(snapshotModules.getStagingTakenAt as jest.Mock).mockResolvedValue(takenAt)
    ;(snapshotModules.getChangedUserIds as jest.Mock).mockResolvedValue(['woman-1'])
    ;(snapshotModules.withSchema as jest.Mock).mockImplementation(
      (_pg: any, _schema: string, fn: any) => fn(mockPg),
    )
    ;(helperModules.sendSearchAlertsEmail as jest.Mock).mockResolvedValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  /** searches, then users, then private_users */
  const mockQueries = (searches: any[]) => {
    mockPg.manyOrNone
      .mockResolvedValueOnce(searches)
      .mockResolvedValueOnce([{id: CREATOR_ID, name: 'Creator'}])
      .mockResolvedValueOnce([{id: CREATOR_ID, data: {email: 'creator@example.com'}}])
  }

  it('notifies about a profile that did not match before it was modified', async () => {
    mockQueries([search(1)])
    ;(profileModules.loadProfiles as jest.Mock)
      .mockResolvedValueOnce({profiles: [profile('woman-1')]}) // matches now
      .mockResolvedValueOnce({profiles: []}) // matched nothing in the snapshot

    const result = await searchNotificationModules.sendSearchNotifications()

    expect(result).toEqual({status: 'success', notified: 1, failed: 0})
    expect(helperModules.sendSearchAlertsEmail).toBeCalledTimes(1)
    expect(helperModules.sendSearchAlertsEmail).toBeCalledWith(
      {id: CREATOR_ID, name: 'Creator'},
      {email: 'creator@example.com'},
      [
        {
          id: CREATOR_ID,
          description: {filters: {genders: ['female']}, location: null},
          matches: [profile('woman-1').user],
        },
      ],
    )
    expect(snapshotModules.promoteStagingSnapshot).toBeCalledTimes(1)
  })

  it('does not notify when the modified profile already matched the search', async () => {
    mockQueries([search(1)])
    ;(profileModules.loadProfiles as jest.Mock)
      .mockResolvedValueOnce({profiles: [profile('woman-1')]}) // still matches
      .mockResolvedValueOnce({profiles: [profile('woman-1')]}) // and already did yesterday

    const result = await searchNotificationModules.sendSearchNotifications()

    expect(result).toEqual({status: 'success', notified: 0, failed: 0})
    expect(helperModules.sendSearchAlertsEmail).not.toBeCalled()
    // The search is still watermarked, so a resumed run skips it.
    expect(mockPg.none).toBeCalledWith(expect.stringContaining('set last_checked_at = now()'), {
      searchIds: [1],
      matchedSearchIds: [],
    })
    expect(snapshotModules.promoteStagingSnapshot).toBeCalledTimes(1)
  })

  it('only queries the snapshot for the profiles that currently match', async () => {
    mockQueries([search(1)])
    ;(profileModules.loadProfiles as jest.Mock)
      .mockResolvedValueOnce({profiles: [profile('woman-1')]})
      .mockResolvedValueOnce({profiles: []})

    await searchNotificationModules.sendSearchNotifications()

    const [liveProps] = (profileModules.loadProfiles as jest.Mock).mock.calls[0]
    const [snapshotProps] = (profileModules.loadProfiles as jest.Mock).mock.calls[1]
    expect(liveProps).toMatchObject({genders: ['female'], skipId: CREATOR_ID, userIds: ['woman-1']})
    expect(snapshotProps).toMatchObject({userIds: ['woman-1']})
    expect(snapshotModules.withSchema).toHaveBeenNthCalledWith(
      1,
      mockPg,
      snapshotModules.STAGING_SCHEMA,
      expect.any(Function),
    )
    expect(snapshotModules.withSchema).toHaveBeenNthCalledWith(
      2,
      mockPg,
      snapshotModules.SNAPSHOT_SCHEMA,
      expect.any(Function),
    )
  })

  it('skips a search whose profiles are all unchanged', async () => {
    ;(snapshotModules.getChangedUserIds as jest.Mock).mockResolvedValue([])

    const result = await searchNotificationModules.sendSearchNotifications()

    expect(result).toEqual({status: 'success', notified: 0})
    expect(profileModules.loadProfiles).not.toBeCalled()
    expect(snapshotModules.promoteStagingSnapshot).toBeCalledTimes(1)
  })

  it('seeds the snapshot without alerting when it is missing or stale', async () => {
    ;(snapshotModules.isSnapshotUsable as jest.Mock).mockResolvedValue(false)

    const result = await searchNotificationModules.sendSearchNotifications()

    expect(result).toEqual({status: 'success', notified: 0, skipped: true})
    expect(snapshotModules.getChangedUserIds).not.toBeCalled()
    expect(helperModules.sendSearchAlertsEmail).not.toBeCalled()
    expect(snapshotModules.promoteStagingSnapshot).toBeCalledTimes(1)
  })

  it('reuses the staging snapshot of a crashed run instead of rebuilding it', async () => {
    ;(snapshotModules.hasStagingSnapshot as jest.Mock).mockResolvedValue(true)
    mockQueries([search(1)])
    ;(profileModules.loadProfiles as jest.Mock)
      .mockResolvedValueOnce({profiles: []})
      .mockResolvedValueOnce({profiles: []})

    await searchNotificationModules.sendSearchNotifications()

    expect(snapshotModules.buildStagingSnapshot).not.toBeCalled()
  })

  it('keeps the staging snapshot when an email fails, so the next run retries it', async () => {
    mockQueries([search(1)])
    ;(profileModules.loadProfiles as jest.Mock)
      .mockResolvedValueOnce({profiles: [profile('woman-1')]})
      .mockResolvedValueOnce({profiles: []})
    ;(helperModules.sendSearchAlertsEmail as jest.Mock).mockRejectedValue(new Error('smtp down'))

    const result = await searchNotificationModules.sendSearchNotifications()

    expect(result).toEqual({status: 'success', notified: 0, failed: 1})
    expect(mockPg.none).not.toBeCalled() // no watermark, so the search is retried
    expect(snapshotModules.promoteStagingSnapshot).not.toBeCalled()
  })

  it('promotes anyway once a failing staging snapshot gets too old', async () => {
    ;(snapshotModules.getStagingTakenAt as jest.Mock).mockResolvedValue(
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    )
    mockQueries([search(1)])
    ;(profileModules.loadProfiles as jest.Mock)
      .mockResolvedValueOnce({profiles: [profile('woman-1')]})
      .mockResolvedValueOnce({profiles: []})
    ;(helperModules.sendSearchAlertsEmail as jest.Mock).mockRejectedValue(new Error('smtp down'))

    await searchNotificationModules.sendSearchNotifications()

    expect(snapshotModules.promoteStagingSnapshot).toBeCalledTimes(1)
  })
})
