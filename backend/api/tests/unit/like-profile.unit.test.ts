jest.mock('shared/supabase/init');
jest.mock('shared/create-profile-notification');
jest.mock('api/has-free-like');
jest.mock('common/util/try-catch');

import { likeProfile } from "api/like-profile";
import * as supabaseInit from "shared/supabase/init";
import * as profileNotifiction from "shared/create-profile-notification";
import * as likeModules from "api/has-free-like";
import { tryCatch } from "common/util/try-catch";
import { AuthedUser } from "api/helpers/endpoint";

describe('likeProfile', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            oneOrNone: jest.fn(),
            one: jest.fn(),
            none: jest.fn()
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should like the selected profile', async () => {
            const mockProps = {
                targetUserId: "mockTargetUserId",
                remove: false
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = {
                created_time: "mockCreatedTime",
                creator_id: "mockCreatorId",
                likeId: "mockLikeId",
                target_id: "mockTargetId"
            };

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: false})
                .mockResolvedValueOnce({data: mockData, error: null});
            (likeModules.getHasFreeLike as jest.Mock).mockResolvedValue(true);
            (mockPg.one as jest.Mock).mockResolvedValue(null);

            const result: any = await likeProfile(mockProps, mockAuth, mockReq);

            expect(result.result.status).toBe('success');
            expect(mockPg.oneOrNone).toBeCalledTimes(1);
            expect(mockPg.oneOrNone).toBeCalledWith(
                expect.stringContaining('select * from profile_likes where creator_id = $1 and target_id = $2'),
                [mockAuth.uid, mockProps.targetUserId]
            );
            expect(tryCatch).toBeCalledTimes(2);
            expect(mockPg.one).toBeCalledTimes(1);
            expect(mockPg.one).toBeCalledWith(
                expect.stringContaining('insert into profile_likes (creator_id, target_id) values ($1, $2) returning *'),
                [mockAuth.uid, mockProps.targetUserId]
            );

            (profileNotifiction.createProfileLikeNotification as jest.Mock).mockResolvedValue(null);

            await result.continue();

            expect(profileNotifiction.createProfileLikeNotification).toBeCalledTimes(1);
            expect(profileNotifiction.createProfileLikeNotification).toBeCalledWith(mockData);
        });

        it('should do nothing if there is already a like', async () => {
            const mockProps = {
                targetUserId: "mockTargetUserId",
                remove: false
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: true});

            const result: any = await likeProfile(mockProps, mockAuth, mockReq);

            expect(result.status).toBe('success');
        });

        it('should remove a like', async () => {
            const mockProps = {
                targetUserId: "mockTargetUserId",
                remove: true
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = {
                created_time: "mockCreatedTime",
                creator_id: "mockCreatorId",
                likeId: "mockLikeId",
                target_id: "mockTargetId"
            };

            (mockPg.none as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockData, error: null});

            const result: any = await likeProfile(mockProps, mockAuth, mockReq);

            expect(result.status).toBe('success');
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
                expect.stringContaining('delete from profile_likes where creator_id = $1 and target_id = $2'),
                [mockAuth.uid, mockProps.targetUserId]
            );
        });
    });

    describe('when an error occurs', () => {
        it('should throw if failed to remove like', async () => {
            const mockProps = {
                targetUserId: "mockTargetUserId",
                remove: true
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = {
                created_time: "mockCreatedTime",
                creator_id: "mockCreatorId",
                likeId: "mockLikeId",
                target_id: "mockTargetId"
            };

            (mockPg.none as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: mockData, error: Error});

            expect(likeProfile(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Failed to remove like: ');
        });

        it('should throw if user has already used their free like', async () => {
            const mockProps = {
                targetUserId: "mockTargetUserId",
                remove: false
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = {
                created_time: "mockCreatedTime",
                creator_id: "mockCreatorId",
                likeId: "mockLikeId",
                target_id: "mockTargetId"
            };

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: false})
                .mockResolvedValueOnce({data: mockData, error: null});
            (likeModules.getHasFreeLike as jest.Mock).mockResolvedValue(false);


            expect(likeProfile(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('You already liked someone today!');
        });

        it('should throw if failed to add like', async () => {
            const mockProps = {
                targetUserId: "mockTargetUserId",
                remove: false
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = {
                created_time: "mockCreatedTime",
                creator_id: "mockCreatorId",
                likeId: "mockLikeId",
                target_id: "mockTargetId"
            };

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: false})
                .mockResolvedValueOnce({data: mockData, error: Error});
            (likeModules.getHasFreeLike as jest.Mock).mockResolvedValue(true);
            (mockPg.one as jest.Mock).mockResolvedValue(null);

            expect(likeProfile(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Failed to add like: ');
        });
    });
});