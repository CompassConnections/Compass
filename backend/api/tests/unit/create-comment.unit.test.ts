
import * as createCommentModules from "api/create-comment";
import * as supabaseInit from "shared/supabase/init";
import * as sharedUtils from "shared/utils";
import * as utilParseModules from "common/util/parse";
import { convertComment } from "common/supabase/comment";
import * as websocketHelpers from "shared/websockets/helpers";
import * as notificationPrefereneces from "common/user-notification-preferences";
import * as supabaseNotification from "shared/supabase/notifications";
import * as emailHelpers from "email/functions/helpers";
import { AuthedUser } from "api/helpers/endpoint";

describe('createComment', () => {
    let mockPg: any;
    beforeEach(() => {
        jest.resetAllMocks();

        mockPg = {
            one: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('successfully create a comment with information provided', async () => {
            const mockUserId = {userId: '123'}
            const mockOnUser = {id: '123'}
            const mockCreator = {
                id: '123',
                name: 'Mock Creator',
                username: 'mock.creator.username',
                avatarUrl: 'mock.creator.avatarurl'
            }
            const mockContent = {
                content: {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'This is the comment text'
                                }
                            ]
                        }
                    ]
                },
                userId: '123'
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReplyToCommentId = {} as any;

            
        });
    });
});