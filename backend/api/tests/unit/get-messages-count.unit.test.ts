import {sqlMatch} from "common/test-utils";
import {getMessagesCount} from "api/get-messages-count";
import {AuthedUser} from "api/helpers/endpoint";
import * as supabaseInit from "shared/supabase/init";

jest.mock('shared/supabase/init');

describe('getMessagesCount', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            one: jest.fn()
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should get message count', async () => {
            const mockProps = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockResults = { count: "10"};

            (mockPg.one as jest.Mock).mockResolvedValue(mockResults);

            const result: any = await getMessagesCount(mockProps, mockAuth, mockReq);

            expect(result.count).toBe(Number(mockResults.count));
            expect(mockPg.one).toBeCalledTimes(1);
            expect(mockPg.one).toBeCalledWith(
              sqlMatch('SELECT COUNT(*) AS count'),
                expect.any(Object)
            );
        });
    });
});