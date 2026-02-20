jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('shared/supabase/utils')
jest.mock('common/util/try-catch')

import {createVote} from 'api/create-vote'
import {AuthedUser} from 'api/helpers/endpoint'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseInit from 'shared/supabase/init'
import * as supabaseUtils from 'shared/supabase/utils'
import * as sharedUtils from 'shared/utils'

describe('createVote', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    const mockPg = {} as any
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully creates a vote', async () => {
      const mockProps = {
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        isAnonymous: true,
      }
      const mockCreator = {id: '123'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockData = {
        creator_id: mockCreator.id,
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        is_anonymous: true,
        status: 'voting_open',
      }

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: mockData, error: null})

      const result = await createVote(mockProps, mockAuth, mockReq)
      expect(result.data).toEqual(mockData)
      expect(sharedUtils.getUser).toBeCalledTimes(1)
      expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid)
      expect(supabaseUtils.insert).toBeCalledTimes(1)
      expect(supabaseUtils.insert).toHaveBeenCalledWith(expect.any(Object), 'votes', {
        creator_id: mockCreator.id,
        title: mockProps.title,
        description: mockProps.description,
        is_anonymous: mockProps.isAnonymous,
        status: 'voting_open',
      })
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the account was not found', async () => {
      const mockProps = {
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        isAnonymous: true,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(null)

      expect(createVote(mockProps, mockAuth, mockReq)).rejects.toThrow('Your account was not found')
    })

    it('should throw if unable to create a question', async () => {
      const mockProps = {
        title: 'mockTitle',
        description: {mockDescription: 'mockDescriptionValue'},
        isAnonymous: true,
      }
      const mockCreator = {id: '123'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error})

      expect(createVote(mockProps, mockAuth, mockReq)).rejects.toThrow('Error creating question')
    })
  })
})
