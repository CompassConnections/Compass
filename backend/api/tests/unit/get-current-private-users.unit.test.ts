jest.mock('shared/supabase/init');
jest.mock('common/util/try-catch');

import { getCurrentPrivateUser } from "api/get-current-private-user";
import * as supabaseInit from "shared/supabase/init";
import { tryCatch } from "common/util/try-catch";
import { AuthedUser } from "api/helpers/endpoint";

describe('getCurrentPrivateUser', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            oneOrNone: jest.fn()
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should get current private user', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockProps = {} as any;
            const mockReq = {} as any;
            const mockData = {
                data: {"mockData" : "mockDataValue"},
                id: "mockId"
            };
            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockData, error: null});

            const result = await getCurrentPrivateUser(mockProps, mockAuth, mockReq);
            
            expect(result).toBe(mockData.data);
            expect(mockPg.oneOrNone).toBeCalledWith(
                expect.stringContaining('select * from private_users where id = $1'),
                [mockAuth.uid]
            );
        });
    });
    
    describe('when an error occurs', () => {
        it('should throw if unable to get users private data', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockProps = {} as any;
            const mockReq = {} as any;
            const mockData = {
                data: {"mockData" : "mockDataValue"},
                id: "mockId"
            };
            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockData, error: Error});

            expect(getCurrentPrivateUser(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Error fetching private user data: ');
        });

        it('should throw if unable to find user account', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockProps = {} as any;
            const mockReq = {} as any;

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: null, error: null});

            expect(getCurrentPrivateUser(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Your account was not found');
        });
    });
});