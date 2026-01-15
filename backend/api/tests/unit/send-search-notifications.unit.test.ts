jest.mock('shared/supabase/init');
jest.mock('shared/supabase/sql-builder');
jest.mock('api/get-profiles');
jest.mock('email/functions/helpers');
jest.mock('lodash');

import * as searchNotificationModules from "api/send-search-notifications";
import * as supabaseInit from "shared/supabase/init";
import * as sqlBuilderModules from "shared/supabase/sql-builder";
import * as profileModules from "api/get-profiles";
import * as helperModules from "email/functions/helpers";
import * as lodashModules from "lodash";

describe('sendSearchNotification', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            map: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should send search notification emails', async () => {
            const mockSearchQuery = "mockSqlQuery";
            const mockSearches = [
                {
                    created_time: "mockSearchCreatedTime",
                    creator_id: "mockCreatorId",
                    id: 123,
                    last_notified_at: null,
                    location: {"mockLocation" : "mockLocationValue"},
                    search_filters: null,
                    search_name: null,
                },
                {
                    created_time: "mockCreatedTime1",
                    creator_id: "mockCreatorId1",
                    id: 1234,
                    last_notified_at: null,
                    location: {"mockLocation1" : "mockLocationValue1"},
                    search_filters: null,
                    search_name: null,
                },
            ];
            const _mockUsers = [
                {
                    created_time: "mockUserCreatedTime",
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId",
                    name: "mockName",
                    name_username_vector: "mockNameUsernameVector",
                    username: "mockUsername",
                },
                {
                    created_time: "mockUserCreatedTime1",
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1",
                    name: "mockName1",
                    name_username_vector: "mockNameUsernameVector1",
                    username: "mockUsername1",
                },
            ];
            const mockUsers = {
                "user1": {
                    created_time: "mockUserCreatedTime",
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId",
                    name: "mockName",
                    name_username_vector: "mockNameUsernameVector",
                    username: "mockUsername",
                },
                "user2": {
                    created_time: "mockUserCreatedTime1",
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1",
                    name: "mockName1",
                    name_username_vector: "mockNameUsernameVector1",
                    username: "mockUsername1",
                },
            };
            const _mockPrivateUsers = [
                {
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId"
                },
                {
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1"
                },
            ];
            const mockPrivateUsers = {
                "privateUser1": {
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId"
                },
                "privateUser2": {
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1"
                },
            };
            const mockProfiles = [
                {
                    name: "mockProfileName",
                    username: "mockProfileUsername"
                },
                {
                    name: "mockProfileName1",
                    username: "mockProfileUsername1"
                },
            ];
            const mockProps = [
                {
                    skipId: "mockCreatorId",
                    lastModificationWithin: '24 hours',
                    shortBio: true,
                },
                {
                    skipId: "mockCreatorId1",
                    lastModificationWithin: '24 hours',
                    shortBio: true,
                },
            ];
            (sqlBuilderModules.renderSql as jest.Mock)
                .mockReturnValueOnce(mockSearchQuery)
                .mockReturnValueOnce('usersRenderSql')
                .mockReturnValueOnce('privateUsersRenderSql');
            (sqlBuilderModules.select as jest.Mock).mockReturnValue('Select');
            (sqlBuilderModules.from as jest.Mock).mockReturnValue('From');
            (mockPg.map as jest.Mock)
                .mockResolvedValueOnce(mockSearches)
                .mockResolvedValueOnce(_mockUsers)
                .mockResolvedValueOnce(_mockPrivateUsers);
            (lodashModules.keyBy as jest.Mock)
                .mockReturnValueOnce(mockUsers)
                .mockReturnValueOnce(mockPrivateUsers);
            (profileModules.loadProfiles as jest.Mock)
                .mockResolvedValueOnce({profiles: mockProfiles})
                .mockResolvedValueOnce({profiles: mockProfiles});
            jest.spyOn(searchNotificationModules, 'notifyBookmarkedSearch');
            (helperModules.sendSearchAlertsEmail as jest.Mock).mockResolvedValue(null);

            const result = await searchNotificationModules.sendSearchNotifications();

            expect(result.status).toBe('success');
            expect(sqlBuilderModules.renderSql).toBeCalledTimes(3);
            expect(sqlBuilderModules.renderSql).toHaveBeenNthCalledWith(
                1,
                'Select',
                'From'
            );
            expect(sqlBuilderModules.renderSql).toHaveBeenNthCalledWith(
                2,
                'Select',
                'From'
            );
            expect(sqlBuilderModules.renderSql).toHaveBeenNthCalledWith(
                3,
                'Select',
                'From'
            );
            expect(mockPg.map).toBeCalledTimes(3);
            expect(mockPg.map).toHaveBeenNthCalledWith(
                1,
                mockSearchQuery,
                [],
                expect.any(Function)
            );
            expect(mockPg.map).toHaveBeenNthCalledWith(
                2,
                'usersRenderSql',
                [],
                expect.any(Function)
            );
            expect(mockPg.map).toHaveBeenNthCalledWith(
                3,
                'privateUsersRenderSql',
                [],
                expect.any(Function)
            );
            expect(profileModules.loadProfiles).toBeCalledTimes(2);
            expect(profileModules.loadProfiles).toHaveBeenNthCalledWith(
                1,
                mockProps[0]
            );
            expect(profileModules.loadProfiles).toHaveBeenNthCalledWith(
                2,
                mockProps[1]
            );
            expect(searchNotificationModules.notifyBookmarkedSearch).toBeCalledTimes(1);
            expect(searchNotificationModules.notifyBookmarkedSearch).toBeCalledWith({});
        });

        it('should send search notification emails when there is a matching creator_id entry in private users', async () => {
            const mockSearchQuery = "mockSqlQuery";
            const mockSearches = [
                {
                    created_time: "mockSearchCreatedTime",
                    creator_id: "mockCreatorId",
                    id: 123,
                    last_notified_at: null,
                    location: {"mockLocation" : "mockLocationValue"},
                    search_filters: null,
                    search_name: null,
                },
                {
                    created_time: "mockCreatedTime1",
                    creator_id: "mockCreatorId1",
                    id: 1234,
                    last_notified_at: null,
                    location: {"mockLocation1" : "mockLocationValue1"},
                    search_filters: null,
                    search_name: null,
                },
            ];
            const _mockUsers = [
                {
                    created_time: "mockUserCreatedTime",
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId",
                    name: "mockName",
                    name_username_vector: "mockNameUsernameVector",
                    username: "mockUsername",
                },
                {
                    created_time: "mockUserCreatedTime1",
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1",
                    name: "mockName1",
                    name_username_vector: "mockNameUsernameVector1",
                    username: "mockUsername1",
                },
            ];
            const mockUsers = {
                "user1": {
                    created_time: "mockUserCreatedTime",
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId",
                    name: "mockName",
                    name_username_vector: "mockNameUsernameVector",
                    username: "mockUsername",
                },
                "user2": {
                    created_time: "mockUserCreatedTime1",
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1",
                    name: "mockName1",
                    name_username_vector: "mockNameUsernameVector1",
                    username: "mockUsername1",
                },
            };
            const _mockPrivateUsers = [
                {
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId"
                },
                {
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1"
                },
            ];
            const mockPrivateUsers = {
                "mockCreatorId": {
                    data: {"mockData" : "mockDataValue"},
                    id: "mockId"
                },
                "mockCreatorId1": {
                    data: {"mockData1" : "mockDataValue1"},
                    id: "mockId1"
                },
            };
            const mockProfiles = [
                {
                    name: "mockProfileName",
                    username: "mockProfileUsername"
                },
                {
                    name: "mockProfileName1",
                    username: "mockProfileUsername1"
                },
            ];
            (sqlBuilderModules.renderSql as jest.Mock)
                .mockReturnValueOnce(mockSearchQuery)
                .mockReturnValueOnce('usersRenderSql')
                .mockReturnValueOnce('privateUsersRenderSql');
            (sqlBuilderModules.select as jest.Mock).mockReturnValue('Select');
            (sqlBuilderModules.from as jest.Mock).mockReturnValue('From');
            (mockPg.map as jest.Mock)
                .mockResolvedValueOnce(mockSearches)
                .mockResolvedValueOnce(_mockUsers)
                .mockResolvedValueOnce(_mockPrivateUsers);
            (lodashModules.keyBy as jest.Mock)
                .mockReturnValueOnce(mockUsers)
                .mockReturnValueOnce(mockPrivateUsers);
            (profileModules.loadProfiles as jest.Mock)
                .mockResolvedValueOnce({profiles: mockProfiles})
                .mockResolvedValueOnce({profiles: mockProfiles});
            jest.spyOn(searchNotificationModules, 'notifyBookmarkedSearch');
            (helperModules.sendSearchAlertsEmail as jest.Mock).mockResolvedValue(null);

            await searchNotificationModules.sendSearchNotifications();

            expect(searchNotificationModules.notifyBookmarkedSearch).toBeCalledTimes(1);
            expect(searchNotificationModules.notifyBookmarkedSearch).not.toBeCalledWith({});
            
        });
    });
});