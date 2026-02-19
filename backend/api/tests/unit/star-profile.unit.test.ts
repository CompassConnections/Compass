import {sqlMatch} from 'common/test-utils'
import {AuthedUser} from 'api/helpers/endpoint'
import {starProfile} from 'api/star-profile'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUtils from 'shared/supabase/utils'

jest.mock('common/util/try-catch')
jest.mock('shared/supabase/init')
jest.mock('shared/supabase/utils')

describe('startProfile', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      none: jest.fn(),
      oneOrNone: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return success when trying to star a profile for the first time', async () => {
      const mockProps = {
        targetUserId: 'mockTargetUserId',
        remove: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)
      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: null})
        .mockResolvedValueOnce({error: null})
      ;(supabaseUtils.insert as jest.Mock).mockReturnValue(null)

      const result: any = await starProfile(mockProps, mockAuth, mockReq)

      expect(result.status).toBe('success')
      expect(tryCatch).toBeCalledTimes(2)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select * from profile_stars where creator_id = $1 and target_id = $2'),
        [mockAuth.uid, mockProps.targetUserId],
      )
      expect(supabaseUtils.insert).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledWith(expect.any(Object), 'profile_stars', {
        creator_id: mockAuth.uid,
        target_id: mockProps.targetUserId,
      })
    })

    it('should return success if the profile already has a star', async () => {
      const mockProps = {
        targetUserId: 'mockTargetUserId',
        remove: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockExisting = {
        created_time: 'mockCreatedTime',
        creator_id: 'mockCreatorId',
        star_id: 'mockStarId',
        target_id: 'mockTarget',
      }

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: mockExisting})

      const result: any = await starProfile(mockProps, mockAuth, mockReq)

      expect(result.status).toBe('success')
      expect(tryCatch).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(supabaseUtils.insert).not.toBeCalledTimes(1)
    })

    it('should return success when trying to remove a star', async () => {
      const mockProps = {
        targetUserId: 'mockTargetUserId',
        remove: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(tryCatch as jest.Mock).mockResolvedValue({error: null})

      const result: any = await starProfile(mockProps, mockAuth, mockReq)

      expect(result.status).toBe('success')
      expect(tryCatch).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(
        sqlMatch('delete from profile_stars where creator_id = $1 and target_id = $2'),
        [mockAuth.uid, mockProps.targetUserId],
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if unable to remove star', async () => {
      const mockProps = {
        targetUserId: 'mockTargetUserId',
        remove: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(tryCatch as jest.Mock).mockResolvedValueOnce({error: Error})

      expect(starProfile(mockProps, mockAuth, mockReq)).rejects.toThrow('Failed to remove star')
    })

    it('should throw if unable to add a star', async () => {
      const mockProps = {
        targetUserId: 'mockTargetUserId',
        remove: false,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(null)
      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: null})
        .mockResolvedValueOnce({error: Error})
      ;(supabaseUtils.insert as jest.Mock).mockReturnValue(null)

      expect(starProfile(mockProps, mockAuth, mockReq)).rejects.toThrow('Failed to add star')
    })
  })
})
