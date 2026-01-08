jest.mock('shared/supabase/init');
jest.mock('common/util/try-catch');

import { getOptions } from "api/get-options";
import * as supabaseInit from "shared/supabase/init";
import { tryCatch } from "common/util/try-catch";
import { AuthedUser } from "api/helpers/endpoint";

describe('getOptions', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            manyOrNone: jest.fn(),
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should return valid options', async () => {
            const mockTable = "causes";
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = [
                { name: "mockName" },
            ];

            jest.spyOn(Array.prototype, 'includes').mockReturnValue(true);
            (mockPg.manyOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockData, error: null});

            const result: any = await getOptions({table: mockTable}, mockAuth, mockReq);

            expect(result.names).toContain(mockData[0].name);
            expect(mockPg.manyOrNone).toBeCalledTimes(1);
            expect(mockPg.manyOrNone).toBeCalledWith(
                expect.stringContaining('SELECT interests.name')
            );
            expect(tryCatch).toBeCalledTimes(1);
        });
    });
    describe('when an error occurs', () => {
        it('should throw if the table is invalid', async () => {
            const mockTable = "causes";
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            jest.spyOn(Array.prototype, 'includes').mockReturnValue(false);

            expect(getOptions({table: mockTable}, mockAuth, mockReq))
                .rejects
                .toThrow('Invalid table');
        });

        it('should throw if unable to get profile options', async () => {
            const mockTable = "causes";
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = [
                { name: "mockName" },
            ];

            jest.spyOn(Array.prototype, 'includes').mockReturnValue(true);
            (mockPg.manyOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error});

            expect(getOptions({table: mockTable}, mockAuth, mockReq))
                .rejects
                .toThrow('Error getting profile options');
        });
    });
});