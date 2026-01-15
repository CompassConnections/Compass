jest.mock('shared/supabase/init');
jest.mock('shared/utils');
jest.mock('firebase-admin', () => ({
    auth: jest.fn()
}));
jest.mock('shared/firebase-utils');

import { deleteMe } from "api/delete-me";
import * as supabaseInit from "shared/supabase/init";
import * as sharedUtils from "shared/utils";
import * as firebaseAdmin from "firebase-admin";
import * as firebaseUtils from "shared/firebase-utils";
import { AuthedUser } from "api/helpers/endpoint";

describe('deleteMe', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            none: jest.fn()
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg)
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should delete the user account from supabase and firebase', async () => {
            const mockUser = {
                id: "mockId",
                username: "mockUsername"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockRef = {} as any;

            const mockDeleteUser = jest.fn().mockResolvedValue(null);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            (firebaseUtils.deleteUserFiles as jest.Mock).mockResolvedValue(null);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                deleteUser: mockDeleteUser
            });
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

            await deleteMe(mockRef, mockAuth, mockRef);
            
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
                expect.stringContaining('DELETE FROM users WHERE id = $1'),
                [mockUser.id]
            );
            expect(firebaseUtils.deleteUserFiles).toBeCalledTimes(1);
            expect(firebaseUtils.deleteUserFiles).toBeCalledWith(mockUser.username);
            expect(mockDeleteUser).toBeCalledTimes(1);
            expect(mockDeleteUser).toBeCalledWith(mockUser.id);

            expect(debugSpy).toBeCalledWith(
                expect.stringContaining(mockUser.id)
            );
        });
    });
    describe('when an error occurs', () => {
        it('should throw if the user account was not found', async () => {
            const mockUser = {
                id: "mockId",
                username: "mockUsername"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockRef = {} as any;

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(null);

            expect(deleteMe(mockRef, mockAuth, mockRef))
                .rejects
                .toThrow('Your account was not found');
        });

        it('should throw an error if there is no userId', async () => {
            const mockUser = {
                username: "mockUsername"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockRef = {} as any;

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);

            expect(deleteMe(mockRef, mockAuth, mockRef))
                .rejects
                .toThrow('Invalid user ID');
        });

        it('should throw if unable to remove user from firebase auth', async () => {
            const mockUser = {
                id: "mockId",
                username: "mockUsername"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockRef = {} as any;

            const mockDeleteUser = jest.fn().mockRejectedValue(new Error('Error during deletion'));
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            (firebaseUtils.deleteUserFiles as jest.Mock).mockResolvedValue(null);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                deleteUser: mockDeleteUser
            });
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await deleteMe(mockRef, mockAuth, mockRef);

            expect(errorSpy).toBeCalledWith(
                expect.stringContaining('Error deleting user from Firebase Auth:'),
                expect.any(Error)
            );
        });
    });
});