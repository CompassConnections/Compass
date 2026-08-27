jest.mock('shared/supabase/init')
jest.mock('shared/outreach/local-density')
jest.mock('shared/outreach/sends')
jest.mock('email/functions/helpers')
jest.mock('shared/supabase/notifications')
jest.mock('shared/utils')

import {sendCityNumberEmails} from 'api/send-city-number-emails'
import {sendEmptyRoomEmails} from 'api/send-empty-room-emails'
import {OUTREACH_MIN_DAYS_SINCE_SIGNUP} from 'common/outreach/outreach'
import * as densityModules from 'shared/outreach/local-density'
import * as supabaseInit from 'shared/supabase/init'

/**
 * Both automated sends are once-only and irreversible, so the gate that keeps them off members who
 * joined today is asserted at the query level rather than through the send path — a member who never
 * appears in the candidate list is the only version of "not sent" that a later run cannot undo.
 */
describe('outreach emails wait out the signup window', () => {
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {manyOrNone: jest.fn().mockResolvedValue([])}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(densityModules.getLocalDensity as jest.Mock).mockResolvedValue(null)
  })

  it.each([
    ['city-number', sendCityNumberEmails],
    ['empty-room', sendEmptyRoomEmails],
  ])('%s excludes members newer than the window', async (_name, run) => {
    await run()

    const [sql, params] = mockPg.manyOrNone.mock.calls[0]
    expect(sql).toContain('u.created_time < now() - make_interval(days => $(minDaysSinceSignup))')
    expect(params.minDaysSinceSignup).toBe(OUTREACH_MIN_DAYS_SINCE_SIGNUP)
  })

  it('waits at least a few days, so signup day is never a send day', () => {
    expect(OUTREACH_MIN_DAYS_SINCE_SIGNUP).toBeGreaterThanOrEqual(3)
  })
})
