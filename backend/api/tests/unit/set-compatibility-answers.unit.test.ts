jest.mock('shared/supabase/init')
jest.mock('shared/compatibility/compute-scores')

import {sqlMatch} from 'common/test-utils'
import {setCompatibilityAnswer} from 'api/set-compatibility-answer'
import * as supabaseInit from 'shared/supabase/init'
import {recomputeCompatibilityScoresForUser} from 'shared/compatibility/compute-scores'
import {AuthedUser} from 'api/helpers/endpoint'

describe('setCompatibilityAnswer', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      one: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should set compatibility answers', async () => {
      const mockProps = {
        questionId: 1,
        multipleChoice: 2,
        prefChoices: [1, 2, 3, 4, 5],
        importance: 1,
        explanation: 'mockExplanation',
      }
      const mockResult = {
        created_time: 'mockCreatedTime',
        creator_id: 'mockCreatorId',
        explanation: 'mockExplanation',
        id: 123,
        importance: 1,
        multipleChoice: 2,
        prefChoices: [1, 2, 3, 4, 5],
        questionId: 1,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.one as jest.Mock).mockResolvedValue(mockResult)
      ;(recomputeCompatibilityScoresForUser as jest.Mock).mockResolvedValue(null)

      const result: any = await setCompatibilityAnswer(mockProps, mockAuth, mockReq)

      expect(result.result).toBe(mockResult)
      expect(mockPg.one).toBeCalledTimes(1)
      expect(mockPg.one).toBeCalledWith({
        text: sqlMatch('INSERT INTO compatibility_answers'),
        values: [
          mockAuth.uid,
          mockProps.questionId,
          mockProps.multipleChoice,
          mockProps.prefChoices,
          mockProps.importance,
          mockProps.explanation,
        ],
      })

      await result.continue()

      expect(recomputeCompatibilityScoresForUser).toBeCalledTimes(1)
      expect(recomputeCompatibilityScoresForUser).toBeCalledWith(mockAuth.uid, expect.any(Object))
    })
  })
})
