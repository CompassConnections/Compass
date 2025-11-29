jest.mock('shared/profiles/supabase')
jest.mock('common/profiles/compatibility-score')

import * as compatibleProfilesModule from "api/compatible-profiles";
import * as profilesSupabaseModules from "shared/profiles/supabase";
import * as compatabilityScoreModules from "common/profiles/compatibility-score";
import { Profile } from "common/profiles/profile";


describe('getCompatibleProfiles', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('successfully get compatible profiles when supplied with a valid user Id', async () => {
            const mockUser = { userId: "123" };
            const mockUserProfile = {
                id: 1,
                user_id: '123',
                user: {
                    username: "Mockuser.getProfile"
                },
                created_time: "10:30",
                explanation: "mockExplanation3",
                importance: 3,
            };
            const mockGenderCompatibleProfiles = [
                {
                    age: 20,
                    user_id: "1",
                    company: 'Mock Texan Roadhouse',
                    drinks_per_month: 3,
                    city: 'Mockingdale'
                },
                {
                    age: 23,
                    user_id: "2",
                    company: 'Chicken fried goose',
                    drinks_per_month: 2,
                    city: 'Mockingdale'
                },
                {
                    age: 40,
                    user_id: "3",
                    company: 'World Peace',
                    drinks_per_month: 10,
                    city: 'Velvet Suite'
                },
            ] as Partial<Profile> [];
            const mockProfileCompatibilityAnswers = [
                {
                    created_time: "10:30",
                    creator_id: "3",
                    explanation: "mockExplanation3",
                    id: 3,
                    importance: 3
                },
                {
                    created_time: "10:20",
                    creator_id: "2",
                    explanation: "mockExplanation2",
                    id: 2,
                    importance: 2
                },
                {
                    created_time: "10:10",
                    creator_id: "1",
                    explanation: "mockExplanation",
                    id: 1,
                    importance: 1
                },
            ];
            const mockCompatibilityScore = {
                score: 4,
                confidence: "low"
            };

            (profilesSupabaseModules.getProfile as jest.Mock)
                .mockResolvedValue(mockUserProfile);
            (profilesSupabaseModules.getGenderCompatibleProfiles as jest.Mock)
                .mockResolvedValue(mockGenderCompatibleProfiles);
            (profilesSupabaseModules.getCompatibilityAnswers as jest.Mock)
                .mockResolvedValue(mockProfileCompatibilityAnswers);
            (compatabilityScoreModules.getCompatibilityScore as jest.Mock)
                .mockReturnValue(mockCompatibilityScore);
            
            const results = await compatibleProfilesModule.getCompatibleProfiles(mockUser.userId);
            expect(profilesSupabaseModules.getProfile).toBeCalledWith(mockUser.userId);
            expect(profilesSupabaseModules.getProfile).toBeCalledTimes(1);
            expect(profilesSupabaseModules.getGenderCompatibleProfiles).toBeCalledWith(mockUserProfile);
            expect(profilesSupabaseModules.getGenderCompatibleProfiles).toBeCalledTimes(1);
            expect(compatabilityScoreModules.getCompatibilityScore).toBeCalledTimes(mockGenderCompatibleProfiles.length)
            expect(results.status).toEqual('success');
            // expect(results.profile).toEqual(mockUserProfile);
            // expect(results.compatibleProfiles).toContain(mockGenderCompatibleProfiles[0]);
            expect(Object.values(results.profileCompatibilityScores)).toContain(mockCompatibilityScore);
        });

        it('throw an error if there is no profile matching the user Id', async () => {
            const mockUser = { userId: "123" };

            expect(compatibleProfilesModule.getCompatibleProfiles(mockUser.userId))
                .rejects
                .toThrowError('Profile not found');
            expect(profilesSupabaseModules.getProfile).toBeCalledWith(mockUser.userId);
            expect(profilesSupabaseModules.getProfile).toBeCalledTimes(1);
        });

        it.skip('return no profiles if there is no match', async () => {
            const mockUser = { userId: "123" };
            const mockUserProfile = {
                id: 1,
                user_id: '123',
                user: {
                    username: "Mockuser.getProfile"
                },
                created_time: "10:30",
                explanation: "mockExplanation3",
                importance: 3,
            };
            const mockGenderCompatibleProfiles = [
                {
                    age: 20,
                    user_id: "1",
                    company: 'Mock Texan Roadhouse',
                    drinks_per_month: 3,
                    city: 'Mockingdale'
                },
                {
                    age: 23,
                    user_id: "2",
                    company: 'Chicken fried goose',
                    drinks_per_month: 2,
                    city: 'Mockingdale'
                },
                {
                    age: 40,
                    user_id: "3",
                    company: 'World Peace',
                    drinks_per_month: 10,
                    city: 'Velvet Suite'
                },
            ] as Partial<Profile> [];
            const mockProfileCompatibilityAnswers = [
                {
                    created_time: "10:30",
                    creator_id: "3",
                    explanation: "mockExplanation3",
                    id: 3,
                    importance: 3
                },
                {
                    created_time: "10:20",
                    creator_id: "2",
                    explanation: "mockExplanation2",
                    id: 2,
                    importance: 2
                },
                {
                    created_time: "10:10",
                    creator_id: "1",
                    explanation: "mockExplanation",
                    id: 1,
                    importance: 1
                },
            ];
            const mockCompatibilityScore = {
                score: 4,
                confidence: "low"
            };

            (profilesSupabaseModules.getProfile as jest.Mock)
                .mockResolvedValue(mockUserProfile);
            (profilesSupabaseModules.getGenderCompatibleProfiles as jest.Mock)
                .mockResolvedValue(mockGenderCompatibleProfiles);
            (profilesSupabaseModules.getCompatibilityAnswers as jest.Mock)
                .mockResolvedValue(mockProfileCompatibilityAnswers);
            (compatabilityScoreModules.getCompatibilityScore as jest.Mock)
                .mockReturnValue(null);
            
            const results = await compatibleProfilesModule.getCompatibleProfiles(mockUser.userId)
            console.log(results);
            
        })
    });
});
