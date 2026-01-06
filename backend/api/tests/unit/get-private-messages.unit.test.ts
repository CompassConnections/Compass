jest.mock('shared/supabase/init');
jest.mock('common/util/try-catch');
jest.mock('shared/supabase/messages');

import * as getPrivateMessages from "api/get-private-messages";
import * as supabaseInit from "shared/supabase/init";
import { tryCatch } from "common/util/try-catch";
import { AuthedUser } from "api/helpers/endpoint";

describe('getChannelMemberships', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            map: jest.fn(),
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should return channel memberships', async () => {
            const mockProps = {
                limit: 10,
                channelId: 1,
                createdTime: "mockCreatedTime",
                lastUpdatedTime: "mockLastUpdatedTime"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockChannels = [
                {
                    channel_id: 123,
                    notify_after_time: "mockNotifyAfterTime",
                    created_time: "mockCreatedTime",
                    last_updated_time: "mockLastUpdatedTime"
                }
            ];
            const mockMembers = [
                {
                    channel_id: 1234,
                    user_id: "mockUserId"
                }
            ];
            (mockPg.map as jest.Mock)
                .mockResolvedValueOnce(mockChannels)
                .mockResolvedValueOnce(mockMembers);
            
            const results: any = await getPrivateMessages.getChannelMemberships(mockProps, mockAuth, mockReq);
            
            expect(results.channels).toBe(mockChannels);
            expect(Object.keys(results.memberIdsByChannelId)[0]).toBe(String(mockMembers[0].channel_id));
            expect(Object.values(results.memberIdsByChannelId)[0]).toContain(mockMembers[0].user_id);

            expect(mockPg.map).toBeCalledTimes(2);
            expect(mockPg.map).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('select channel_id, notify_after_time, pumcm.created_time, last_updated_time'),
                [mockAuth.uid, mockProps.channelId, mockProps.limit],
                expect.any(Function)
            );
            expect(mockPg.map).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('select channel_id, user_id'),
                [mockAuth.uid, [mockChannels[0].channel_id]],
                expect.any(Function)
            );
        });

        it('should return channel memberships if there is no channelId', async () => {
            const mockProps = {
                limit: 10,
                createdTime: "mockCreatedTime",
                lastUpdatedTime: "mockLastUpdatedTime"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockChannels = [
                {
                    channel_id: 123,
                    notify_after_time: "mockNotifyAfterTime",
                    created_time: "mockCreatedTime",
                    last_updated_time: "mockLastUpdatedTime"
                }
            ];
            const mockMembers = [
                {
                    channel_id: 1234,
                    user_id: "mockUserId"
                }
            ];
            (mockPg.map as jest.Mock)
                .mockResolvedValueOnce(mockChannels)
                .mockResolvedValueOnce(mockMembers);
            
            const results: any = await getPrivateMessages.getChannelMemberships(mockProps, mockAuth, mockReq);
            
            expect(results.channels).toBe(mockChannels);
            expect(Object.keys(results.memberIdsByChannelId)[0]).toBe(String(mockMembers[0].channel_id));
            expect(Object.values(results.memberIdsByChannelId)[0]).toContain(mockMembers[0].user_id);

            expect(mockPg.map).toBeCalledTimes(2);
            expect(mockPg.map).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('with latest_channels as (select distinct on (pumc.id) pumc.id                as channel_id'),
                [mockAuth.uid, mockProps.createdTime, mockProps.limit, mockProps.lastUpdatedTime],
                expect.any(Function)
            );
            expect(mockPg.map).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('select channel_id, user_id'),
                [mockAuth.uid, [mockChannels[0].channel_id]],
                expect.any(Function)
            );
        });

        it('should return nothing if there are no channels', async () => {
            const mockProps = {
                limit: 10,
                channelId: 1,
                createdTime: "mockCreatedTime",
                lastUpdatedTime: "mockLastUpdatedTime"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (mockPg.map as jest.Mock).mockResolvedValueOnce(null);
            
            const results: any = await getPrivateMessages.getChannelMemberships(mockProps, mockAuth, mockReq);
            
            console.log(results);
            
            expect(results).toStrictEqual({ channels: [], memberIdsByChannelId: {} });

            expect(mockPg.map).toBeCalledTimes(1);
            expect(mockPg.map).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('select channel_id, notify_after_time, pumcm.created_time, last_updated_time'),
                [mockAuth.uid, mockProps.channelId, mockProps.limit],
                expect.any(Function)
            );
        });
    });
});

describe('getChannelMessagesEndpoint', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            map: jest.fn(),
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    describe('when given valid input', () => {
        it('should return the channel messages endpoint', async () => {
            const mockProps = {
                limit: 10,
                channelId: 1,
                id: 123
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = ['mockResult'] as any;

            (mockPg.map as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockData, error: null});

            const result = await getPrivateMessages.getChannelMessagesEndpoint(mockProps, mockAuth, mockReq);
            
            expect(result).toBe(mockData);
            expect(mockPg.map).toBeCalledTimes(1);
            expect(mockPg.map).toBeCalledWith(
                expect.stringContaining('select *, created_time as created_time_ts'),
                [mockProps.channelId, mockAuth.uid, mockProps.limit, mockProps.id],
                expect.any(Function)
            );

        });
    });
    describe('when an error occurs', () => {
        it('should throw if unable to get messages', async () => {
            const mockProps = {
                limit: 10,
                channelId: 1,
                id: 123
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockData = ['mockResult'] as any;

            (mockPg.map as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error});

            expect(getPrivateMessages.getChannelMessagesEndpoint(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Error getting messages');
        });
    });
});

describe('getLastSeenChannelTime', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            map: jest.fn(),
        };
        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    describe('when given valid input', () => {
        it('should return the last seen channel time', async () => {
            const mockProps = {
                channelIds: [
                    1,
                    2,
                    3,
                ]
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockUnseens = [
                [1, "mockString"]
            ];

            (mockPg.map as jest.Mock).mockResolvedValue(mockUnseens);

            const result = await getPrivateMessages.getLastSeenChannelTime(mockProps, mockAuth, mockReq);

            expect(result).toBe(mockUnseens);
            expect(mockPg.map).toBeCalledTimes(1);
            expect(mockPg.map).toBeCalledWith(
                expect.stringContaining('select distinct on (channel_id) channel_id, created_time'),
                [mockProps.channelIds, mockAuth.uid],
                expect.any(Function)
            );

        });
    });
});

describe('setChannelLastSeenTime', () => {
    let mockPg = {} as any;
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
        it('should set channel last seen time', async () => {
            const mockProps = {
                channelId: 1
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (mockPg.none as jest.Mock).mockResolvedValue(null);

            await getPrivateMessages.setChannelLastSeenTime(mockProps, mockAuth, mockReq);

            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
                expect.stringContaining('insert into private_user_seen_message_channels (user_id, channel_id)'),
                [mockAuth.uid, mockProps.channelId]
            );
        });
    });
});