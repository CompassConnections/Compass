jest.mock('api/get-user')

import {getMe} from 'api/get-me'
import {getUser} from 'api/get-user'
import {AuthedUser} from 'api/helpers/endpoint'

describe('getMe', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should get the user', async () => {
      const mockProps = {}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(getUser as jest.Mock).mockResolvedValue(null)

      await getMe(mockProps, mockAuth, mockReq)

      expect(getUser).toBeCalledTimes(1)
      expect(getUser).toBeCalledWith({id: mockAuth.uid})
    })
  })
})
