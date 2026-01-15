jest.mock('shared/supabase/init');
jest.mock('shared/supabase/utils');
jest.mock('common/supabase/users');
jest.mock('email/functions/helpers');
jest.mock('api/set-last-online-time');
jest.mock('firebase-admin', () => ({
    auth: jest.fn()
}));
jest.mock('shared/utils');
jest.mock('shared/analytics');
jest.mock('shared/firebase-utils');
jest.mock('shared/helpers/generate-and-update-avatar-urls');
jest.mock('common/util/object');
jest.mock('common/user-notification-preferences');
jest.mock('common/util/clean-username');
jest.mock('shared/monitoring/log');
jest.mock('common/hosting/constants');

import { createUser } from "api/create-user";
import * as supabaseInit from "shared/supabase/init";
import * as supabaseUtils from "shared/supabase/utils";
import * as supabaseUsers from "common/supabase/users";
import * as emailHelpers from "email/functions/helpers";
import * as apiSetLastTimeOnline from "api/set-last-online-time";
import * as firebaseAdmin from "firebase-admin";
import * as sharedUtils from "shared/utils";
import * as sharedAnalytics from "shared/analytics";
import * as firebaseUtils from "shared/firebase-utils";
import * as avatarHelpers from "shared/helpers/generate-and-update-avatar-urls";
import * as objectUtils from "common/util/object";
import * as userNotificationPref from "common/user-notification-preferences";
import * as usernameUtils from "common/util/clean-username";
import * as hostingConstants from "common/hosting/constants";
import { AuthedUser } from "api/helpers/endpoint";


describe('createUser', () => {
    const originalIsLocal = (hostingConstants as any).IS_LOCAL;
    let mockPg = {} as any;

    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            one: jest.fn(),
            tx: jest.fn(async (cb) => {
                const mockTx = {} as any;
                return cb(mockTx)
            })
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        Object.defineProperty(hostingConstants, 'IS_LOCAL', {
            value: originalIsLocal,
            writable: true,
        });
    });

    describe('when given valid input', () => {
        it('should successfully create a user', async () => {
            Object.defineProperty(hostingConstants, 'IS_LOCAL', {
                value: false,
                writable: true
            });
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };
            
            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            const results: any = await createUser(mockProps, mockAuth, mockReq);

            expect(results.result.user).toEqual(mockNewUserRow);
            expect(results.result.privateUser).toEqual(mockPrivateUserRow);
            expect(mockGetUser).toBeCalledTimes(2);
            expect(mockGetUser).toHaveBeenNthCalledWith(1, mockAuth.uid);
            expect(mockReq.get).toBeCalledTimes(1);
            expect(mockReq.get).toBeCalledWith(Object.keys(mockReferer.headers)[0]);
            expect(sharedAnalytics.getIp).toBeCalledTimes(1);
            expect(sharedAnalytics.getIp).toBeCalledWith(mockReq);
            expect(mockGetUser).toHaveBeenNthCalledWith(2, mockAuth.uid);
            expect(usernameUtils.cleanDisplayName).toBeCalledTimes(1);
            expect(usernameUtils.cleanDisplayName).toHaveBeenCalledWith(mockFbUser.displayName);
            expect(usernameUtils.cleanUsername).toBeCalledTimes(1);
            expect(usernameUtils.cleanUsername).toBeCalledWith(mockFbUser.displayName);
            expect(mockPg.one).toBeCalledTimes(1);
            expect(mockPg.tx).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toHaveBeenCalledWith(
                mockAuth.uid,
                expect.any(Object)
            );
            expect(userNotificationPref.getDefaultNotificationPreferences).toBeCalledTimes(1);
            expect(supabaseUtils.insert).toBeCalledTimes(2);
            expect(supabaseUtils.insert).toHaveBeenNthCalledWith(
                1,
                expect.any(Object),
                'users',
                expect.objectContaining(
                    {
                        id: mockAuth.uid,
                        name: mockFbUser.displayName,
                        username: mockFbUser.displayName,
                    }
                )
            );
            expect(supabaseUtils.insert).toHaveBeenNthCalledWith(
                2,
                expect.any(Object),
                'private_users',
                expect.objectContaining(
                    {
                        id: mockAuth.uid,
                    }
                )
            );
            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (emailHelpers.sendWelcomeEmail as jest.Mock).mockResolvedValue(null);
            (apiSetLastTimeOnline.setLastOnlineTimeUser as jest.Mock).mockResolvedValue(null);

            await results.continue();

            expect(sharedAnalytics.track).toBeCalledTimes(1);
            expect(sharedAnalytics.track).toBeCalledWith(
                mockAuth.uid,
                'create profile',
                {username: mockNewUserRow.username}
            );
            expect(emailHelpers.sendWelcomeEmail).toBeCalledTimes(1);
            expect(emailHelpers.sendWelcomeEmail).toBeCalledWith(mockNewUserRow, mockPrivateUserRow);
            expect(apiSetLastTimeOnline.setLastOnlineTimeUser).toBeCalledTimes(1);
            expect(apiSetLastTimeOnline.setLastOnlineTimeUser).toBeCalledWith(mockAuth.uid);
        });

        it('should generate a device token when creating a user', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'password'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            await createUser(mockProps, mockAuth, mockReq);

            expect(supabaseUtils.insert).not.toHaveBeenNthCalledWith(
                2,
                expect.any(Object),
                'private_users',
                {
                    id: expect.any(String),
                    data: expect.objectContaining(
                        {
                            initialDeviceToken: mockProps.deviceToken
                        }
                    )
                }
            );
            
        });

        it('should generate a avatar Url when creating a user', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'password'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockAvatarUrl = "mockGeneratedAvatarUrl"
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (avatarHelpers.generateAvatarUrl as jest.Mock).mockResolvedValue(mockAvatarUrl);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            await createUser(mockProps, mockAuth, mockReq);

            expect(objectUtils.removeUndefinedProps).toHaveBeenCalledTimes(1);
            expect(objectUtils.removeUndefinedProps).toHaveBeenCalledWith(
                { 
                    avatarUrl: mockAvatarUrl, 
                    isBannedFromPosting: false,
                    link: expect.any(Object)
                }
            );
            
        });

        it('should not allow a username that already exists when creating a user', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(1);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            await createUser(mockProps, mockAuth, mockReq);

            expect(mockPg.one).toBeCalledTimes(1);
            expect(supabaseUtils.insert).toBeCalledTimes(2);
            expect(supabaseUtils.insert).not.toHaveBeenNthCalledWith(
                1,
                expect.any(Object),
                'users',
                expect.objectContaining(
                    {
                        id: mockAuth.uid,
                        name: mockFbUser.displayName,
                        username: mockFbUser.displayName,
                    }
                )
            );
        });

        it('should successfully create a user who is banned from posting if there ip/device token is banned', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            jest.spyOn(Array.prototype, 'includes').mockReturnValue(true);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            await createUser(mockProps, mockAuth, mockReq);

            expect(objectUtils.removeUndefinedProps).toHaveBeenCalledTimes(1);
            expect(objectUtils.removeUndefinedProps).toHaveBeenCalledWith(
                { 
                    avatarUrl: mockFbUser.photoURL,
                    isBannedFromPosting: true,
                    link: expect.any(Object)
                }
            );
        });
    });

    describe('when an error occurs', () => {
        it('should throw if the user already exists', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(true);
            
            expect(createUser(mockProps, mockAuth, mockReq))
                .rejects
                .toThrowError('User already exists');
        });

        it('should throw if the username is already taken', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(true);
            
            expect(createUser(mockProps, mockAuth, mockReq))
                .rejects
                .toThrowError('Username already taken');
        });

        it('should throw if failed to track create profile', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            const results: any = await createUser(mockProps, mockAuth, mockReq);

            (sharedAnalytics.track as jest.Mock).mockRejectedValue(new Error('Tracking failed'));
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await results.continue();

            expect(errorSpy).toHaveBeenCalledWith('Failed to track create profile', expect.any(Error));
        });

        it('should throw if failed to send a welcome email', async () => {
            Object.defineProperty(hostingConstants, 'IS_LOCAL', {
                value: false,
                writable: true
            });
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            const results: any = await createUser(mockProps, mockAuth, mockReq);

            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (emailHelpers.sendWelcomeEmail as jest.Mock).mockRejectedValue(new Error('Welcome email failed'));
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await results.continue();
            
            expect(errorSpy).toBeCalledWith('Failed to sendWelcomeEmail', expect.any(Error));
        });

        it('should throw if failed to set last time online', async () => {
            const mockProps = {
                deviceToken: "mockDeviceToken",
                adminToken: "mockAdminToken"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReferer = {
                headers: {
                    'referer': 'mockReferer'
                }
            };
            const mockReq = { get: jest.fn().mockReturnValue(mockReferer)} as any;
            const mockFirebaseUser = {
                providerData: [
                    {
                        providerId: 'passwords'
                    }
                ],
            };
            const mockFbUser = {
                email: "mockEmail@mockServer.com",
                displayName: "mockDisplayName",
                photoURL: "mockPhotoUrl"
            };
            const mockIp = "mockIP";
            const mockBucket = {} as any;
            const mockNewUserRow = {
                created_time: "mockCreatedTime",
                data: {"mockNewUserJson": "mockNewUserJsonData"},
                id: "mockNewUserId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername"
            };
            const mockPrivateUserRow = {
                data: {"mockPrivateUserJson" : "mockPrivateUserJsonData"},
                id: "mockPrivateUserId"
            };

            const mockGetUser = jest.fn()
                .mockResolvedValueOnce(mockFirebaseUser)
                .mockResolvedValueOnce(mockFbUser);

            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (sharedAnalytics.getIp as jest.Mock).mockReturnValue(mockIp);
            (firebaseAdmin.auth as jest.Mock).mockReturnValue({
                getUser: mockGetUser
            });
            (usernameUtils.cleanDisplayName as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (firebaseUtils.getBucket as jest.Mock).mockReturnValue(mockBucket);
            (usernameUtils.cleanUsername as jest.Mock).mockReturnValue(mockFbUser.displayName);
            (mockPg.one as jest.Mock).mockResolvedValue(0);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockResolvedValue(false);
            (userNotificationPref.getDefaultNotificationPreferences as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (supabaseUsers.convertUser as jest.Mock).mockReturnValue(mockNewUserRow);
            (supabaseUsers.convertPrivateUser as jest.Mock).mockReturnValue(mockPrivateUserRow);
            
            const results: any = await createUser(mockProps, mockAuth, mockReq);

            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (emailHelpers.sendWelcomeEmail as jest.Mock).mockResolvedValue(null);
            (apiSetLastTimeOnline.setLastOnlineTimeUser as jest.Mock).mockRejectedValue(new Error('Failed to set last online time'));
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await results.continue();
            
            expect(errorSpy).toHaveBeenCalledWith('Failed to set last online time', expect.any(Error));
        });
    });
});