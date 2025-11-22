jest.mock('jsonwebtoken');

import { getSupabaseToken } from "api/get-supabase-token";
import * as jsonWebtokenModules from "jsonwebtoken";
import * as constants from "common/envs/constants";
import { AuthedUser } from "api/helpers/endpoint";

describe.skip('getSupabaseToken', () => {
    // const originalSupabaseJwtSecret = process.env.SUPABASE_JWT_SECRET
    // const originalInstanceId = constants.ENV_CONFIG.supabaseInstanceId
    // const originalProjectId = constants.ENV_CONFIG.firebaseConfig.projectId

    // describe('should', () => {
    //     beforeEach(() => {
    //         jest.resetAllMocks();

    //         process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-123';
    //         constants.ENV_CONFIG.supabaseInstanceId = 'test-instance-id';
    //         constants.ENV_CONFIG.firebaseConfig.projectId = 'test-project-id';

    //         (jsonWebtokenModules.sign as jest.Mock).mockReturnValue('fake-jwt-token-abc123');
    //     });

    //     afterEach(() => {
    //         if (originalSupabaseJwtSecret === undefined) {
    //             delete process.env.SUPABASE_JWT_SECRET;
    //         } else {
    //             process.env.SUPABASE_JWT_SECRET = originalSupabaseJwtSecret;
    //         }
    //         constants.ENV_CONFIG.supabaseInstanceId = originalInstanceId;
    //         constants.ENV_CONFIG.firebaseConfig.projectId = originalProjectId;

    //         jest.restoreAllMocks();
    //     });

    //     it('successfully generate a JTW token with correct parameters', async () => {
    //         const mockParams = {} as any;
    //         const mockAuth = {uid: '321'} as AuthedUser;
    //         const result = await getSupabaseToken(mockParams, mockAuth, mockParams)

    //         expect(result).toEqual({
    //             jwt: 'fake-jwt-token-abc123'
    //         })
    //     })
    // });
});

describe('getCompatibleProfiles', () => {
    it('skip', async () => {
        console.log('Skipped test suite');
        
    })
})