import {deleteMe} from 'api/delete-me'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import * as firebaseAdmin from 'firebase-admin'
import * as firebaseUtils from 'shared/firebase-utils'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'

jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}))
jest.mock('shared/firebase-utils')

describe('deleteMe', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      none: jest.fn(),
      tx: jest.fn((callback) => callback(mockPg)),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should delete the user account from supabase and firebase', async () => {
      const mockUser = {
        id: 'mockId',
        username: 'mockUsername',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockRef = {
        reasonCategory: 'someReasonCategory',
        reasonDetails: 'someReasonDetails',
      } as any

      const mockDeleteUser = jest.fn().mockResolvedValue(null)
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(firebaseUtils.deleteUserFiles as jest.Mock).mockResolvedValue(null)
      ;(firebaseAdmin.auth as jest.Mock).mockReturnValue({
        deleteUser: mockDeleteUser,
      })
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})

      await deleteMe(mockRef, mockAuth, mockRef)

      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(mockPg.none).toBeCalledTimes(3)
      expect(mockPg.none).toHaveBeenNthCalledWith(
        1,
        sqlMatch(
          'INSERT INTO deleted_users (username, reason_category, reason_details, follow_up_email)',
        ),
        // No consent given, so no address is kept.
        [mockUser.username, mockRef.reasonCategory, mockRef.reasonDetails, null],
      )
      expect(mockPg.none).toHaveBeenNthCalledWith(2, sqlMatch('update search_alert_sends'), [
        mockUser.id,
      ])
      expect(mockPg.none).toHaveBeenNthCalledWith(3, sqlMatch('DELETE FROM users WHERE id = $1'), [
        mockUser.id,
      ])
      expect(firebaseUtils.deleteUserFiles).toBeCalledTimes(1)
      expect(firebaseUtils.deleteUserFiles).toBeCalledWith(mockUser.username, mockUser.id)
      expect(mockDeleteUser).toBeCalledTimes(1)
      expect(mockDeleteUser).toBeCalledWith(mockUser.id)

      expect(debugSpy).toBeCalledWith(expect.stringContaining(mockUser.id))
    })
  })
  describe('the follow-up email', () => {
    const mockUser = {id: 'mockId', username: 'mockUsername'}
    const mockAuth = {uid: '321'} as AuthedUser

    const run = async (props: any) => {
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(sharedUtils.getPrivateUser as jest.Mock).mockResolvedValue({email: 'a@example.com'})
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(firebaseUtils.deleteUserFiles as jest.Mock).mockResolvedValue(null)
      ;(firebaseAdmin.auth as jest.Mock).mockReturnValue({
        deleteUser: jest.fn().mockResolvedValue(null),
      })
      jest.spyOn(console, 'debug').mockImplementation(() => {})
      await deleteMe(props, mockAuth, {} as any)
      return (mockPg.none as jest.Mock).mock.calls[0][1][3]
    }

    it('keeps the address when they found someone here and asked for it', async () => {
      const kept = await run({
        reasonCategory: 'found_connection_on_compass',
        followUpEmailConsent: true,
      })
      expect(kept).toBe('a@example.com')
    })

    it('keeps nothing without consent', async () => {
      const kept = await run({reasonCategory: 'found_connection_on_compass'})
      expect(kept).toBeNull()
      expect(sharedUtils.getPrivateUser).not.toBeCalled()
    })

    it('keeps nothing for any other reason, even with the flag set', async () => {
      const kept = await run({reasonCategory: 'other', followUpEmailConsent: true})
      expect(kept).toBeNull()
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the user account was not found', async () => {
      const _mockUser = {
        id: 'mockId',
        username: 'mockUsername',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockRef = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(null)

      expect(deleteMe(mockRef, mockAuth, mockRef)).rejects.toThrow('Your account was not found')
    })

    it('should throw an error if there is no userId', async () => {
      const mockUser = {
        username: 'mockUsername',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockRef = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)

      expect(deleteMe(mockRef, mockAuth, mockRef)).rejects.toThrow('Invalid user ID')
    })

    it('should throw if unable to remove user from firebase auth', async () => {
      const mockUser = {
        id: 'mockId',
        username: 'mockUsername',
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockRef = {} as any

      const mockDeleteUser = jest.fn().mockRejectedValue(new Error('Error during deletion'))
      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)
      ;(firebaseUtils.deleteUserFiles as jest.Mock).mockResolvedValue(null)
      ;(firebaseAdmin.auth as jest.Mock).mockReturnValue({
        deleteUser: mockDeleteUser,
      })
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await deleteMe(mockRef, mockAuth, mockRef)

      expect(errorSpy).toBeCalledWith(
        expect.stringContaining('Error deleting user from Firebase Auth:'),
        expect.any(Error),
      )
    })
  })
})
