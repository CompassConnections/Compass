jest.mock('shared/supabase/init');

import * as setLastTimeOnlineModule from "api/set-last-online-time";
import * as supabaseModule from "shared/supabase/init";

describe('Should', () => {
    let mockPg: any;

    beforeEach(() => {
        mockPg = {
            none: jest.fn(),
        };
        (supabaseModule.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);

        jest.clearAllMocks();
    });

    it('change the users last online time', async () => {
        const mockProfile = {user_id: 'Jonathon'};
        
        await setLastTimeOnlineModule.setLastOnlineTimeUser(mockProfile.user_id);

        expect(mockPg.none).toBeCalledTimes(1);

        const [query, userId] = mockPg.none.mock.calls[0];
        
        expect(userId).toContain(mockProfile.user_id);
        expect(query).toContain("VALUES ($1, now())")
        expect(query).toContain("ON CONFLICT (user_id)")
        expect(query).toContain("DO UPDATE")
        expect(query).toContain("user_activity.last_online_time < now() - interval '1 minute'")
    });
})