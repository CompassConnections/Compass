import * as setLastTimeOnlineModule from "api/set-last-online-time";
import * as supabaseModule from "shared/supabase/init";

describe('Should', () => {
    let mockPg: any;

    beforeEach(() => {
        mockPg = {
            none: jest.fn(),
        };
        jest.spyOn(supabaseModule, 'createSupabaseDirectClient')
            .mockReturnValue(mockPg);

        jest.clearAllMocks();
    });

    it('change the users last online time', async () => {
        const mockProfile = {user_id: 'Jonathon'};
        
        await setLastTimeOnlineModule.setLastOnlineTimeUser(mockProfile.user_id);

        expect(mockPg.none).toBeCalledTimes(1);

        const [query, userId] = mockPg.none.mock.calls[0];
        
        expect(userId).toContain(mockProfile.user_id);
        expect(query).toContain('user_activity.last_online_time')
    });
})