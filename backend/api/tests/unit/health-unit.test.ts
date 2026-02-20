import {health} from 'api/health'
import {AuthedUser} from 'api/helpers/endpoint'

describe('health', () => {
  describe('when given valid input', () => {
    it('should return the servers status(Health)', async () => {
      const mockProps = {} as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      const result: any = await health(mockProps, mockAuth, mockReq)
      expect(result.message).toBe('Server is working.')
      expect(result.uid).toBe(mockAuth.uid)
    })
  })
})
