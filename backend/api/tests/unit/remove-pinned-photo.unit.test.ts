jest.mock('shared/supabase/init')
jest.mock('shared/helpers/auth')
jest.mock('common/util/try-catch')

import {AuthedUser} from 'api/helpers/endpoint'
import {removePinnedPhoto} from 'api/remove-pinned-photo'
import {sqlMatch} from 'common/test-utils'
import {tryCatch} from 'common/util/try-catch'
import * as authHelpers from 'shared/helpers/auth'
import * as supabaseInit from 'shared/supabase/init'

describe('removePinnedPhoto', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      none: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return success', async () => {
      const mockBody = {userId: 'mockUserId'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      jest.spyOn(authHelpers, 'throwErrorIfNotMod').mockResolvedValue(undefined)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(tryCatch as jest.Mock).mockResolvedValue({error: null})

      const result: any = await removePinnedPhoto(mockBody, mockAuth, mockReq)

      expect(result.success).toBeTruthy()
      expect(authHelpers.throwErrorIfNotMod).toBeCalledTimes(1)
      expect(authHelpers.throwErrorIfNotMod).toBeCalledWith(mockAuth.uid)
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(
        sqlMatch('update profiles set pinned_url = null where user_id = $1'),
        [mockBody.userId],
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if user auth is not an admin', async () => {
      const mockBody = {userId: 'mockUserId'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      jest
        .spyOn(authHelpers, 'throwErrorIfNotMod')
        .mockRejectedValue(
          new Error('User 321 must be an admin or trusted to perform this action.'),
        )

      expect(removePinnedPhoto(mockBody, mockAuth, mockReq)).rejects.toThrow(
        'User 321 must be an admin or trusted to perform this action.',
      )
    })

    it('should throw if failed to remove the pinned photo', async () => {
      const mockBody = {userId: 'mockUserId'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      jest.spyOn(authHelpers, 'throwErrorIfNotMod').mockResolvedValue(undefined)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(tryCatch as jest.Mock).mockResolvedValue({error: Error})

      expect(removePinnedPhoto(mockBody, mockAuth, mockReq)).rejects.toThrow(
        'Failed to remove pinned photo',
      )
    })
  })
})
