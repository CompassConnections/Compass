jest.mock('shared/supabase/init');
jest.mock('common/util/array');
jest.mock('api/helpers/private-messages');
jest.mock('shared/utils');
jest.mock('firebase-admin', () => ({
  auth: jest.fn()
}));

import {createPrivateUserMessageChannel} from "api/create-private-user-message-channel";
import * as supabaseInit from "shared/supabase/init";
import * as sharedUtils from "shared/utils";
import * as utilArrayModules from "common/util/array";
import * as privateMessageModules from "api/helpers/private-messages";
import * as admin from 'firebase-admin';
import {AuthedUser} from "api/helpers/endpoint";

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
          .mockReturnValue(mockPg);

      (admin.auth as jest.Mock).mockReturnValue({
        getUser: jest.fn().mockResolvedValue({emailVerified: true})
      });
    });
    afterEach(() => {
        jest.restoreAllMocks()
    });

    describe('when given valid input', () => {
        it('should successfully create a private user message channel (currentChannel)', async () => {
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

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator);
            (utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers);
            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockCurrentChannel);
            
            const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq);

            expect(results.status).toBe('success');
            expect(results.channelId).toBe(444);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            expect(sharedUtils.getPrivateUser).toBeCalledTimes(2);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[0]);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[1]);
            expect(mockPg.oneOrNone).toBeCalledTimes(1);
            expect(mockPg.oneOrNone).toBeCalledWith(
              expect.stringContaining('select channel_id\n        from private_user_message_channel_members'),
                [mockUserIds]
            );
        });

        it('should successfully create a private user message channel (channel)', async () => {
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

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator);
            (utilArrayModules.filterDefined as jest.Mock).mockReturnValue(mockPrivateUsers);
            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(false);
            (mockPg.one as jest.Mock).mockResolvedValue(mockChannel);
            
            const results = await createPrivateUserMessageChannel(mockBody, mockAuth, mockReq);

            expect(results.status).toBe('success');
            expect(results.channelId).toBe(333);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            expect(sharedUtils.getPrivateUser).toBeCalledTimes(2);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[0]);
            expect(sharedUtils.getPrivateUser).toBeCalledWith(mockUserIds[1]);
            expect(mockPg.one).toBeCalledTimes(1);
            expect(mockPg.one).toBeCalledWith(
              expect.stringContaining('insert into private_user_message_channels default\n     values\n     returning id')
            );
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
                expect.stringContaining('insert into private_user_message_channel_members (channel_id, user_id, role, status)'),
                [mockChannel.id, mockAuth.uid]
            );
            expect(privateMessageModules.addUsersToPrivateMessageChannel).toBeCalledTimes(1);
            expect(privateMessageModules.addUsersToPrivateMessageChannel).toBeCalledWith(
                [mockUserIds[0]],
                mockChannel.id,
                expect.any(Object)
            );
        });
    });
    
    describe('when an error occurs', () => {
      it('should throw if user email is not verified', async () => {
        const mockBody = {
          userIds: ["123"]
        };
        const mockAuth = {uid: '321'} as AuthedUser;
        const mockReq = {} as any;

        (admin.auth as jest.Mock).mockReturnValue({
          getUser: jest.fn().mockResolvedValue({emailVerified: false})
        });

        expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
          .rejects
          .toThrowError('You must verify your email to contact people.');

        expect(admin.auth().getUser).toHaveBeenCalledWith(mockAuth.uid);
      });

        it('should throw if the user account doesnt exist', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            
            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError('Your account was not found');
        });

        it('should throw if the authId is banned from posting', async () => {
            const mockBody = {
                userIds: ["123"]
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: true
            };

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator);

            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError('You are banned');
        });

        it('should throw if the array lengths dont match (privateUsers, userIds)', async () => {
            const mockBody = {
                userIds: ["123"]
            };
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
            (utilArrayModules.filterDefined as jest.Mock)
                .mockReturnValue(mockPrivateUsers);
            
            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError(`Private user ${mockAuth.uid} not found`);
        });

        it('should throw if there is a blocked user in the userId list', async () => {
            const mockBody = {
                userIds: ["123"]
            };
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
            (utilArrayModules.filterDefined as jest.Mock)
                .mockReturnValue(mockPrivateUsers);
            
            expect(createPrivateUserMessageChannel(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError(`One of the users has blocked another user in the list`);
        });
    });
});