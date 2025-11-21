jest.mock('shared/supabase/init')
jest.mock('shared/supabase/users')
jest.mock('shared/supabase/utils')

import * as blockUserModule from "api/block-user";
import { AuthedUser } from "api/helpers/endpoint";
import * as supabaseInit from "shared/supabase/init";
import * as supabaseUsers from "shared/supabase/users";
import * as supabaseUtils from "shared/supabase/utils";

describe('blockUser', () => {
    let mockPg: any;

    beforeEach(() => {
        jest.resetAllMocks()
        mockPg = {
            tx: jest.fn(async (cb) => {
                const mockTx = {};
                await cb(mockTx);
            }),
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg)
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('block the user successfully', async () => {
            const mockParams = { id: '123' }
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (supabaseUsers.updatePrivateUser as jest.Mock).mockResolvedValue(null);

            await blockUserModule.blockUser(mockParams, mockAuth, mockReq)

            expect(mockPg.tx).toHaveBeenCalledTimes(1)

            expect(supabaseUsers.updatePrivateUser)
                .toHaveBeenCalledWith(
                    expect.any(Object),
                    mockAuth.uid,
                    { blockedByUserIds: supabaseUtils.FieldVal.arrayConcat(mockParams.id)}
                );
            expect(supabaseUsers.updatePrivateUser)
                .toHaveBeenCalledWith(
                    expect.any(Object),
                    mockParams.id,
                    { blockedByUserIds: supabaseUtils.FieldVal.arrayConcat(mockAuth.uid)}
                );
        });

        it('throw an error if the user tries to block themselves', async () => {
            const mockParams = { id: '123' }
            const mockAuth = {uid: '123'} as AuthedUser;
            const mockReq = {} as any;

            expect(blockUserModule.blockUser(mockParams, mockAuth, mockReq))
                .rejects
                .toThrowError('You cannot block yourself')

            expect(mockPg.tx).toHaveBeenCalledTimes(0)
        });
    });

});

describe('unblockUser', () => {
    let mockPg: any;

    beforeEach(() => {
        jest.resetAllMocks()
        mockPg = {
            tx: jest.fn(async (cb) => {
                const mockTx = {};
                await cb(mockTx);
            }),
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg)
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('block the user successfully', async () => {
            const mockParams = { id: '123' }
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (supabaseUsers.updatePrivateUser as jest.Mock).mockResolvedValue(null);

            await blockUserModule.unblockUser(mockParams, mockAuth, mockReq)

            expect(mockPg.tx).toHaveBeenCalledTimes(1)

            expect(supabaseUsers.updatePrivateUser)
                .toHaveBeenCalledWith(
                    expect.any(Object),
                    mockAuth.uid,
                    { blockedByUserIds: supabaseUtils.FieldVal.arrayConcat(mockParams.id)}
                );
            expect(supabaseUsers.updatePrivateUser)
                .toHaveBeenCalledWith(
                    expect.any(Object),
                    mockParams.id,
                    { blockedByUserIds: supabaseUtils.FieldVal.arrayConcat(mockAuth.uid)}
                );
        });
    });

});