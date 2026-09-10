jest.mock('shared/supabase/init')
jest.mock('shared/supabase/utils')
jest.mock('common/supabase/users')
jest.mock('email/functions/helpers')
jest.mock('api/set-last-online-time')
jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    getUser: jest.fn(),
  })),
}))
jest.mock('shared/utils')
jest.mock('shared/analytics')
jest.mock('shared/firebase-utils')
jest.mock('shared/helpers/generate-and-update-avatar-urls')
jest.mock('common/util/object')
jest.mock('common/user-notification-preferences')
jest.mock('common/util/clean-username')
jest.mock('shared/monitoring/log')
jest.mock('common/hosting/constants')
jest.mock('shared/profiles/parse-photos')
jest.mock('common/discord/core')
jest.mock('common/util/try-catch')
jest.mock('common/util/time')
jest.mock('api/validate-username')
jest.mock('common/logger')
jest.mock('shared/moderation/vpn-check')
jest.mock('shared/supabase/users')

import {createUserAndProfile} from 'api/create-user-and-profile'
import {AuthedUser} from 'api/helpers/endpoint'
import * as apiSetLastTimeOnline from 'api/set-last-online-time'
import * as validateUsernameModule from 'api/validate-username'
import {sendDiscordMessage} from 'common/discord/core'
import * as hostingConstants from 'common/hosting/constants'
import * as supabaseUsers from 'common/supabase/users'
import * as usernameUtils from 'common/util/clean-username'
import * as objectUtils from 'common/util/object'
import * as timeUtils from 'common/util/time'
import * as emailHelpers from 'email/functions/helpers'
import * as firebaseAdmin from 'firebase-admin'
import * as sharedAnalytics from 'shared/analytics'
import * as firebaseUtils from 'shared/firebase-utils'
import * as avatarHelpers from 'shared/helpers/generate-and-update-avatar-urls'
import * as vpnCheck from 'shared/moderation/vpn-check'
import * as parsePhotos from 'shared/profiles/parse-photos'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedSupabaseUsers from 'shared/supabase/users'
import * as supabaseUtils from 'shared/supabase/utils'
import * as sharedUtils from 'shared/utils'

describe('createUserAndProfile', () => {
  const originalIsLocal = (hostingConstants as any).IS_LOCAL
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
      one: jest.fn(),
      tx: jest.fn(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn(),
          one: jest.fn(),
        }
        return cb(mockTx)
      }),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(firebaseAdmin.auth as jest.Mock).mockReturnValue({
      getUser: jest.fn().mockResolvedValue({email: 'test@test.com'}),
    })
    ;(sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false)
    ;(vpnCheck.lookupVpnNetwork as jest.Mock).mockResolvedValue(null)
    // `common/util/object` is auto-mocked, which leaves `removeUndefinedProps` returning `undefined`.
    // It is a pure helper that always returns an object, so `undefined` is not a stand-in for
    // anything the real one can do — it is a state the handler cannot reach in production, and a test
    // that manufactures it only proves things about a function that does not exist. Default it to
    // pass-through here; the tests that care what it returned still override it.
    ;(objectUtils.removeUndefinedProps as jest.Mock).mockImplementation((o) => o)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(hostingConstants, 'IS_LOCAL', {
      value: originalIsLocal,
      writable: true,
    })
  })

  describe('when given valid input', () => {
    it('should successfully create a user and profile', async () => {
      Object.defineProperty(hostingConstants, 'IS_LOCAL', {
        value: false,
        writable: true,
      })
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'mockUsername',
        name: 'mockName',
        link: {mockLink: 'mockLinkData'},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          looking_for_matches: true,
          photo_urls: ['mockPhotoUrl1'],
          pinned_url: 'mockPinnedUrl',
          pref_gender: ['mockPrefGender'],
          pref_relation_styles: ['mockPrefRelationStyles'],
          visibility: 'public' as 'public' | 'member',
          wants_kids_strength: 2,
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        data: {mockNewUserJson: 'mockNewUserJsonData'},
        id: 'mockNewUserId',
        name: 'mockName',
        name_username_vector: 'mockNameUsernameVector',
        username: 'mockUsername',
      }
      const mockPrivateUserRow = {
        data: {mockPrivateUserJson: 'mockPrivateUserJsonData'},
        id: 'mockPrivateUserId',
      }

      const mockNewProfileRow = {
        id: 'mockProfileId',
        user_id: 'mockUserId',
        // Add other profile fields as needed for the test
      }

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(firebaseAdmin.auth as jest.Mock).mockReturnValue({
        getUser: jest.fn().mockResolvedValue({email: 'test@test.com'}),
      })
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue({
        ...mockProps.profile,
      })
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce(mockPrivateUserRow)
        .mockResolvedValueOnce(mockNewProfileRow)
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow)

      const results: any = await createUserAndProfile(mockProps, mockAuth, mockReq)

      expect(results.result.user).toEqual(mockNewUserRow)
      expect(results.result.privateUser).toEqual(mockPrivateUserRow)
      expect(usernameUtils.cleanDisplayName).toBeCalledTimes(1)
      expect(usernameUtils.cleanDisplayName).toHaveBeenCalledWith(mockProps.name)
      expect(firebaseUtils.getBucket).toBeCalledTimes(1)
      expect(avatarHelpers.generateAvatarUrl).toBeCalledTimes(0)
      expect(validateUsernameModule.validateUsername).toBeCalledTimes(1)
      expect(validateUsernameModule.validateUsername).toHaveBeenCalledWith(mockProps.username)
      expect(parsePhotos.removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
      expect(parsePhotos.removePinnedUrlFromPhotoUrls).toHaveBeenCalledWith(mockProps.profile)
      expect(mockPg.tx).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toBeCalledTimes(3)
      expect(supabaseUtils.insert).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'users',
        expect.objectContaining({
          id: mockAuth.uid,
          name: 'mockName',
          username: mockProps.username,
        }),
      )
      expect(supabaseUtils.insert).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        'private_users',
        expect.objectContaining({
          id: mockAuth.uid,
        }),
      )
      expect(supabaseUtils.insert).toHaveBeenNthCalledWith(
        3,
        expect.any(Object),
        'profiles',
        expect.objectContaining({
          user_id: mockAuth.uid,
        }),
      )
      ;(sharedAnalytics.track as jest.Mock).mockResolvedValue(null)
      ;(emailHelpers.sendWelcomeEmail as jest.Mock).mockResolvedValue(null)
      ;(apiSetLastTimeOnline.setLastOnlineTimeUser as jest.Mock).mockResolvedValue(null)
      ;(timeUtils.sleep as jest.Mock).mockResolvedValue(null)
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)
      ;(mockPg.one as jest.Mock).mockResolvedValue({count: 10})

      await results.continue()

      expect(sharedAnalytics.track).toBeCalledTimes(1)
      expect(sharedAnalytics.track).toBeCalledWith(mockAuth.uid, 'create profile', {
        username: mockNewUserRow.username,
      })
      expect(emailHelpers.sendWelcomeEmail).toBeCalledTimes(1)
      expect(emailHelpers.sendWelcomeEmail).toBeCalledWith(mockNewUserRow, mockPrivateUserRow)
      expect(apiSetLastTimeOnline.setLastOnlineTimeUser).toBeCalledTimes(1)
      expect(apiSetLastTimeOnline.setLastOnlineTimeUser).toBeCalledWith(mockAuth.uid)
      expect(sendDiscordMessage).toBeCalledTimes(1)
    })

    it('should use suggested username when provided username is invalid', async () => {
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'invalid!username',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        data: {},
        id: 'mockNewUserId',
        name: 'mockName',
        name_username_vector: 'mockNameUsernameVector',
        username: 'suggestedUsername',
      }
      const mockPrivateUserRow = {
        data: {},
        id: 'mockPrivateUserId',
      }

      const mockNewProfileRow = {
        id: 'mockProfileId',
        user_id: 'mockUserId',
      }

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({
        valid: true,
        suggestedUsername: 'suggestedUsername',
      })
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(objectUtils.removeUndefinedProps as jest.Mock)
        .mockReturnValueOnce({mockNewUserJson: 'mockNewUserJsonData'})
        .mockReturnValueOnce({mockPrivateUserJson: 'mockPrivateUserJsonData'})
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce(mockPrivateUserRow)
        .mockResolvedValueOnce(mockNewProfileRow)
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow)

      const results: any = await createUserAndProfile(mockProps, mockAuth, mockReq)

      expect(results.result.user).toEqual(mockNewUserRow)
      expect(supabaseUtils.insert).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'users',
        expect.objectContaining({
          username: 'suggestedUsername',
        }),
      )
    })

    it('should ban user from posting if device token is banned', async () => {
      const mockProps = {
        deviceToken: 'fa807d664415',
        username: 'mockUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        id: 'mockNewUserId',
        name: 'mockName',
        name_username_vector: 'mockNameUsernameVector',
        username: 'mockUsername',
        is_banned_from_posting: true,
      }
      const mockPrivateUserRow = {
        data: {},
        id: 'mockPrivateUserId',
      }

      const mockNewProfileRow = {
        id: 'mockProfileId',
        user_id: 'mockUserId',
      }

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce(mockPrivateUserRow)
        .mockResolvedValueOnce(mockNewProfileRow)
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow)

      await createUserAndProfile(mockProps, mockAuth, mockReq)

      expect(supabaseUtils.insert).toHaveBeenCalledWith(
        expect.any(Object),
        'users',
        expect.objectContaining({
          is_banned_from_posting: true,
        }),
      )
    })
  })

  describe('when the signup comes from behind a VPN', () => {
    // A real M247 address one of our confirmed-abuse accounts signed up from, and an address on an
    // ordinary network. Which one is a VPN comes from the mocked lookup — the prefix tables are
    // fetched at runtime, and covered on their own in backend/shared/tests/unit/vpn-check.
    const VPN_IP = '37.120.236.26'
    const ISP_IP = '8.8.8.8'
    const M247 = {asn: 9009, name: 'M247'}

    const runSignup = async (opts: {ip: string; email?: string}) => {
      const mockProps = {
        deviceToken: 'someUnbannedDeviceToken',
        username: 'mockUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {get: jest.fn()} as any
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        id: 'mockNewUserId',
        name: 'mockName',
        username: 'mockUsername',
      }

      ;(firebaseAdmin.auth as jest.Mock).mockReturnValue({
        getUser: jest.fn().mockResolvedValue({email: opts.email ?? 'test@test.com'}),
      })
      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(opts.ip)
      ;(vpnCheck.lookupVpnNetwork as jest.Mock).mockResolvedValue(opts.ip === VPN_IP ? M247 : null)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue({} as any)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue('mockAvatarUrl')
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce({data: {}, id: 'mockPrivateUserId'})
        .mockResolvedValueOnce({id: 'mockProfileId', user_id: 'mockUserId'})
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue({})

      return createUserAndProfile(mockProps, mockAuth, mockReq)
    }

    const runAndContinue = async (opts: {ip: string; email?: string}) => {
      const {continue: continuation} = (await runSignup(opts)) as any
      await continuation()
    }

    const holdApplied = () => (sharedSupabaseUsers.updateUser as jest.Mock).mock.calls[0]
    const reportsPost = () =>
      (sendDiscordMessage as jest.Mock).mock.calls.find((c) => c[1] === 'reports')

    it('never makes the person creating the account wait on the check', async () => {
      await runSignup({ip: VPN_IP})
      // The lookup can take ten seconds on a cold instance; it belongs after the response.
      expect(vpnCheck.lookupVpnNetwork).not.toHaveBeenCalled()
      expect(sharedSupabaseUsers.updateUser).not.toHaveBeenCalled()
    })

    it('puts the account on hold under review', async () => {
      await runAndContinue({ip: VPN_IP})
      expect(holdApplied()).toEqual([
        'mockNewUserId',
        {isBannedFromPosting: true, banReason: 'under_review'},
      ])
    })

    it('posts to the reports channel so a human picks it up', async () => {
      await runAndContinue({ip: VPN_IP})
      const post = reportsPost()
      expect(post).toBeDefined()
      expect(post[0]).toContain('M247')
      expect(post[0]).toContain(VPN_IP)
    })

    it('leaves an ordinary ISP signup alone', async () => {
      await runAndContinue({ip: ISP_IP})
      expect(sharedSupabaseUsers.updateUser).not.toHaveBeenCalled()
      expect(reportsPost()).toBeUndefined()
    })

    it('never holds an Apple Hide My Email signup, whatever the IP says', async () => {
      await runAndContinue({ip: VPN_IP, email: 'xyz123@privaterelay.appleid.com'})
      expect(sharedSupabaseUsers.updateUser).not.toHaveBeenCalled()
      expect(reportsPost()).toBeUndefined()
    })

    it('still creates the account when the hold cannot be written', async () => {
      ;(sharedSupabaseUsers.updateUser as jest.Mock).mockRejectedValue(new Error('db down'))
      await expect(runAndContinue({ip: VPN_IP})).resolves.toBeUndefined()
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the user already exists', async () => {
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'mockUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest
            .fn()
            .mockResolvedValueOnce({id: 'existingUserId'})
            .mockResolvedValueOnce({id: 'existingProfileId'}),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })

      await expect(createUserAndProfile(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'An account for this user already exists',
      )
    })

    it('should throw if the username is already taken', async () => {
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'takenUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockExistingUser = {id: 'existingUserId', username: 'takenUsername'}

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(mockExistingUser)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(mockExistingUser),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })

      await expect(createUserAndProfile(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'Username is already taken',
      )
    })

    it('should throw if username is invalid and no suggestion is provided', async () => {
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'invalid!username',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({
        valid: false,
        message: 'Invalid username',
      })
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)

      await expect(createUserAndProfile(mockProps, mockAuth, mockReq)).rejects.toThrowError(
        'Invalid username',
      )
    })

    it('should continue without throwing if tracking fails', async () => {
      Object.defineProperty(hostingConstants, 'IS_LOCAL', {
        value: false,
        writable: true,
      })
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'mockUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        data: {},
        id: 'mockNewUserId',
        name: 'mockName',
        name_username_vector: 'mockNameUsernameVector',
        username: 'mockUsername',
      }
      const mockPrivateUserRow = {
        data: {},
        id: 'mockPrivateUserId',
      }

      const mockNewProfileRow = {
        id: 'mockProfileId',
        user_id: 'mockUserId',
      }

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce(mockPrivateUserRow)
        .mockResolvedValueOnce(mockNewProfileRow)
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow)

      const results: any = await createUserAndProfile(mockProps, mockAuth, mockReq)

      ;(sharedAnalytics.track as jest.Mock).mockRejectedValue(new Error('Tracking failed'))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await results.continue()

      expect(errorSpy).toHaveBeenCalledWith('Failed to track create profile', expect.any(Error))
    })

    it('should continue without throwing if welcome email fails', async () => {
      Object.defineProperty(hostingConstants, 'IS_LOCAL', {
        value: false,
        writable: true,
      })
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'mockUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        data: {},
        id: 'mockNewUserId',
        name: 'mockName',
        name_username_vector: 'mockNameUsernameVector',
        username: 'mockUsername',
      }
      const mockPrivateUserRow = {
        data: {},
        id: 'mockPrivateUserId',
      }

      const mockNewProfileRow = {
        id: 'mockProfileId',
        user_id: 'mockUserId',
      }

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce(mockPrivateUserRow)
        .mockResolvedValueOnce(mockNewProfileRow)
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow)

      const results: any = await createUserAndProfile(mockProps, mockAuth, mockReq)

      ;(sharedAnalytics.track as jest.Mock).mockResolvedValue(null)
      ;(emailHelpers.sendWelcomeEmail as jest.Mock).mockRejectedValue(new Error('Email failed'))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await results.continue()

      expect(errorSpy).toHaveBeenCalledWith('Failed to sendWelcomeEmail', expect.any(Error))
    })

    it('should continue without throwing if set last online time fails', async () => {
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'mockUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        data: {},
        id: 'mockNewUserId',
        name: 'mockName',
        name_username_vector: 'mockNameUsernameVector',
        username: 'mockUsername',
      }
      const mockPrivateUserRow = {
        data: {},
        id: 'mockPrivateUserId',
      }

      const mockNewProfileRow = {
        id: 'mockProfileId',
        user_id: 'mockUserId',
      }

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce(mockPrivateUserRow)
        .mockResolvedValueOnce(mockNewProfileRow)
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow)

      const results: any = await createUserAndProfile(mockProps, mockAuth, mockReq)

      ;(sharedAnalytics.track as jest.Mock).mockResolvedValue(null)
      ;(emailHelpers.sendWelcomeEmail as jest.Mock).mockResolvedValue(null)
      ;(apiSetLastTimeOnline.setLastOnlineTimeUser as jest.Mock).mockRejectedValue(
        new Error('Failed to set last online time'),
      )
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await results.continue()

      expect(errorSpy).toHaveBeenCalledWith('Failed to set last online time', expect.any(Error))
    })

    it('should send milestone message when profile count reaches milestone', async () => {
      Object.defineProperty(hostingConstants, 'IS_LOCAL', {
        value: false,
        writable: true,
      })
      const mockProps = {
        deviceToken: 'mockDeviceToken',
        username: 'mockUsername',
        name: 'mockName',
        link: {},
        profile: {
          city: 'mockCity',
          gender: 'mockGender',
          visibility: 'public' as 'public' | 'member',
        },
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReferer = {
        headers: {
          referer: 'mockReferer',
        },
      }
      const mockReq = {get: jest.fn().mockReturnValue(mockReferer)} as any
      const mockIp = 'mockIP'
      const mockBucket = {} as any
      const mockAvatarUrl = 'mockGeneratedAvatarUrl'
      const mockNewUserRow = {
        created_time: 'mockCreatedTime',
        data: {},
        id: 'mockNewUserId',
        name: 'mockName',
        name_username_vector: 'mockNameUsernameVector',
        username: 'mockUsername',
      }
      const mockPrivateUserRow = {
        data: {},
        id: 'mockPrivateUserId',
      }

      const mockNewProfileRow = {
        id: 'mockProfileId',
        user_id: 'mockUserId',
      }

      ;(sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp)
      ;(usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue('mockName')
      ;(firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket)
      ;(avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl)
      ;(validateUsernameModule.validateUsername as jest.Mock).mockResolvedValue({valid: true})
      ;(parsePhotos.removePinnedUrlFromPhotoUrls as jest.Mock).mockReturnValue(mockProps.profile)
      ;(mockPg.tx as jest.Mock).mockImplementation(async (cb: any) => {
        const mockTx = {
          oneOrNone: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
          one: jest.fn(),
          manyOrNone: jest.fn().mockResolvedValue([]),
        }
        return cb(mockTx)
      })
      ;(supabaseUtils.insert as jest.Mock)
        .mockResolvedValueOnce(mockNewUserRow)
        .mockResolvedValueOnce(mockPrivateUserRow)
        .mockResolvedValueOnce(mockNewProfileRow)
      ;(supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow)
      ;(supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow)

      const results: any = await createUserAndProfile(mockProps, mockAuth, mockReq)

      ;(sharedAnalytics.track as jest.Mock).mockResolvedValue(null)
      ;(emailHelpers.sendWelcomeEmail as jest.Mock).mockResolvedValue(null)
      ;(apiSetLastTimeOnline.setLastOnlineTimeUser as jest.Mock).mockResolvedValue(null)
      ;(timeUtils.sleep as jest.Mock).mockResolvedValue(null)
      ;(sendDiscordMessage as jest.Mock).mockResolvedValue(null)
      const mockOneFn = jest.fn().mockResolvedValue({count: 50})
      mockPg.one = mockOneFn

      await results.continue()

      expect(mockOneFn).toHaveBeenCalled()
      expect(sendDiscordMessage).toHaveBeenCalledTimes(1)
    })
  })
})
