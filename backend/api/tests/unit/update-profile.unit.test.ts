jest.mock('shared/supabase/init')
jest.mock('shared/supabase/utils')
jest.mock('common/util/try-catch')
jest.mock('shared/profiles/parse-photos')
jest.mock('shared/supabase/users')

import {updateProfile} from 'api/update-profile'
import {AuthedUser} from 'api/helpers/endpoint'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUtils from 'shared/supabase/utils'
import * as supabaseUsers from 'shared/supabase/users'
import {tryCatch} from 'common/util/try-catch'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import {sqlMatch} from 'common/test-utils'

describe('updateProfiles', () => {
  let mockPg: any
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

      const result = await updateProfile(mockProps, mockAuth, mockReq)

      expect(result).toBe(mockData)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select * from profiles where user_id = $1'),
        [mockAuth.uid],
      )
      expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
      expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockProps)
      expect(supabaseUsers.updateUser).toBeCalledTimes(1)
      expect(supabaseUsers.updateUser).toBeCalledWith(expect.any(Object), mockAuth.uid, {
        avatarUrl: mockProps.pinned_url,
      })
      expect(supabaseUtils.update).toBeCalledTimes(1)
      expect(supabaseUtils.update).toBeCalledWith(
        expect.any(Object),
        'profiles',
        'user_id',
        expect.any(Object),
      )
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the profile does not exist', async () => {
      const mockProps = {
        avatar_url: 'mockAvatarUrl',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValue({data: false})

      expect(updateProfile(mockProps, mockAuth, mockReq)).rejects.toThrow('Profile not found')
    })

    it('should throw if unable to update the profile', async () => {
      const mockProps = {
        avatar_url: 'mockAvatarUrl',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock)
        .mockResolvedValueOnce({data: true})
        .mockResolvedValueOnce({data: null, error: Error})

      expect(updateProfile(mockProps, mockAuth, mockReq)).rejects.toThrow('Error updating profile')
    })
  })
})
