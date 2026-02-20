jest.mock('shared/supabase/init')

import * as compatibililtyQuestionsModules from 'api/get-compatibililty-questions'
import * as supabaseInit from 'shared/supabase/init'

describe('getCompatibilityQuestions', () => {
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
    it('should get compatibility questions', async () => {
      const mockProps = {locale: 'en'} as any
      const mockAuth = {} as any
      const mockReq = {} as any
      const mockQuestions = {
        answer_type: 'mockAnswerTypes',
        category: 'mockCategory',
        created_time: 'mockCreatedTime',
        creator_id: 'mockCreatorId',
        id: 'mockId',
        importance_score: 123,
        multiple_choice_options: {mockChoice: 'mockChoiceValue'},
        question: 'mockQuestion',
        answer_count: 10,
        score: 20,
      }

      ;(mockPg.manyOrNone as jest.Mock).mockResolvedValue(mockQuestions)

      const results: any = await compatibililtyQuestionsModules.getCompatibilityQuestions(
        mockProps,
        mockAuth,
        mockReq,
      )
      const [sql, _params] = (mockPg.manyOrNone as jest.Mock).mock.calls[0]

      expect(results.status).toBe('success')
      expect(results.questions).toBe(mockQuestions)
      expect(sql).toEqual(expect.stringContaining('FROM compatibility_prompts'))
      expect(sql).toEqual(expect.stringContaining('LEFT JOIN compatibility_prompts_translations'))
      expect(sql).toEqual(expect.stringContaining('COUNT(ca.question_id)'))
    })
  })
})
