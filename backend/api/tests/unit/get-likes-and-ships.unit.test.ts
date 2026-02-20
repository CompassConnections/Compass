jest.mock('shared/supabase/init')

import * as likesAndShips from 'api/get-likes-and-ships'
import {AuthedUser} from 'api/helpers/endpoint'
import * as supabaseInit from 'shared/supabase/init'

describe('getLikesAndShips', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      map: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should get all likes recieved/given an any ships', async () => {
      const mockProps = {userId: 'mockUserId'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockLikesGiven = {
        user_id: 'mockUser_Id_likes_given',
        created_Time: 123,
      }
      const mockLikesReceived = {
        user_id: 'mockUser_Id_likes_received',
        created_Time: 1234,
      }
      const mockShips = {
        creator_id: 'mockCreatorId',
        target_id: 'mockTargetId',
        target1_id: 'mockTarget1Id',
        target2_id: 'mockTarget2Id',
        target3_id: 'mockTarget3Id',
        created_time: 12345,
      }

      jest.spyOn(likesAndShips, 'getLikesAndShipsMain')
      ;(mockPg.map as jest.Mock)
        .mockResolvedValueOnce(mockLikesGiven)
        .mockResolvedValueOnce(mockLikesReceived)
        .mockResolvedValueOnce(mockShips)

      const result: any = await likesAndShips.getLikesAndShips(mockProps, mockAuth, mockReq)
      const [sql1, _params1, _fn1] = (mockPg.map as jest.Mock).mock.calls[0]
      const [sql2, _params2, _fn2] = (mockPg.map as jest.Mock).mock.calls[1]
      const [sql3, _params3, _fn3] = (mockPg.map as jest.Mock).mock.calls[2]

      expect(result.status).toBe('success')
      expect(result.likesGiven).toBe(mockLikesGiven)
      expect(result.likesReceived).toBe(mockLikesReceived)
      expect(result.ships).toBe(mockShips)

      expect(likesAndShips.getLikesAndShipsMain).toBeCalledTimes(1)
      expect(likesAndShips.getLikesAndShipsMain).toBeCalledWith(mockProps.userId)
      expect(mockPg.map).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(sql1),
        [mockProps.userId],
        expect.any(Function),
      )
      expect(mockPg.map).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(sql2),
        [mockProps.userId],
        expect.any(Function),
      )
      expect(mockPg.map).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining(sql3),
        [mockProps.userId],
        expect.any(Function),
      )
    })
  })
})
