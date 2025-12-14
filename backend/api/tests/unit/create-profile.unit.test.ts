jest.mock('shared/supabase/init');
jest.mock('shared/utils');
jest.mock('shared/profiles/parse-photos');
jest.mock('shared/supabase/users');
jest.mock('shared/supabase/utils');
jest.mock('common/util/try-catch');
jest.mock('shared/analytics');
jest.mock('common/discord/core');
jest.mock('common/util/time', () => {
    const actual = jest.requireActual('common/util/time');
    return{ ...actual, sleep: () => Promise.resolve()}
});

import { createProfile } from "api/create-profile";
import * as supabaseInit from "shared/supabase/init";
import * as sharedUtils from "shared/utils";
import * as supabaseUsers from "shared/supabase/users";
import * as supabaseUtils from "shared/supabase/utils";
import { tryCatch } from "common/util/try-catch";
import { removePinnedUrlFromPhotoUrls } from "shared/profiles/parse-photos";
import * as sharedAnalytics from "shared/analytics";
import { sendDiscordMessage } from "common/discord/core";
import { AuthedUser } from "api/helpers/endpoint";

describe('createProfile', () => {
    let mockPg = {} as any;

    beforeEach(() => {
        jest.resetAllMocks();
        
        mockPg = {
            oneOrNone: jest.fn().mockReturnValue(null),
            one: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('successfully create a profile', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockNProfiles = 10
            const mockData = {
                age: 30,
                city: "mockCity"
            };
            const mockUser = {
                createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
                name: "mockName",
                username: "mockUserName"
            };

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null});
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (supabaseUsers.updateUser as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock).mockReturnValue(null);
            (tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null});

            const results: any = await createProfile(mockBody, mockAuth, mockReq);

            expect(results.result).toEqual(mockData);
            expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
            expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockBody);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            
            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (sendDiscordMessage as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (mockPg.one as jest.Mock).mockReturnValue(mockNProfiles);

            await results.continue();

            expect(sharedAnalytics.track).toBeCalledTimes(1);
            expect(sharedAnalytics.track).toBeCalledWith(
                mockAuth.uid,
                'create profile',
                {username: mockUser.username}
            );
            expect(sendDiscordMessage).toBeCalledTimes(1);
            expect(sendDiscordMessage).toBeCalledWith(
                expect.stringContaining(mockUser.name && mockUser.username),
                'members'
            );
        });

        it('successfully create milestone profile', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockNProfiles = 15
            const mockData = {
                age: 30,
                city: "mockCity"
            };
            const mockUser = {
                createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
                name: "mockName",
                username: "mockUserName"
            };

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null});
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (supabaseUsers.updateUser as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock).mockReturnValue(null);
            (tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null});

            const results: any = await createProfile(mockBody, mockAuth, mockReq);

            expect(results.result).toEqual(mockData);
            expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
            expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockBody);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            
            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (sendDiscordMessage as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (mockPg.one as jest.Mock).mockReturnValue(mockNProfiles);

            await results.continue();

            expect(sharedAnalytics.track).toBeCalledTimes(1);
            expect(sharedAnalytics.track).toBeCalledWith(
                mockAuth.uid,
                'create profile',
                {username: mockUser.username}
            );
            expect(sendDiscordMessage).toBeCalledTimes(2);
            expect(sendDiscordMessage).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining(mockUser.name && mockUser.username),
                'members'
            );
            expect(sendDiscordMessage).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining(String(mockNProfiles)),
                'general'
            );

        });

        it('throws an error if it failed to track create profile', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockData = {
                age: 30,
                city: "mockCity"
            };
            const mockUser = {
                createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
                name: "mockName",
                username: "mockUserName"
            };

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null});
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (supabaseUsers.updateUser as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock).mockReturnValue(null);
            (tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null});

            const results: any = await createProfile(mockBody, mockAuth, mockReq);

            expect(results.result).toEqual(mockData);
            expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
            expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockBody);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            
            const errorSpy = jest.spyOn(console , 'error').mockImplementation(() => {});

            (sharedAnalytics.track as jest.Mock).mockRejectedValue(null);
            
            await results.continue();
            expect(errorSpy).toBeCalledWith('Failed to track create profile', null)
        });

        it('throws an error if it failed to send discord new profile', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockData = {
                age: 30,
                city: "mockCity"
            };
            const mockUser = {
                createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
                name: "mockName",
                username: "mockUserName"
            };

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null});
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (supabaseUsers.updateUser as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock).mockReturnValue(null);
            (tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null});

            const results: any = await createProfile(mockBody, mockAuth, mockReq);

            expect(results.result).toEqual(mockData);
            expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
            expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockBody);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            
            const errorSpy = jest.spyOn(console , 'error').mockImplementation(() => {});

            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (sendDiscordMessage as jest.Mock).mockRejectedValue(null);

            await results.continue();
            expect(sharedAnalytics.track).toBeCalledTimes(1);
            expect(sharedAnalytics.track).toBeCalledWith(
                mockAuth.uid,
                'create profile',
                {username: mockUser.username}
            );
            expect(errorSpy).toBeCalledWith('Failed to send discord new profile', null);
        });

        it('throws an error if it failed to send discord user milestone', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockNProfiles = 15
            const mockData = {
                age: 30,
                city: "mockCity"
            };
            const mockUser = {
                createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
                name: "mockName",
                username: "mockUserName"
            };

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null});
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (supabaseUsers.updateUser as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock).mockReturnValue(null);
            (tryCatch as jest.Mock).mockResolvedValueOnce({data: mockData, error: null});

            const results: any = await createProfile(mockBody, mockAuth, mockReq);

            expect(results.result).toEqual(mockData);
            expect(removePinnedUrlFromPhotoUrls).toBeCalledTimes(1)
            expect(removePinnedUrlFromPhotoUrls).toBeCalledWith(mockBody);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            
            const errorSpy = jest.spyOn(console , 'error').mockImplementation(() => {});

            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (sendDiscordMessage as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockRejectedValueOnce(null);
            (mockPg.one as jest.Mock).mockReturnValue(mockNProfiles);

            await results.continue();
            expect(sharedAnalytics.track).toBeCalledTimes(1);
            expect(sharedAnalytics.track).toBeCalledWith(
                mockAuth.uid,
                'create profile',
                {username: mockUser.username}
            );
            expect(sendDiscordMessage).toBeCalledTimes(2);
            expect(sendDiscordMessage).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining(mockUser.name && mockUser.username),
                'members'
            );
            expect(sendDiscordMessage).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining(String(mockNProfiles)),
                'general'
            );
            expect(errorSpy).toBeCalledWith('Failed to send discord user milestone', null);
        });

        it('throws an error if the profile already exists', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockExistingUser = {id: "mockExistingUserId"};

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: mockExistingUser, error: null});

            await expect(createProfile(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError('User already exists');
        });

        it('throws an error if the user already exists', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null});
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(null);

            await expect(createProfile(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError('Your account was not found');
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
        });

        it('throw an error if anything unexpected happens when creating the user', async () => {
            const mockBody = {
                city: "mockCity",
                gender: "mockGender",
                looking_for_matches: true,
                photo_urls: ["mockPhotoUrl1"],
                pinned_url: "mockPinnedUrl",
                pref_gender: ["mockPrefGender"],
                pref_relation_styles: ["mockPrefRelationStyles"],
                visibility: 'public' as "public" | "member",
                wants_kids_strength: 2,
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockUser = {
                createdTime: Date.now() - 2 * 60 * 60 * 1000, //2 hours ago
                name: "mockName",
                username: "mockUserName"
            };

            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: null});
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockUser);
            (supabaseUsers.updateUser as jest.Mock).mockReturnValue(null);
            (supabaseUtils.insert as jest.Mock).mockReturnValue(null);
            (tryCatch as jest.Mock).mockResolvedValueOnce({data: null, error: Error});

            await expect(createProfile(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError('Error creating user');
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
        });
    });
});