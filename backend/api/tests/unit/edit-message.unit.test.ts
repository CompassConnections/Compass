jest.mock('shared/supabase/init');
jest.mock('shared/encryption');
jest.mock('api/helpers/private-messages');

import {sqlMatch} from "common/test-utils";
import {editMessage} from "api/edit-message";
import * as supabaseInit from "shared/supabase/init";
import * as encryptionModules from "shared/encryption";
import * as messageHelpers from "api/helpers/private-messages";
import {AuthedUser} from "api/helpers/endpoint";

describe('editMessage', () => {
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
        it('should edit the messages associated with the messageId', async () => {
            const mockProps = {
                messageId: 123,
                content: {'mockContent' : 'mockContentValue'}
            };
            const mockPlainTextContent = JSON.stringify(mockProps.content)
            const mockMessage = {
                channel_id: "mockChannelId"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockCipher = "mockCipherText";
            const mockIV = "mockIV";
            const mockTag = "mockTag";
            const mockEncryption = {
                ciphertext: mockCipher,
                iv: mockIV,
                tag: mockTag
            };

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockMessage);
            (encryptionModules.encryptMessage as jest.Mock).mockReturnValue(mockEncryption);
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            (messageHelpers.broadcastPrivateMessages as jest.Mock).mockResolvedValue(null);

            const result = await editMessage(mockProps, mockAuth, mockReq);
            
            expect(result.success).toBeTruthy();
            expect(mockPg.oneOrNone).toBeCalledTimes(1);
            expect(mockPg.oneOrNone).toBeCalledWith(
              sqlMatch('SELECT *'),
                [mockProps.messageId, mockAuth.uid]
            );
            expect(encryptionModules.encryptMessage).toBeCalledTimes(1);
            expect(encryptionModules.encryptMessage).toBeCalledWith(mockPlainTextContent);
            expect(mockPg.none).toBeCalledTimes(1);
            expect(mockPg.none).toBeCalledWith(
              sqlMatch('UPDATE private_user_messages'),
                [mockCipher, mockIV, mockTag, mockProps.messageId]
            );
            expect(messageHelpers.broadcastPrivateMessages).toBeCalledTimes(1);
            expect(messageHelpers.broadcastPrivateMessages).toBeCalledWith(
                expect.any(Object),
                mockMessage.channel_id,
                mockAuth.uid
            );
        });
    });
    
    describe('when an error occurs', () => {
        it('should throw if there is an issue with the message', async () => {
            const mockProps = {
                messageId: 123,
                content: {'mockContent' : 'mockContentValue'}
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(null);

            expect(editMessage(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Message not found or cannot be edited');
        });

        it('should throw if the message broadcast failed', async () => {
            const mockProps = {
                messageId: 123,
                content: {'mockContent' : 'mockContentValue'}
            };
            const mockMessage = {
                channel_id: "mockChannelId"
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockCipher = "mockCipherText";
            const mockIV = "mockIV";
            const mockTag = "mockTag";
            const mockEncryption = {
                ciphertext: mockCipher,
                iv: mockIV,
                tag: mockTag
            };

            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockMessage);
            (encryptionModules.encryptMessage as jest.Mock).mockReturnValue(mockEncryption);
            (mockPg.none as jest.Mock).mockResolvedValue(null);
            (messageHelpers.broadcastPrivateMessages as jest.Mock).mockRejectedValue(new Error('Broadcast Error'));
            
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await editMessage(mockProps, mockAuth, mockReq);
            expect(errorSpy).toBeCalledTimes(1);
            expect(errorSpy).toBeCalledWith(
                expect.stringContaining('broadcastPrivateMessages failed'),
                expect.any(Error)
            );
        });
    });
});