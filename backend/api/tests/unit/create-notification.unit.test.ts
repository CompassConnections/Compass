jest.mock('common/util/try-catch');
jest.mock('shared/supabase/init');
jest.mock('shared/supabase/notifications');

import * as supabaseInit from "shared/supabase/init";
import * as createNotificationModules from "api/create-notification";
import { tryCatch } from "common/util/try-catch";
import * as supabaseNotifications from "shared/supabase/notifications";
import { Notification } from "common/notifications";

type MockNotificationUser = Pick<Notification, 'userId'>;

describe('createNotifications', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        const mockPg = {
            many: jest.fn().mockReturnValue(null)
        } as any;

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('sucessfully create a notification', async () => {
            const mockUsers = [
                {
                    created_time: "mockCreatedTime",
                    data: {"mockData": "mockDataJson"},
                    id: "mockId",
                    name: "mockName",
                    name_user_vector: "mockNUV",
                    username: "mockUsername"
                },
            ];
            const mockNotification = {
                userId: "mockUserId"
            } as MockNotificationUser;

            (tryCatch as jest.Mock).mockResolvedValue({data: mockUsers, error:null});
            (supabaseNotifications.insertNotificationToSupabase as jest.Mock)
                .mockResolvedValue(null);
            
            const results = await createNotificationModules.createNotifications(mockNotification as Notification);
            expect(results?.success).toBeTruthy;
        });

        it('throws an error if its unable to fetch users', async () => {
            const mockUsers = [
                {
                    created_time: "mockCreatedTime",
                    data: {"mockData": "mockDataJson"},
                    id: "mockId",
                    name: "mockName",
                    name_user_vector: "mockNUV",
                    username: "mockUsername"
                },
            ];
            const mockNotification = {
                userId: "mockUserId"
            } as MockNotificationUser;

            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            (tryCatch as jest.Mock).mockResolvedValue({data: mockUsers, error:Error});
            
            await createNotificationModules.createNotifications(mockNotification as Notification)
            expect(errorSpy).toHaveBeenCalledWith('Error fetching users', expect.objectContaining({name: 'Error'}))
        });

        it('throws an error if there are no users', async () => {
            const mockUsers = [
                {
                    created_time: "mockCreatedTime",
                    data: {"mockData": "mockDataJson"},
                    id: "mockId",
                    name: "mockName",
                    name_user_vector: "mockNUV",
                    username: "mockUsername"
                },
            ];
            const mockNotification = {
                userId: "mockUserId"
            } as MockNotificationUser;

            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            (tryCatch as jest.Mock).mockResolvedValue({data: null, error:null});
            
            await createNotificationModules.createNotifications(mockNotification as Notification)
            expect(errorSpy).toHaveBeenCalledWith('No users found')
        });
    });
});