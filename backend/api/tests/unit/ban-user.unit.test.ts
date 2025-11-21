jest.mock('shared/supabase/init')
jest.mock('shared/helpers/auth')
jest.mock('common/envs/constants')
jest.mock('shared/supabase/users')
jest.mock('shared/analytics')
jest.mock('shared/utils')

import { banUser } from "api/ban-user";
import * as supabaseInit from "shared/supabase/init";
import { throwErrorIfNotMod } from "shared/helpers/auth";
import * as constants from "common/envs/constants";
import * as supabaseUsers from "shared/supabase/users";
import * as sharedAnalytics from "shared/analytics";
import {  } from "shared/helpers/auth";
import { APIError, AuthedUser } from "api/helpers/endpoint"


describe('banUser', () => {
    let mockPg = {} as any;

    beforeEach(() => {
        jest.resetAllMocks();

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('ban a user successfully', async () => {
            const mockUser = {
                userId: '123',
                unban: false
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (constants.isAdminId as jest.Mock).mockReturnValue(false);

            await banUser(mockUser, mockAuth, mockReq);
            
            expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid);
            expect(constants.isAdminId).toBeCalledWith(mockUser.userId);
            expect(sharedAnalytics.trackPublicEvent)
                .toBeCalledWith(mockAuth.uid, 'ban user', {userId: mockUser.userId});
            expect(supabaseUsers.updateUser)
                .toBeCalledWith(mockPg, mockUser.userId, {isBannedFromPosting: true});
        });

        it('unban a user successfully', async () => {
            const mockUser = {
                userId: '123',
                unban: true
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (constants.isAdminId as jest.Mock).mockReturnValue(false);

            await banUser(mockUser, mockAuth, mockReq);
            
            expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid);
            expect(constants.isAdminId).toBeCalledWith(mockUser.userId);
            expect(sharedAnalytics.trackPublicEvent)
                .toBeCalledWith(mockAuth.uid, 'ban user', {userId: mockUser.userId});
            expect(supabaseUsers.updateUser)
                .toBeCalledWith(mockPg, mockUser.userId, {isBannedFromPosting: false});
        });

        it('throw and error if the ban requester is not a mod or admin', async () => {
            const mockUser = {
                userId: '123',
                unban: false
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            
            (throwErrorIfNotMod as jest.Mock).mockRejectedValue(
                new APIError(
                    403,
                    `User ${mockAuth.uid} must be an admin or trusted to perform this action.`
                )
            );

            await expect(banUser(mockUser, mockAuth, mockReq))
                .rejects
                .toThrowError(`User ${mockAuth.uid} must be an admin or trusted to perform this action.`);
            expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid);
            expect(sharedAnalytics.trackPublicEvent).toBeCalledTimes(0);
            expect(supabaseUsers.updateUser).toBeCalledTimes(0);
        });

        it('throw an error if the ban target is an admin', async () => {
            const mockUser = {
                userId: '123',
                unban: false
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (constants.isAdminId as jest.Mock).mockReturnValue(true);

            await expect(banUser(mockUser, mockAuth, mockReq))
                .rejects
                .toThrowError('Cannot ban admin');
            expect(throwErrorIfNotMod).toBeCalledWith(mockAuth.uid);
            expect(constants.isAdminId).toBeCalledWith(mockUser.userId);
            expect(sharedAnalytics.trackPublicEvent).toBeCalledTimes(0);
            expect(supabaseUsers.updateUser).toBeCalledTimes(0);
        });
    });
});