jest.mock('shared/supabase/init');

import {AuthedUser} from "api/helpers/endpoint";
import {saveSubscription} from "api/save-subscription";
import * as supabaseInit from "shared/supabase/init";
import {sqlMatch} from 'common/test-utils'

describe('saveSubscription', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            oneOrNone: jest.fn(),
            none: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should save user subscription', async () => {
            const mockBody = {
                subscription: {
                    endpoint: "mockEndpoint",
                    keys: "mockKeys",
                }
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockExists = { id: "mockId" };

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockExists);
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            
            const result = await saveSubscription(mockBody, mockAuth, mockReq);

            expect(result.success).toBeTruthy();
            expect(mockPg.oneOrNone).toBeCalledTimes(1);
            expect(mockPg.oneOrNone).toBeCalledWith(
              sqlMatch('select id from push_subscriptions where endpoint = $1'),
                [mockBody.subscription.endpoint]
            );
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
              sqlMatch('update push_subscriptions set keys = $1, user_id = $2 where id = $3'),
                [mockBody.subscription.keys, mockAuth.uid, mockExists.id]
            );
        });

        it('should save user subscription even if this is their first one', async () => {
            const mockBody = {
                subscription: {
                    endpoint: "mockEndpoint",
                    keys: "mockKeys",
                }
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(false);
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            
            const result = await saveSubscription(mockBody, mockAuth, mockReq);

            expect(result.success).toBeTruthy();
            expect(mockPg.oneOrNone).toBeCalledTimes(1);
            expect(mockPg.oneOrNone).toBeCalledWith(
              sqlMatch('select id from push_subscriptions where endpoint = $1'),
                [mockBody.subscription.endpoint]
            );
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
              sqlMatch('insert into push_subscriptions(endpoint, keys, user_id) values($1, $2, $3)'),
                [mockBody.subscription.endpoint, mockBody.subscription.keys, mockAuth.uid]
            );
        });
    });
    describe('when an error occurs', () => {
        it('should throw if the subscription object is invalid', async () => {
            const mockBody = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            
            expect(saveSubscription(mockBody, mockAuth, mockReq))
                .rejects
                .toThrow('Invalid subscription object');
        });

        it('should throw if unable to save subscription', async () => {
            const mockBody = {
                subscription: {
                    endpoint: "mockEndpoint",
                    keys: "mockKeys",
                }
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockExists = { id: "mockId" };

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockExists);
            (mockPg.none as jest.Mock).mockRejectedValue(new Error('Saving error'));
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            expect(saveSubscription(mockBody, mockAuth, mockReq))
                .rejects
                .toThrow('Failed to save subscription');

            // expect(errorSpy).toBeCalledTimes(1);
            // expect(errorSpy).toBeCalledWith(
            //     expect.stringContaining('Error saving subscription'),
            //     expect.any(Error)
            // );
        });
    });
});