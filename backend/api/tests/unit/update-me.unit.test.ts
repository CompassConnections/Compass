jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('shared/supabase/users')
jest.mock('shared/websockets/helpers')

import {AuthedUser} from 'api/helpers/endpoint'
import {updateMe} from 'api/update-me'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUsers from 'shared/supabase/users'
import * as sharedUtils from 'shared/utils'
import * as websocketHelperModules from 'shared/websockets/helpers'

describe('updateMe', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      oneOrNone: jest.fn(),
      none: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should update user information', async () => {
      const mockProps = {
        name: 'mockName',
        username: 'mockUsername',
        avatarUrl: 'mockAvatarUrl',
        link: {mockLink: 'mockLinkValue'},
      } as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockData = {link: mockProps.link}

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(true)
      ;(sharedUtils.getUserByUsername as jest.Mock).mockReturnValue(false)
      ;(supabaseUsers.updateUser as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockData)
      ;(mockPg.none as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null)
      ;(websocketHelperModules.broadcastUpdatedUser as jest.Mock).mockReturnValue(null)

      await updateMe(mockProps, mockAuth, mockReq)

      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(sharedUtils.getUserByUsername).toBeCalledTimes(1)
      expect(sharedUtils.getUserByUsername).toBeCalledWith(mockProps.username)
      expect(supabaseUsers.updateUser).toBeCalledTimes(2)
      expect(supabaseUsers.updateUser).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        mockAuth.uid,
        {},
      )
      expect(supabaseUsers.updateUser).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        mockAuth.uid,
        {avatarUrl: mockProps.avatarUrl},
      )
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch('update users'), {
        adds: expect.any(Object),
        removes: expect.any(Array),
        id: mockAuth.uid,
      })
      expect(mockPg.none).toBeCalledTimes(2)
      expect(mockPg.none).toHaveBeenNthCalledWith(
        1,
        sqlMatch(`update users
                        set name = $1
                        where id = $2`),
        [mockProps.name, mockAuth.uid],
      )
      expect(mockPg.none).toHaveBeenNthCalledWith(
        2,
        sqlMatch(`update users
                        set username = $1
                        where id = $2`),
        [mockProps.username, mockAuth.uid],
      )
      expect(websocketHelperModules.broadcastUpdatedUser).toBeCalledTimes(1)
      expect(websocketHelperModules.broadcastUpdatedUser).toBeCalledWith({
        ...mockProps,
        id: mockAuth.uid,
      })
    })
  })
  describe('when an error occurs', () => {
    it('should throw if no account was found', async () => {
      const mockProps = {} as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(false)

      expect(updateMe(mockProps, mockAuth, mockReq)).rejects.toThrow('Your account was not found')
    })

    it('should throw if the username is invalid', async () => {
      const mockProps = {
        name: 'mockName',
        username: ';#',
        avatarUrl: 'mockAvatarUrl',
        link: {mockLink: 'mockLinkValue'},
      } as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(true)

      expect(updateMe(mockProps, mockAuth, mockReq)).rejects.toThrow('Invalid username')
    })

    it('should throw if the username is reserved', async () => {
      const mockProps = {
        name: 'mockName',
        username: 'mockUsername',
        avatarUrl: 'mockAvatarUrl',
        link: {mockLink: 'mockLinkValue'},
      } as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      const arraySpy = jest.spyOn(Array.prototype, 'includes')

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(true)
      arraySpy.mockReturnValue(true)

      expect(updateMe(mockProps, mockAuth, mockReq)).rejects.toThrow('This username is reserved')
    })

    it('should throw if the username is taken', async () => {
      const mockProps = {
        name: 'mockName',
        username: 'mockUsername',
        avatarUrl: 'mockAvatarUrl',
        link: {mockLink: 'mockLinkValue'},
      } as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const arraySpy = jest.spyOn(Array.prototype, 'includes')

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(true)
      arraySpy.mockReturnValue(false)
      ;(sharedUtils.getUserByUsername as jest.Mock).mockReturnValue(true)

      expect(updateMe(mockProps, mockAuth, mockReq)).rejects.toThrow('Username already taken')
    })
  })
})
