import * as supabaseInit from "shared/supabase/init";
import {getCompatibleProfiles} from "api/compatible-profiles";

jest.mock('shared/supabase/init')

describe('getCompatibleProfiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const mockPg = {
      none: jest.fn().mockResolvedValue(null),
      one: jest.fn().mockResolvedValue(null),
      oneOrNone: jest.fn().mockResolvedValue(null),
      any: jest.fn().mockResolvedValue([]),
      map: jest.fn().mockResolvedValue([["abc", {score: 0.69}]]),
    } as any;
    (supabaseInit.createSupabaseDirectClient as jest.Mock)
      .mockReturnValue(mockPg);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('should', () => {
    it('successfully get compatible profiles when supplied with a valid user Id', async () => {
      const results = await getCompatibleProfiles("123");
      expect(results.status).toEqual('success');
      expect(results.profileCompatibilityScores).toEqual({"abc": {score: 0.69}});
    });

  });
});
