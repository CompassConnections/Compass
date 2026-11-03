jest.mock('shared/supabase/init')
jest.mock('shared/supabase/utils')
jest.mock('common/util/try-catch')
jest.mock('shared/compatibility/compute-scores')
jest.mock('shared/profiles/parse-photos')
jest.mock('shared/supabase/users')
jest.mock('api/update-options')

import {AuthedUser} from 'api/helpers/endpoint'
import {setProfileOptions} from 'api/update-options'
import {updateProfileEndpoint} from 'api/update-profile'
import {sqlMatch} from 'common/test-utils'
import {tryCatch} from 'common/util/try-catch'
import {recomputeCompatibilityScoresForUser} from 'shared/compatibility/compute-scores'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUsers from 'shared/supabase/users'
import * as supabaseUtils from 'shared/supabase/utils'

describe('updateProfiles', () => {
  let mockPg: any
  let mockTx: any
  beforeEach(() => {
    jest.resetAllMocks()
    mockTx = {none: jest.fn(), one: jest.fn()}
    mockPg = {
      oneOrNone: jest.fn(),
      tx: jest.fn(async (cb: (t: any) => Promise<any>) => await cb(mockTx)),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should update an existing profile when provided the user id', async () => {
      const mockProps = {
        pinned_url: 'mockAvatarUrl',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockData = 'success'

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: true})
        .mockResolvedValueOnce({data: mockData, error: null})

      const result: any = await updateProfileEndpoint(mockProps, mockAuth, mockReq)

      expect(result.result).toBe(mockData)
      // Profile fields are compatibility factors, so the pair cache follows the edit.
      await result.continue()
      expect(recomputeCompatibilityScoresForUser).toBeCalledWith(mockAuth.uid)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select * from profiles where user_id = $1'),
        [mockAuth.uid],
      )
      expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
      expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockProps)
      expect(supabaseUsers.updateUserData).toBeCalledTimes(0)
      expect(supabaseUtils.update).toBeCalledTimes(0)
    })

    it('writes interests, causes and work in the same transaction as the row, and recomputes once', async () => {
      // The form used to send these as three `update-options` requests next to this one, and each
      // of the four rebuilt the pair cache: one save, four recomputes. Now they ride along.
      const mockProps = {
        gender: 'man' as const,
        interests: ['1', 'Chess'],
        causes: [],
        visibility: 'member' as const,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const existing = {id: 42, user_id: '321'}
      const updatedRow = {...existing, gender: 'man'}

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: existing})
        // Let the transaction actually run so the writes inside it can be asserted.
        .mockImplementationOnce(async (p: Promise<any>) => ({data: await p, error: null}))
      ;(supabaseUsers.updateProfile as jest.Mock).mockResolvedValue(updatedRow)

      const result: any = await updateProfileEndpoint(mockProps, mockAuth, mockReq)

      expect(result.result).toBe(updatedRow)
      expect(mockPg.tx).toBeCalledTimes(1)
      // The option lists never reach the `profiles` row: they are not columns on it.
      expect(supabaseUsers.updateProfile).toBeCalledWith(
        '321',
        {gender: 'man', visibility: 'member'},
        mockTx,
      )
      // Only the lists that were sent are rewritten; `work` was left out, so it is left alone.
      expect(setProfileOptions).toBeCalledTimes(2)
      expect(setProfileOptions).toBeCalledWith(mockTx, 42, '321', 'interests', ['1', 'Chess'])
      expect(setProfileOptions).toBeCalledWith(mockTx, 42, '321', 'causes', [])
      expect(recomputeCompatibilityScoresForUser).toBeCalledTimes(0)
      await result.continue()
      expect(recomputeCompatibilityScoresForUser).toBeCalledTimes(1)
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the profile does not exist', async () => {
      const mockProps = {
        age: 28,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValue({data: false})

      expect(updateProfileEndpoint(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Profile not found',
      )
    })

    it('should throw if unable to update the profile', async () => {
      const mockProps = {
        age: 28,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: true})
        .mockResolvedValueOnce({data: null, error: Error})

      expect(updateProfileEndpoint(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Error updating profile',
      )
    })
  })
})
