jest.mock('shared/supabase/init');
jest.mock('common/util/array');
jest.mock('api/helpers/private-messages');
jest.mock('shared/utils');

import { createPrivateUserMessageChannel } from "api/create-private-user-message-channel";
import * as supabaseInit from "shared/supabase/init";
import * as sharedUtils from "shared/utils";
import * as utilArrayModules from "common/util/array";
import * as privateMessageModules from "api/helpers/private-messages";
import { AuthedUser } from "api/helpers/endpoint";

describe('createPrivateUserMessageChannel', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            oneOrNone: jest.fn(),
            one: jest.fn(),
            none: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg)
    });

    afterEach(() => {
        jest.restoreAllMocks()
    });

    describe('should', () => {
        it('successfully create a private user message channel (currentChannel)', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockUserIds = ['123', '321'];
            const mockPrivateUsers = [
                {
                    id: '123',
                    blockedUserIds: ['111'],
                    blockedByUserIds: [],
                },
                {
                    id: '321',
                    blockedUserIds: ['111'],
                    blockedByUserIds: [],
                },
            ];
            const mockCurrentChannel = {
                channel_id: "444"
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: false
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValue(mockCreator);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(mockUserIds);
            (utilArrayModules.filterDefined as jest.Mock)
                .mockReturnValue(mockPrivateUsers);
            (mockPg.oneOrNone as jest.Mock)
                .mockResolvedValue(mockCurrentChannel);
            (privateMessageModules.addUsersToPrivateMessageChannel as jest.Mock)
                .mockResolvedValue(null);
            
            const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            expect(sharedUtils.getPrivateUser).toBeCalledTimes(2);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[0]);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[1]);
            expect(results.status).toBe('success');
            expect(results.channelId).toBe(444)
            
        });

        it('successfully create a private user message channel (channel)', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockUserIds = ['123', '321'];
            const mockPrivateUsers = [
                {
                    id: '123',
                    blockedUserIds: ['111'],
                    blockedByUserIds: [],
                },
                {
                    id: '321',
                    blockedUserIds: ['111'],
                    blockedByUserIds: [],
                },
            ];
            const mockChannel = {
                id: "333"
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: false
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValue(mockCreator);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(mockUserIds);
            (utilArrayModules.filterDefined as jest.Mock)
                .mockReturnValue(mockPrivateUsers);
            (mockPg.oneOrNone as jest.Mock)
                .mockResolvedValue(null);
            (mockPg.one as jest.Mock)
                .mockResolvedValue(mockChannel);
            (privateMessageModules.addUsersToPrivateMessageChannel as jest.Mock)
                .mockResolvedValue(null);
            
            const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            expect(sharedUtils.getPrivateUser).toBeCalledTimes(2);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[0]);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[1]);
            expect(results.status).toBe('success');
            expect(results.channelId).toBe(333)
            
        });

        it('throw an error if the user account doesnt exist', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValue(null);
            
            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError('Your account was not found');
        });

        it('throw an error if the authId is banned from posting', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: true
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValue(mockCreator);

            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError('You are banned');
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
        });

        it('throw an error if the array lengths dont match (privateUsers, userIds)', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockUserIds = ['123'];
            const mockPrivateUsers = [
                {
                    id: '123',
                    blockedUserIds: ['111'],
                    blockedByUserIds: [],
                },
            ];
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: false
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValue(mockCreator);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(mockUserIds);
            (utilArrayModules.filterDefined as jest.Mock)
                .mockReturnValue(mockPrivateUsers);
            
            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError(`Private user ${mockAuth.uid} not found`);
        });

        it('throw an error if there is a blocked user in the userId list', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockUserIds = ['321'];
            const mockPrivateUsers = [
                {
                    id: '123',
                    blockedUserIds: ['111'],
                    blockedByUserIds: [],
                },
                {
                    id: '321',
                    blockedUserIds: ['123'],
                    blockedByUserIds: [],
                },
            ];
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: false
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValue(mockCreator);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(mockUserIds);
            (utilArrayModules.filterDefined as jest.Mock)
                .mockReturnValue(mockPrivateUsers);
            
            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError(`One of the users has blocked another user in the list`);
        });
    });
});