import {sqlMatch} from "common/test-utils";
import {report} from "api/report";
import * as supabaseInit from "shared/supabase/init";
import {tryCatch} from "common/util/try-catch";
import * as supabaseUtils from "shared/supabase/utils";
import {sendDiscordMessage} from "common/discord/core";
import {AuthedUser} from "api/helpers/endpoint";

jest.mock('shared/supabase/init');
jest.mock('common/util/try-catch');
jest.mock('shared/supabase/utils');
jest.mock('common/discord/core');

describe('report', () => {
    let mockPg = {} as any;
    beforeEach(() => {
        jest.resetAllMocks();
        mockPg = {
            oneOrNone: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('when given valid input', () => {
        it('should successfully file a report', async () => {
            const mockBody = {
                contentOwnerId: "mockContentOwnerId",
                contentType: "user" as "user" | "comment" | "contract",
                contentId: "mockContentId",
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReporter = {
                created_time: "mockCreatedTime",
                data: {"mockData" : "mockDataValue"},
                id: "mockId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername",
            };
            const mockReported = {
                created_time: "mockCreatedTimeReported",
                data: {"mockDataReported" : "mockDataValueReported"},
                id: "mockIdReported",
                name: "mockNameReported",
                name_username_vector: "mockNameUsernameVectorReported",
                username: "mockUsernameReported",
            };

            (supabaseUtils.insert as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockBody, error: null});

            const result = await report(mockBody, mockAuth, mockReq);

            expect(result.success).toBeTruthy();
            expect(result.result).toStrictEqual({});

            (mockPg.oneOrNone as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: mockReporter, error: null})
                .mockResolvedValueOnce({data: mockReported, error: null});
            (sendDiscordMessage as jest.Mock).mockResolvedValue(null);

            await result.continue();

            expect(mockPg.oneOrNone).toBeCalledTimes(2);
            expect(mockPg.oneOrNone).toHaveBeenNthCalledWith(
                1,
              sqlMatch('select * from users where id = $1'),
                [mockAuth.uid]
            );
            expect(mockPg.oneOrNone).toHaveBeenNthCalledWith(
                2,
              sqlMatch('select * from users where id = $1'),
                [mockBody.contentOwnerId]
            );
            expect(sendDiscordMessage).toBeCalledTimes(1);
            expect(sendDiscordMessage).toBeCalledWith(
                expect.stringContaining('**New Report**'),
                'reports'
            );
        });
    });
    describe('when an error occurs', () => {
        it('should throw if failed to create the report', async () => {
            const mockBody = {
                contentOwnerId: "mockContentOwnerId",
                contentType: "user" as "user" | "comment" | "contract",
                contentId: "mockContentId",
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (supabaseUtils.insert as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error});

            expect(report(mockBody, mockAuth, mockReq))
                .rejects
                .toThrow('Failed to create report: ');
        });

        it('should throw if unable to get information about the user', async () => {
            const mockBody = {
                contentOwnerId: "mockContentOwnerId",
                contentType: "user" as "user" | "comment" | "contract",
                contentId: "mockContentId",
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (supabaseUtils.insert as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockBody, error: null});

            const result = await report(mockBody, mockAuth, mockReq);

            (mockPg.oneOrNone as jest.Mock)
                .mockReturnValueOnce(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: null, error: Error});

            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await result.continue();

            expect(errorSpy).toBeCalledWith(
                expect.stringContaining('Failed to get user for report'),
                expect.objectContaining({name: 'Error'})
            );
        });

        it('should throw if unable to get information about the user being reported', async () => {
            const mockBody = {
                contentOwnerId: "mockContentOwnerId",
                contentType: "user" as "user" | "comment" | "contract",
                contentId: "mockContentId",
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReporter = {
                created_time: "mockCreatedTime",
                data: {"mockData" : "mockDataValue"},
                id: "mockId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername",
            };

            (supabaseUtils.insert as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockBody, error: null});

            const result = await report(mockBody, mockAuth, mockReq);

            (mockPg.oneOrNone as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: mockReporter, error: null})
                .mockResolvedValueOnce({data: null, error: Error});
            
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await result.continue();

            expect(errorSpy).toBeCalledWith(
                expect.stringContaining('Failed to get reported user for report'),
                expect.objectContaining({name: 'Error'})
            );
        });

        it('should throw if failed to send discord report', async () => {
            const mockBody = {
                contentOwnerId: "mockContentOwnerId",
                contentType: "user" as "user" | "comment" | "contract",
                contentId: "mockContentId",
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReporter = {
                created_time: "mockCreatedTime",
                data: {"mockData" : "mockDataValue"},
                id: "mockId",
                name: "mockName",
                name_username_vector: "mockNameUsernameVector",
                username: "mockUsername",
            };
            const mockReported = {
                created_time: "mockCreatedTimeReported",
                data: {"mockDataReported" : "mockDataValueReported"},
                id: "mockIdReported",
                name: "mockNameReported",
                name_username_vector: "mockNameUsernameVectorReported",
                username: "mockUsernameReported",
            };

            (supabaseUtils.insert as jest.Mock).mockResolvedValue(null);
            (tryCatch as jest.Mock).mockResolvedValue({data: mockBody, error: null});

            const result = await report(mockBody, mockAuth, mockReq);

            (mockPg.oneOrNone as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null);
            (tryCatch as jest.Mock)
                .mockResolvedValueOnce({data: mockReporter, error: null})
                .mockResolvedValueOnce({data: mockReported, error: null});
            (sendDiscordMessage as jest.Mock).mockRejectedValue(new Error('Discord error'));

            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await result.continue();

            expect(errorSpy).toBeCalledWith(
                expect.stringContaining('Failed to send discord reports'),
                expect.any(Error)
            );

        });
    });
});