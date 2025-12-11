jest.mock('shared/supabase/init');
jest.mock('shared/utils');
jest.mock('shared/profiles/parse-photos');
jest.mock('shared/supabase/users');
jest.mock('shared/supabase/utils');
jest.mock('common/util/try-catch');
jest.mock('shared/analytics');
jest.mock('common/discord/core');

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
            const mockExistingUser = {id: "mockExistingUserId"};
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
            (sharedAnalytics.track as jest.Mock).mockResolvedValue(null);
            (sendDiscordMessage as jest.Mock).mockResolvedValueOnce(null);
            (mockPg.one as jest.Mock).mockReturnValue(10);

            const results: any = await createProfile(mockBody, mockAuth, mockReq);
            expect(results.result).toEqual(mockData)
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