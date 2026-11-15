jest.mock('shared/supabase/init')
jest.mock('api/helpers/blocks')
jest.mock('shared/utils')
jest.mock('api/helpers/profile-access', () => ({
  ...jest.requireActual('api/helpers/profile-access'),
  getProfileAccessRow: jest.fn(),
  hasWrittenTo: jest.fn(),
  haveConversation: jest.fn(),
  notifyProfileAccess: jest.fn(),
}))

import {AuthedUser} from 'api/helpers/endpoint'
import * as access from 'api/helpers/profile-access'
import {requestProfileAccess} from 'api/request-profile-access'
import {setProfileAccess} from 'api/set-profile-access'
import {DAY_MS} from 'common/util/time'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'

const auth = {uid: 'viewer'} as AuthedUser
const req = {} as any
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS)

describe('profile access', () => {
  let mockPg: any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest
        .fn()
        .mockResolvedValue({field_visibility: {neurotype: 'connected'}, disabled: false}),
      none: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    // The owner has written to the requester, unless a test says otherwise.
    ;(access.hasWrittenTo as jest.Mock).mockResolvedValue(true)
    // …the two are in a conversation, and the other member exists.
    ;(access.haveConversation as jest.Mock).mockResolvedValue(true)
    ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({id: 'viewer'})
  })

  describe('requestProfileAccess', () => {
    it('stores a first request and tells the owner', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue(null)

      const result = await requestProfileAccess({userId: 'owner'}, auth, req)

      expect(result).toEqual({status: 'requested'})
      expect(mockPg.none).toHaveBeenCalledWith(
        expect.stringContaining('insert into profile_access'),
        ['owner', 'viewer'],
      )
      expect(access.notifyProfileAccess).toHaveBeenCalledWith('requested', 'viewer', 'owner')
    })

    it('refuses when the member keeps nothing for approved people', async () => {
      mockPg.oneOrNone.mockResolvedValue({field_visibility: {bio: 'only_me'}, disabled: false})

      await expect(requestProfileAccess({userId: 'owner'}, auth, req)).rejects.toThrow(
        'not taking requests',
      )
      expect(mockPg.none).not.toHaveBeenCalled()
    })

    it('refuses a request to someone who has never written to you, and stores nothing', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue(null)
      ;(access.hasWrittenTo as jest.Mock).mockResolvedValue(false)

      await expect(requestProfileAccess({userId: 'owner'}, auth, req)).rejects.toThrow(
        'has written to you',
      )
      expect(access.hasWrittenTo).toHaveBeenCalledWith('owner', 'viewer')
      expect(mockPg.none).not.toHaveBeenCalled()
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })

    it('refuses a request to yourself', async () => {
      await expect(requestProfileAccess({userId: 'viewer'}, auth, req)).rejects.toThrow()
    })

    it('answers the same for a pending request, and does not notify again', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({
        status: 'requested',
        decided_time: null,
      })

      expect(await requestProfileAccess({userId: 'owner'}, auth, req)).toEqual({
        status: 'requested',
      })
      expect(mockPg.none).not.toHaveBeenCalled()
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })

    it('looks unchanged after a silent decline, and stays silent inside the waiting period', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({
        status: 'requested',
        decided_time: daysAgo(access.REQUEST_AGAIN_AFTER_DAYS - 1),
      })

      expect(await requestProfileAccess({userId: 'owner'}, auth, req)).toEqual({
        status: 'requested',
      })
      expect(mockPg.none).not.toHaveBeenCalled()
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })

    it('reaches the owner again once the waiting period has passed', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({
        status: 'requested',
        decided_time: daysAgo(access.REQUEST_AGAIN_AFTER_DAYS + 1),
      })

      await requestProfileAccess({userId: 'owner'}, auth, req)

      expect(mockPg.none).toHaveBeenCalledWith(expect.stringContaining('decided_time = null'), [
        'owner',
        'viewer',
      ])
      expect(access.notifyProfileAccess).toHaveBeenCalledWith('requested', 'viewer', 'owner')
    })

    it('turns a removed member asking again into a request already set aside', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({
        status: 'removed',
        decided_time: daysAgo(1),
      })

      expect(await requestProfileAccess({userId: 'owner'}, auth, req)).toEqual({
        status: 'requested',
      })
      expect(mockPg.none).toHaveBeenCalledTimes(1)
      expect(mockPg.none.mock.calls[0][0]).toContain("set status = 'requested'")
      // Inside the waiting period, so the owner is not told.
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })

    it('reports an existing approval without touching it', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({status: 'approved'})

      expect(await requestProfileAccess({userId: 'owner'}, auth, req)).toEqual({
        status: 'approved',
      })
      expect(mockPg.none).not.toHaveBeenCalled()
    })
  })

  describe('setProfileAccess', () => {
    const owner = {uid: 'owner'} as AuthedUser

    it('approves, with or without a request, and tells the other person', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue(null)

      const result = await setProfileAccess({userId: 'viewer', action: 'approve'}, owner, req)

      expect(result).toEqual({status: 'approved'})
      expect(mockPg.none).toHaveBeenCalledWith(expect.stringContaining(`'approved'`), [
        'owner',
        'viewer',
      ])
      expect(access.notifyProfileAccess).toHaveBeenCalledWith('approved', 'owner', 'viewer')
    })

    it('refuses to add a stranger: no request, no earlier membership, no conversation', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue(null)
      ;(access.haveConversation as jest.Mock).mockResolvedValue(false)

      await expect(
        setProfileAccess({userId: 'viewer', action: 'approve'}, owner, req),
      ).rejects.toThrow('conversation going')
      expect(mockPg.none).not.toHaveBeenCalled()
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })

    it('adds someone who asked, without needing a conversation', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({
        status: 'requested',
        decided_time: null,
      })
      ;(access.haveConversation as jest.Mock).mockResolvedValue(false)

      expect(await setProfileAccess({userId: 'viewer', action: 'approve'}, owner, req)).toEqual({
        status: 'approved',
      })
      expect(access.notifyProfileAccess).toHaveBeenCalledWith('approved', 'owner', 'viewer')
    })

    it('answers 404 for a member who does not exist', async () => {
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(null)

      await expect(
        setProfileAccess({userId: 'nobody', action: 'approve'}, owner, req),
      ).rejects.toThrow('does not exist')
      expect(mockPg.none).not.toHaveBeenCalled()
    })

    it('re-adds someone just removed without telling them again', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({
        status: 'removed',
        decided_time: daysAgo(1),
      })

      expect(await setProfileAccess({userId: 'viewer', action: 'approve'}, owner, req)).toEqual({
        status: 'approved',
      })
      expect(mockPg.none).toHaveBeenCalledTimes(1)
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })

    it('tells them again when they come back after the waiting period', async () => {
      ;(access.getProfileAccessRow as jest.Mock).mockResolvedValue({
        status: 'removed',
        decided_time: daysAgo(access.REQUEST_AGAIN_AFTER_DAYS + 1),
      })

      await setProfileAccess({userId: 'viewer', action: 'approve'}, owner, req)
      expect(access.notifyProfileAccess).toHaveBeenCalledWith('approved', 'owner', 'viewer')
    })

    it('removes by marking the row, keeping it, silently', async () => {
      const result = await setProfileAccess({userId: 'viewer', action: 'revoke'}, owner, req)

      expect(result).toEqual({status: 'none'})
      const [sql, params] = mockPg.none.mock.calls[0]
      expect(sql).toContain("set status = 'removed'")
      expect(sql).not.toContain('delete')
      expect(params).toEqual(['owner', 'viewer'])
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })

    it('dismisses a request by marking it decided, leaving it in place, silently', async () => {
      await setProfileAccess({userId: 'viewer', action: 'dismiss'}, owner, req)

      const [sql] = mockPg.none.mock.calls[0]
      expect(sql).toContain('set decided_time = now()')
      expect(sql).not.toContain('delete')
      expect(access.notifyProfileAccess).not.toHaveBeenCalled()
    })
  })
})
