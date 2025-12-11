jest.mock('shared/utils');
jest.mock('shared/supabase/init');
jest.mock('api/helpers/private-messages');

import { createPrivateUserMessage } from "api/create-private-user-message";
import * as sharedUtils from "shared/utils";
import * as supabaseInit from "shared/supabase/init";
import * as helpersPrivateMessagesModules from "api/helpers/private-messages";
import { AuthedUser } from "api/helpers/endpoint";
import { MAX_COMMENT_JSON_LENGTH } from "api/create-comment";

describe('createPrivateUserMessage', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        
        const mockPg = {} as any;

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('successfully create a private user message', async () => {
            const mockBody = {
                content: {"": "x".repeat((MAX_COMMENT_JSON_LENGTH-8))},
                channelId: 123
            };
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: false
            };

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator);
            (helpersPrivateMessagesModules.createPrivateUserMessageMain as jest.Mock)
                .mockResolvedValue(null);

            await createPrivateUserMessage(mockBody, mockAuth, mockReq);
            expect(helpersPrivateMessagesModules.createPrivateUserMessageMain).toBeCalledWith(
                mockCreator,
                mockBody.channelId,
                mockBody.content,
                expect.any(Object),
                'private'
            );
        });

        it('throw an error if the content is too long', async () => {
            const mockBody = {
                content: {"": "x".repeat((MAX_COMMENT_JSON_LENGTH))},
                channelId: 123
            }
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            
            expect(createPrivateUserMessage(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError(`Message JSON should be less than ${MAX_COMMENT_JSON_LENGTH}`);
        });

        it('throw an error if the user does not exist', async () => {
            const mockBody = {
                content: {"mockJson": "mockJsonContent"},
                channelId: 123
            }
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(null);
            
            expect(createPrivateUserMessage(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError(`Your account was not found`);
        });

        it('throw an error if the user does not exist', async () => {
            const mockBody = {
                content: {"mockJson": "mockJsonContent"},
                channelId: 123
            }
            const mockAuth = {uid: '321'} as AuthedUser;
            const mockReq = {} as any;
            const mockCreator = {
                isBannedFromPosting: true
            };

            (sharedUtils.getUser as jest.Mock).mockResolvedValue(mockCreator);
            
            expect(createPrivateUserMessage(mockBody, mockAuth, mockReq))
                .rejects
                .toThrowError(`You are banned`);
        });
    });
});

