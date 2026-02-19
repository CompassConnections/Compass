jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('shared/profiles/parse-photos')
jest.mock('shared/supabase/users')
jest.mock('shared/supabase/utils')
jest.mock('common/util/try-catch')
jest.mock('shared/analytics')
jest.mock('common/discord/core')
jest.mock('common/util/time')

import {createProfile} from 'api/create-profile'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'
import * as supabaseUsers from 'shared/supabase/users'
import * as supabaseUtils from 'shared/supabase/utils'
import {tryCatch} from 'common/util/try-catch'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import * as sharedAnalytics from 'shared/analytics'
import {sendDiscordMessage} from 'common/discord/core'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'

describe('createProfile', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
      one: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully create a profile', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockNProfiles = 10
      const mockData = {
        age: 30,
        city: 'mockCity',
      }
      const mockUser = {
        createdTime: Date.now(),
        name: 'mockName',
        username: 'mockUserName',
      }

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: false, error: null})
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null})

      const results: any = await createProfile(mockBody, mockAuth, mockReq)

      expect(results.result).toEqual(mockData)
      expect(tryCatch).toBeCalledTimes(2)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('select id from profiles where user_id = $1'),
        [mockAuth.uid],
      )
      expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
      expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockBody)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(supabaseUsers.updateUser).toBeCalledTimes(1)
      expect(supabaseUsers.updateUser).toBeCalledWith(expect.any(Object), mockAuth.uid, {
        avatarUrl: mockBody.pinned_url,
      })
      expect(supabaseUtils.insert).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledWith(
        expect.any(Object),
        'profiles',
        expect.objectContaining({user_id: mockAuth.uid}),
      )
      ;(mockPg.one as jest.Mock).mockReturnValue(mockNProfiles)

      await results.continue()

      expect(sharedAnalytics.track).toBeCalledTimes(1)
      expect(sharedAnalytics.track).toBeCalledWith(mockAuth.uid, 'create profile', {
        username: mockUser.username,
      })
      expect(sendDiscordMessage).toBeCalledTimes(1)
      expect(sendDiscordMessage).toBeCalledWith(
        expect.stringContaining(mockUser.name && mockUser.username),
        'members',
      )
    })

    it('should successfully create milestone profile', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockNProfiles = 15
      const mockData = {
        age: 30,
        city: 'mockCity',
      }
      const mockUser = {
        createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
        name: 'mockName',
        username: 'mockUserName',
      }

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: false, error: null})
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null})

      const results: any = await createProfile(mockBody, mockAuth, mockReq)

      expect(results.result)
        .toEqual(mockData)(mockPg.one as jest.Mock)
        .mockReturnValue(mockNProfiles)

      await results.continue()

      expect(mockPg.one).toBeCalledTimes(1)
      expect(mockPg.one).toBeCalledWith(
        sqlMatch('SELECT count(*) FROM profiles'),
        [],
        expect.any(Function),
      )
      expect(sendDiscordMessage).toBeCalledTimes(2)
      expect(sendDiscordMessage).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(String(mockNProfiles)),
        'general',
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if it failed to track create profile', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockData = {
        age: 30,
        city: 'mockCity',
      }
      const mockUser = {
        createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
        name: 'mockName',
        username: 'mockUserName',
      }

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: false, error: null})
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null})

      const results: any = await createProfile(mockBody, mockAuth, mockReq)

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      ;(sharedAnalytics.track as jest.Mock).mockRejectedValue(new Error('Track error'))

      await results.continue()

      expect(errorSpy).toBeCalledWith(
        'Failed to track create profile',
        expect.objectContaining({name: 'Error'}),
      )
    })

    it('should throw if it failed to send discord new profile', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockData = {
        age: 30,
        city: 'mockCity',
      }
      const mockUser = {
        createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
        name: 'mockName',
        username: 'mockUserName',
      }

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null})
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null})

      const results: any = await createProfile(mockBody, mockAuth, mockReq)

      expect(results.result).toEqual(mockData)

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      ;(sendDiscordMessage as jest.Mock).mockRejectedValue(new Error('Sending error'))

      await results.continue()

      expect(errorSpy).toBeCalledWith(
        'Failed to send discord new profile',
        expect.objectContaining({name: 'Error'}),
      )
    })

    it('should throw if it failed to send discord user milestone', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockNProfiles = 15
      const mockData = {
        age: 30,
        city: 'mockCity',
      }
      const mockUser = {
        createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
        name: 'mockName',
        username: 'mockUserName',
      }

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null})
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null})

      const results: any = await createProfile(mockBody, mockAuth, mockReq)

      expect(results.result).toEqual(mockData)

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      ;(sendDiscordMessage as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error('Discord error'))(mockPg.one as jest.Mock)
        .mockReturnValue(mockNProfiles)

      await results.continue()

      expect(sendDiscordMessage).toBeCalledTimes(2)
      expect(sendDiscordMessage).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(String(mockNProfiles)),
        'general',
      )
      expect(errorSpy).toBeCalledWith(
        'Failed to send discord user milestone',
        expect.objectContaining({name: 'Error'}),
      )
    })

    it('should throw if the user already exists', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: true, error: null})

      await expect(createProfile(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        'User already exists',
      )
    })

    it('should throw if unable to find the account', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null})
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(false)

      await expect(createProfile(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        'Your account was not found',
      )
    })

    it('should throw if anything unexpected happens when creating the user', async () => {
      const mockBody = {
        city: 'mockCity',
        gender: 'mockGender',
        looking_for_matches: true,
        photo_urls: ['mockPhotoUrl1'],
        pinned_url: 'mockPinnedUrl',
        pref_gender: ['mockPrefGender'],
        pref_relation_styles: ['mockPrefRelationStyles'],
        visibility: 'public' as 'public' | 'member',
        wants_kids_strength: 2,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockUser = {
        createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
        name: 'mockName',
        username: 'mockUserName',
      }

      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null})
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: Error})

      await expect(createProfile(mockBody, mockAuth, mockReq)).rejects.toThrowError(
        'Error creating user',
      )
    })
  })
})
