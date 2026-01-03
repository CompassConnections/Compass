jest.mock('shared/supabase/init');
jest.mock('shared/compatibility/compute-scores');

import { deleteCompatibilityAnswer } from "api/delete-compatibility-answer";
import * as supabaseInit from "shared/supabase/init";
import { recomputeCompatibilityScoresForUser } from "shared/compatibility/compute-scores";
import { AuthedUser } from "api/helpers/endpoint";

describe('deleteCompatibilityAnswers', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            oneOrNone: jest.fn(),
            none: jest.fn()
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should successfully delete compatibility answers', async () => {
            const mockProps = {
                id: 123
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(true);
            (mockPg.none as jest.Mock).mockResolvedValue(null);

            const results: any = await deleteCompatibilityAnswer(mockProps, mockAuth, mockReq);

            expect(results.status).toBe('success');
            expect(mockPg.oneOrNone).toBeCalledTimes(1);
            expect(mockPg.oneOrNone).toBeCalledWith(
                expect.stringContaining(`SELECT *`),
                [mockProps.id, mockAuth.uid]
            );
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
                expect.stringContaining('DELETE'),
                [mockProps.id, mockAuth.uid]
            );

            await results.continue();
            
            (recomputeCompatibilityScoresForUser as jest.Mock).mockResolvedValue(null);
            expect(recomputeCompatibilityScoresForUser).toBeCalledTimes(1);
            expect(recomputeCompatibilityScoresForUser).toBeCalledWith(mockAuth.uid, expect.any(Object));
        });
    });
    describe('when an error occurs', () => {
        it('should throw an error if the user is not the answers author', async () => {
            const mockProps = {
                id: 123
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(false);

            expect(deleteCompatibilityAnswer(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Item not found');
        });
    });
});