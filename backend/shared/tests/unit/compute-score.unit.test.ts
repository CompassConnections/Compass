import {recomputeCompatibilityScoresForUser} from "api/compatibility/compute-scores";
import * as supabaseInit from "shared/supabase/init";
import * as profilesSupabaseModules from "shared/profiles/supabase";
import * as compatibilityScoreModules from "common/profiles/compatibility-score";
import {Profile} from "common/profiles/profile";

jest.mock('shared/profiles/supabase')
jest.mock('shared/supabase/init')
jest.mock('common/profiles/compatibility-score')


describe('recomputeCompatibilityScoresForUser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    let mockPg = {
      none: jest.fn().mockResolvedValue(null),
      one: jest.fn().mockResolvedValue(null),
      oneOrNone: jest.fn().mockResolvedValue(null),
      any: jest.fn().mockResolvedValue([]),
    } as any;
    (supabaseInit.createSupabaseDirectClient as jest.Mock)
      .mockReturnValue(mockPg);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('should', () => {
    it('successfully get compute score when supplied with a valid user Id', async () => {
      const mockUser = {userId: "123"};
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
      const mockAnswersForUser = [{
        created_time: "",
        creator_id: mockUser.userId,
        explanation: "",
        id: 1,
        importance: 1,
        multiple_choice: 0,
        pref_choices: [0, 1],
        question_id: 1,
      }];

      (profilesSupabaseModules.getProfile as jest.Mock)
        .mockResolvedValue(mockUserProfile);
      (profilesSupabaseModules.getGenderCompatibleProfiles as jest.Mock)
        .mockResolvedValue(mockGenderCompatibleProfiles);
      (profilesSupabaseModules.getCompatibilityAnswers as jest.Mock)
        .mockResolvedValue(mockProfileCompatibilityAnswers);
      (profilesSupabaseModules.getAnswersForUser as jest.Mock)
        .mockResolvedValue(mockAnswersForUser);
      (compatibilityScoreModules.getCompatibilityScore as jest.Mock)
        .mockReturnValue(mockCompatibilityScore);
      (compatibilityScoreModules.hasAnsweredQuestions as jest.Mock)
        .mockReturnValue(true);

      const results = await recomputeCompatibilityScoresForUser(mockUser.userId);
      expect(profilesSupabaseModules.getProfile).toBeCalledWith(mockUser.userId);
      expect(profilesSupabaseModules.getProfile).toBeCalledTimes(1);
      expect(profilesSupabaseModules.getGenderCompatibleProfiles).toBeCalledWith(mockUserProfile);
      expect(profilesSupabaseModules.getGenderCompatibleProfiles).toBeCalledTimes(1);
      expect(compatibilityScoreModules.getCompatibilityScore).toBeCalledTimes(mockGenderCompatibleProfiles.length)
      // expect(results.profile).toEqual(mockUserProfile);
      // expect(results.compatibleProfiles).toContain(mockGenderCompatibleProfiles[0]);
      expect(results?.[0][0]).toEqual("1");
      expect(results?.[0][1]).toEqual("123");
      expect(results?.[0][2]).toBeCloseTo(mockCompatibilityScore.score, 2);
    });

    it('throw an error if there is no profile matching the user Id', async () => {
      const mockUser = {userId: "123"};

      expect(recomputeCompatibilityScoresForUser(mockUser.userId))
        .rejects
        .toThrowError('Profile not found');
      expect(profilesSupabaseModules.getProfile).toBeCalledWith(mockUser.userId);
      expect(profilesSupabaseModules.getProfile).toBeCalledTimes(1);
    });

  });
});
