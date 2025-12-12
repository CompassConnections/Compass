jest.mock('shared/supabase/init');
jest.mock('shared/supabase/notifications');
jest.mock('email/functions/helpers');
jest.mock('common/supabase/comment');
jest.mock('shared/utils');
jest.mock('common/user-notification-preferences');
jest.mock('shared/websockets/helpers');

import * as supabaseInit from "shared/supabase/init";
import { AuthedUser } from "api/helpers/endpoint";
import * as sharedUtils from "shared/utils";
import { createComment } from "api/create-comment";
import * as notificationPrefs from "common/user-notification-preferences";
import * as supabaseNotifications from "shared/supabase/notifications";
import * as emailHelpers from "email/functions/helpers";
import * as websocketHelpers from "shared/websockets/helpers";
import { convertComment } from "common/supabase/comment";

describe('createComment', () => {
    let mockPg: any;
    beforeEach(() => {
        jest.resetAllMocks();

        mockPg = {
            one: jest.fn()
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
        (supabaseNotifications.insertNotificationToSupabase as jest.Mock)
            .mockResolvedValue(null);
        (emailHelpers.sendNewEndorsementEmail as jest.Mock)
            .mockResolvedValue(null);
        (convertComment as jest.Mock)
            .mockResolvedValue(null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('successfully create a comment with information provided', async () => {
            const mockUserId = {
                userId: '123',
                blockedUserIds: ['111']
            }
            const mockOnUser = {id: '123'}
            const mockCreator = {
                id: '1234',
                name: 'Mock Creator',
                username: 'mock.creator.username',
                avatarUrl: 'mock.creator.avatarurl',
                isBannedFromPosting: false
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
            const mockReq = {} as any;
            const mockReplyToCommentId = {} as any;
            const mockComment = {id: 12};
            const mockNotificationDestination = {} as any;
            const mockProps = {
                userId: mockUserId.userId,
                content: mockContent.content,
                replyToCommentId: mockReplyToCommentId
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValueOnce(mockCreator)
                .mockResolvedValueOnce(mockOnUser);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValueOnce(mockUserId)
                .mockResolvedValueOnce(mockOnUser);
            (mockPg.one as jest.Mock).mockResolvedValue(mockComment);
            (notificationPrefs.getNotificationDestinationsForUser as jest.Mock)
                .mockReturnValue(mockNotificationDestination);

            const results = await createComment(mockProps, mockAuth, mockReq);
            
            expect(results.status).toBe('success');
            expect(sharedUtils.getUser).toBeCalledTimes(2);
            expect(sharedUtils.getUser).toBeCalledWith(mockUserId.userId);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            expect(sharedUtils.getPrivateUser).toBeCalledTimes(2);
            expect(mockPg.one).toBeCalledTimes(1);
            expect(mockPg.one).toBeCalledWith(
                expect.stringContaining('insert into profile_comments'),
                expect.arrayContaining([mockCreator.id])
            );
            expect(websocketHelpers.broadcastUpdatedComment).toBeCalledTimes(1)
            
        });

        it('throw an error if there is no user matching the userId', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReplyToCommentId = {} as any;
            const mockUserId = {
                userId: '123',
                blockedUserIds: ['111']
            };
            const mockCreator = {
                id: '1234',
                name: 'Mock Creator',
                username: 'mock.creator.username',
                avatarUrl: 'mock.creator.avatarurl',
                isBannedFromPosting: false
            };
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
            const mockProps = {
                userId: mockUserId.userId,
                content: mockContent.content,
                replyToCommentId: mockReplyToCommentId
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValueOnce(mockCreator)
                .mockResolvedValueOnce(null);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(mockUserId);

            expect(createComment( mockProps, mockAuth, mockReq )).rejects.toThrowError('User not found');
        });

        it('throw an error if there is no account associated with the authId', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReplyToCommentId = {} as any;
            const mockUserId = {
                userId: '123',
                blockedUserIds: ['111']
            };
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
            const mockProps = {
                userId: mockUserId.userId,
                content: mockContent.content,
                replyToCommentId: mockReplyToCommentId
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValueOnce(null);

            expect(createComment( mockProps, mockAuth, mockReq )).rejects.toThrowError('Your account was not found');
        });

        it('throw an error if the account is banned from posting', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReplyToCommentId = {} as any;
            const mockUserId = {
                userId: '123',
                blockedUserIds: ['111']
            };
            const mockCreator = {
                id: '1234',
                name: 'Mock Creator',
                username: 'mock.creator.username',
                avatarUrl: 'mock.creator.avatarurl',
                isBannedFromPosting: true
            };
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
            const mockProps = {
                userId: mockUserId.userId,
                content: mockContent.content,
                replyToCommentId: mockReplyToCommentId
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValueOnce(mockCreator);

            expect(createComment( mockProps, mockAuth, mockReq )).rejects.toThrowError('You are banned');
        });

        it('throw an error if the other user is not found', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReplyToCommentId = {} as any;
            const mockUserId = {
                userId: '123',
                blockedUserIds: ['111']
            };
            const mockCreator = {
                id: '1234',
                name: 'Mock Creator',
                username: 'mock.creator.username',
                avatarUrl: 'mock.creator.avatarurl',
                isBannedFromPosting: false
            };
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
            const mockProps = {
                userId: mockUserId.userId,
                content: mockContent.content,
                replyToCommentId: mockReplyToCommentId
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValueOnce(mockCreator);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(null);

            expect(createComment( mockProps, mockAuth, mockReq )).rejects.toThrowError('Other user not found');
        });

        it('throw an error if the user has blocked you', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReplyToCommentId = {} as any;
            const mockUserId = {
                userId: '123',
                blockedUserIds: ['321']
            };
            const mockCreator = {
                id: '1234',
                name: 'Mock Creator',
                username: 'mock.creator.username',
                avatarUrl: 'mock.creator.avatarurl',
                isBannedFromPosting: false
            };
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
            const mockProps = {
                userId: mockUserId.userId,
                content: mockContent.content,
                replyToCommentId: mockReplyToCommentId
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValueOnce(mockCreator);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(mockUserId);

            expect(createComment( mockProps, mockAuth, mockReq )).rejects.toThrowError('User has blocked you');
        });

        it('throw an error if the comment is too long', async () => {
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockReplyToCommentId = {} as any;
            const mockUserId = {
                userId: '123',
                blockedUserIds: ['111']
            };
            const mockCreator = {
                id: '1234',
                name: 'Mock Creator',
                username: 'mock.creator.username',
                avatarUrl: 'mock.creator.avatarurl',
                isBannedFromPosting: false
            };
            const mockContent = {
                content: {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'This '.repeat(30000),
                                }
                            ]
                        }
                    ]
                },
                userId: '123'
            };
            const mockProps = {
                userId: mockUserId.userId,
                content: mockContent.content,
                replyToCommentId: mockReplyToCommentId
            };

            (sharedUtils.getUser as jest.Mock)
                .mockResolvedValueOnce(mockCreator);
            (sharedUtils.getPrivateUser as jest.Mock)
                .mockResolvedValue(mockUserId);
            console.log(JSON.stringify(mockContent.content).length);
            
            expect(createComment( mockProps, mockAuth, mockReq )).rejects.toThrowError('Comment is too long');
        });
    });
});