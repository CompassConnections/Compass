import {sqlMatch} from 'common/test-utils'
import {getProfileAnswers} from 'api/get-profile-answers'
import {AuthedUser} from 'api/helpers/endpoint'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('shared/supabase/init')

describe('getProfileAnswers', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      manyOrNone: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should get the answers for the userId', async () => {
      const mockProps = {userId: 'mockUserId'}
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockAnswers = [
        {
          created_time: 'mockCreatedTime',
          creator_id: 'mockCreatorId',
          explanation: 'mockExplanation',
          id: 123,
          importance: 10,
          multiple_choice: 1234,
          pref_choices: [1, 2, 3],
          question_id: 12345,
        },
      ]

      ;(mockPg.manyOrNone as jest.Mock).mockResolvedValue(mockAnswers)

      const result: any = await getProfileAnswers(mockProps, mockAuth, mockReq)

      expect(result.status).toBe('success')
      expect(result.answers).toBe(mockAnswers)
      expect(mockPg.manyOrNone).toBeCalledTimes(1)
      expect(mockPg.manyOrNone).toBeCalledWith(sqlMatch('select * from compatibility_answers'), [
        mockProps.userId,
      ])
    })
  })
})
