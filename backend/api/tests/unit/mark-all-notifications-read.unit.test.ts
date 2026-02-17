jest.mock('shared/supabase/init');

import {markAllNotifsRead} from "api/mark-all-notifications-read";
import {AuthedUser} from "api/helpers/endpoint";
import * as supabaseInit from "shared/supabase/init";
import {sqlMatch} from 'common/test-utils'

describe('markAllNotifsRead', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            none: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should mark all notifications as read', async () => {
            const mockProps = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            await markAllNotifsRead(mockProps, mockAuth, mockReq);
            
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
              sqlMatch('update user_notifications'),
                [mockAuth.uid]
            );
        });    
    });
});