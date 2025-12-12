jest.mock('shared/supabase/init');
jest.mock('shared/utils');
jest.mock('shared/supabase/utils');
jest.mock('common/util/try-catch');

import { createCompatibilityQuestion } from "api/create-compatibility-question";
import * as supabaseInit from "shared/supabase/init";
import * as shareUtils from "shared/utils";
import { tryCatch } from "common/util/try-catch";
import * as supabaseUtils from "shared/supabase/utils";
import { AuthedUser } from "api/helpers/endpoint";

describe('createCompatibilityQuestion', () => {
    const mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('should', () => {
        it('successfully create compatibility questions', async () => {
            const mockQuestion = {} as any;
            const mockOptions = {} as any;
            const mockProps = {options:mockOptions, question:mockQuestion};
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                id: '123',
            };
            const mockData = {
                answer_type: "mockAnswerType",
                category: "mockCategory",
                created_time: "mockCreatedTime",
                id: 1,
                importance_score: 1,
                multiple_choice_options: {"first_choice":"first_answer"},
                question: "mockQuestion"
            };
            (shareUtils.getUser as jest.Mock).mockResolvedValue(mockCreator);
            (supabaseUtils.insert as jest.Mock).mockResolvedValue(mockData);
            (tryCatch as jest.Mock).mockResolvedValue({data:mockData, error: null});

            const results = await createCompatibilityQuestion(mockProps, mockAuth, mockReq);
            
            expect(results.question).toEqual(mockData);
            
        });

        it('throws an error if the account does not exist', async () => {
            const mockQuestion = {} as any;
            const mockOptions = {} as any;
            const mockProps = {options:mockOptions, question:mockQuestion};
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            (shareUtils.getUser as jest.Mock).mockResolvedValue(null);
            
            expect(createCompatibilityQuestion(mockProps, mockAuth, mockReq))
                .rejects
                .toThrowError('Your account was not found')

        });

        it('throws an error if unable to create the question', async () => {
            const mockQuestion = {} as any;
            const mockOptions = {} as any;
            const mockProps = {options:mockOptions, question:mockQuestion};
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                id: '123',
            };
            const mockData = {
                answer_type: "mockAnswerType",
                category: "mockCategory",
                created_time: "mockCreatedTime",
                id: 1,
                importance_score: 1,
                multiple_choice_options: {"first_choice":"first_answer"},
                question: "mockQuestion"
            };
            (shareUtils.getUser as jest.Mock).mockResolvedValue(mockCreator);
            (supabaseUtils.insert as jest.Mock).mockResolvedValue(mockData);
            (tryCatch as jest.Mock).mockResolvedValue({data:null, error: Error});
            
            expect(createCompatibilityQuestion(mockProps, mockAuth, mockReq))
                .rejects
                .toThrowError('Error creating question')
            
        });
    });
});