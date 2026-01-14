jest.mock('shared/supabase/init');

import {getCompatibleProfiles} from "api/compatible-profiles";
import * as supabaseInit from "shared/supabase/init";


describe('getCompatibleProfiles', () => {
  let mockPg = {} as any;
  beforeEach(() => {
    jest.resetAllMocks();
    mockPg = {
      map: jest.fn().mockResolvedValue([]),
    };
    (supabaseInit.createSupabaseDirectClient as jest.Mock)
      .mockReturnValue(mockPg);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when given valid input', () => {
    it('should successfully get compatible profiles', async () => {
      const mockProps = '123';
      const mockScores = ["abc", { score: 0.69 }];
      const mockScoresFromEntries = {"abc": { score: 0.69 }};

      (mockPg.map as jest.Mock).mockResolvedValue([mockScores]);

      const results = await getCompatibleProfiles(mockProps);
      const [sql, param, fn] = mockPg.map.mock.calls[0];
      
      expect(results.status).toEqual('success');
      expect(results.profileCompatibilityScores).toEqual(mockScoresFromEntries);
      expect(mockPg.map).toBeCalledTimes(1);
      expect(sql).toContain('select *');
      expect(sql).toContain('from compatibility_scores');
      expect(param).toStrictEqual([mockProps]);
      expect(fn).toEqual(expect.any(Function));
    });
  });
});
