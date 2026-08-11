jest.mock('shared/supabase/init')
jest.mock('common/envs/constants')

import {getOutreachStats} from 'api/get-outreach-stats'
import {AuthedUser} from 'api/helpers/endpoint'
import * as constants from 'common/envs/constants'
import {OUTREACH_STAGES, OutreachStats} from 'common/outreach/outreach'
import * as supabaseInit from 'shared/supabase/init'

/** Counts come back from pg as strings; the mapping has to survive that. */
const bucket = (name: string, counts: [number, number, number, number, number]) => ({
  bucket: name,
  members: String(counts[0]),
  replied_to_us: String(counts[1]),
  messaged_member: String(counts[2]),
  heard_from_member: String(counts[3]),
  brought_someone: String(counts[4]),
})

describe('getOutreachStats', () => {
  let mockPg = {} as any
  const mockAuth = {uid: 'admin-1'} as AuthedUser
  const mockReq = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {any: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(constants.isAdminId as jest.Mock).mockReturnValue(true)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('rejects non-admins', async () => {
    ;(constants.isAdminId as jest.Mock).mockReturnValue(false)

    await expect(getOutreachStats({}, mockAuth, mockReq)).rejects.toThrow('Admin only')
    expect(mockPg.any).not.toBeCalled()
  })

  it('returns every stage, zero-filled, in sequence order', async () => {
    ;(mockPg.any as jest.Mock).mockResolvedValue([bucket('stage:replied', [4, 3, 2, 1, 0])])

    const result = (await getOutreachStats({}, mockAuth, mockReq)) as OutreachStats

    expect(result.stages.map((s) => s.stage)).toEqual([...OUTREACH_STAGES])
    expect(result.stages.find((s) => s.stage === 'replied')).toEqual({
      stage: 'replied',
      members: 4,
      repliedToUs: 3,
      messagedMember: 2,
      heardFromMember: 1,
      broughtSomeone: 0,
    })
    // A stage nobody has reached is a fact about the funnel, not a row to hide.
    expect(result.stages.find((s) => s.stage === 'nudged')).toEqual({
      stage: 'nudged',
      members: 0,
      repliedToUs: 0,
      messagedMember: 0,
      heardFromMember: 0,
      broughtSomeone: 0,
    })
  })

  it('keeps send kinds that have gone out and drops the ones that have not', async () => {
    ;(mockPg.any as jest.Mock).mockResolvedValue([
      bucket('stage:not_started', [10, 0, 2, 3, 0]),
      bucket('send:city_number', [6, 1, 4, 2, 1]),
    ])

    const result = (await getOutreachStats({}, mockAuth, mockReq)) as OutreachStats

    expect(result.sends).toEqual([
      {
        kind: 'city_number',
        members: 6,
        repliedToUs: 1,
        messagedMember: 4,
        heardFromMember: 2,
        broughtSomeone: 1,
      },
    ])
  })

  it('scopes the query to the calling admin', async () => {
    ;(mockPg.any as jest.Mock).mockResolvedValue([])

    await getOutreachStats({}, mockAuth, mockReq)

    expect(mockPg.any).toBeCalledWith(expect.any(String), {adminId: 'admin-1'})
  })
})
