jest.mock('shared/supabase/init')

import * as freeLikeModule from 'api/has-free-like'
import {AuthedUser} from 'api/helpers/endpoint'
import * as supabaseInit from 'shared/supabase/init'

describe('hasFreeLike', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return if the user has a free like', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockProps = {} as any

      jest.spyOn(freeLikeModule, 'getHasFreeLike')
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

      const result: any = await freeLikeModule.hasFreeLike(mockProps, mockAuth, mockReq)

      expect(result.status).toBe('success')
      expect(result.hasFreeLike).toBeTruthy()
      expect(freeLikeModule.getHasFreeLike).toBeCalledTimes(1)
      expect(freeLikeModule.getHasFreeLike).toBeCalledWith(mockAuth.uid)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(expect.stringContaining('from profile_likes'), [
        mockAuth.uid,
      ])
    })

    it('should return if the user does not have a free like', async () => {
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockProps = {} as any

      jest.spyOn(freeLikeModule, 'getHasFreeLike')
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(true)

      const result: any = await freeLikeModule.hasFreeLike(mockProps, mockAuth, mockReq)

      expect(result.hasFreeLike).toBeFalsy()
    })
  })
})
