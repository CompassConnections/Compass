jest.mock('shared/supabase/init')
jest.mock('shared/compatibility/compute-scores')

import {deleteCompatibilityAnswer} from 'api/delete-compatibility-answer'
import {AuthedUser} from 'api/helpers/endpoint'
import {sqlMatch} from 'common/test-utils'
import {
  recomputeCompatibilityScoresForUser,
  updateCompatibilityPromptsMetrics,
} from 'shared/compatibility/compute-scores'
import * as supabaseInit from 'shared/supabase/init'

describe('deleteCompatibilityAnswers', () => {
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
    it('should successfully delete compatibility answers', async () => {
      const mockProps = {
        id: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockAnswer = {question_id: 69}

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockAnswer)
      ;(mockPg.none as jest.Mock).mockResolvedValue(null)

      const response: any = await deleteCompatibilityAnswer(mockProps, mockAuth, mockReq)

      expect(response.result.status).toBe('success')
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(sqlMatch(`SELECT *`), [mockProps.id, mockAuth.uid])
      expect(mockPg.none).toBeCalledTimes(1)
      expect(mockPg.none).toBeCalledWith(sqlMatch('DELETE'), [mockProps.id, mockAuth.uid])

      await response.continue()
      ;(recomputeCompatibilityScoresForUser as jest.Mock).mockResolvedValue(null)
      expect(recomputeCompatibilityScoresForUser).toBeCalledTimes(1)
      expect(recomputeCompatibilityScoresForUser).toBeCalledWith(mockAuth.uid)

      expect(updateCompatibilityPromptsMetrics).toBeCalledTimes(1)
      expect(updateCompatibilityPromptsMetrics).toBeCalledWith(mockAnswer.question_id)
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the user is not the answers author', async () => {
      const mockProps = {
        id: 123,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

      expect(deleteCompatibilityAnswer(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Item not found',
      )
    })
  })
})
