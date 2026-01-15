jest.mock('shared/supabase/init');

import { AuthedUser } from "api/helpers/endpoint";
import * as setLastTimeOnlineModule from "api/set-last-online-time";
import * as supabaseInit from "shared/supabase/init";

describe('setLastOnlineTimeUser', () => {
    let mockPg: any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            none: jest.fn(),
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);        
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should change the users last online time', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockProps = {} as any;
            
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            jest.spyOn(setLastTimeOnlineModule, 'setLastOnlineTimeUser');

            await setLastTimeOnlineModule.setLastOnlineTime(mockProps, mockAuth, mockReq);
            const [query, userId] = mockPg.none.mock.calls[0];
            
            expect(setLastTimeOnlineModule.setLastOnlineTimeUser).toBeCalledTimes(1);
            expect(setLastTimeOnlineModule.setLastOnlineTimeUser).toBeCalledWith(mockAuth.uid);
            expect(mockPg.none).toBeCalledTimes(1);            
            expect(userId).toContain(mockAuth.uid);
            expect(query).toContain("VALUES ($1, now())");
            expect(query).toContain("ON CONFLICT (user_id)");
            expect(query).toContain("DO UPDATE");
            expect(query).toContain("user_activity.last_online_time < now() - interval '1 minute'");
        });

        it('should return if there is no auth', async () => {
            const mockAuth = { } as any;
            const mockReq = {} as any;
            const mockProps = {} as any;
            
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            jest.spyOn(setLastTimeOnlineModule, 'setLastOnlineTimeUser');

            await setLastTimeOnlineModule.setLastOnlineTime(mockProps, mockAuth, mockReq);
            
            expect(setLastTimeOnlineModule.setLastOnlineTimeUser).not.toBeCalled();
        });
    });
});