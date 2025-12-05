jest.mock('common/discord/core');
jest.mock('shared/supabase/utils');
jest.mock('shared/supabase/init');
jest.mock('common/util/try-catch');

import { contact } from "api/contact";
import * as supabaseInit from "shared/supabase/init";
import * as supabaseUtils from "shared/supabase/utils";
import { tryCatch } from "common/util/try-catch";
import { sendDiscordMessage } from "common/discord/core";
import { AuthedUser } from "api/helpers/endpoint";

describe('contact', () => {
    let mockPg: any;
    beforeEach(() => {
        jest.resetAllMocks();

        mockPg = {
            oneOrNone: jest.fn(),
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('send a discord message to the user', async () => {
            const mockProps = {
                content: {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Error test message'
                                }
                            ]
                        }
                    ]
                },
                userId: '123'
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockDbUser = { name: 'Humphrey Mocker' };
            const mockReturnData = {} as any;
            
            (tryCatch as jest.Mock).mockResolvedValue({ data: mockReturnData, error: null });
            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockDbUser);
            (sendDiscordMessage as jest.Mock).mockResolvedValue(null);

            const results = await contact(mockProps, mockAuth, mockReq);
            expect(supabaseUtils.insert).toBeCalledTimes(1)
            expect(supabaseUtils.insert).toBeCalledWith(
                mockPg,
                'contact',
                {
                    user_id: mockProps.userId,
                    content: JSON.stringify(mockProps.content)
                }
            );
            expect(results.success).toBe(true);
            await results.continue();
            expect(sendDiscordMessage).toBeCalledWith(
                expect.stringContaining(`New message from ${mockDbUser.name}`),
                'contact'
            )
            expect(sendDiscordMessage).toBeCalledTimes(1);
        });

        it('throw an error if the inser function fails', async () => {
            const mockProps = {
                content: {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Error test message'
                                }
                            ]
                        }
                    ]
                },
                userId: '123'
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (tryCatch as jest.Mock).mockResolvedValue({ data: null, error: Error });

            expect(contact(mockProps, mockAuth, mockReq))
                .rejects
                .toThrowError('Failed to submit contact message');
            expect(supabaseUtils.insert).toBeCalledTimes(1)
            expect(supabaseUtils.insert).toBeCalledWith(
                mockPg,
                'contact',
                {
                    user_id: mockProps.userId,
                    content: JSON.stringify(mockProps.content)
                }
            );
        });
    });
});