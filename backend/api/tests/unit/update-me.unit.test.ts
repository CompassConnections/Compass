jest.mock('common/api/user-types');
jest.mock('common/util/clean-username');
jest.mock('shared/supabase/init');
jest.mock('common/util/object');
jest.mock('lodash');
jest.mock('shared/utils');
jest.mock('shared/supabase/users');
jest.mock('shared/websockets/helpers');
jest.mock('common/envs/constants');

import {updateMe} from "api/update-me";
import {toUserAPIResponse} from "common/api/user-types";
import * as cleanUsernameModules from "common/util/clean-username";
import * as supabaseInit from "shared/supabase/init";
import * as objectUtils from "common/util/object";
import * as lodashModules from "lodash";
import * as sharedUtils from "shared/utils";
import * as supabaseUsers from "shared/supabase/users";
import * as websocketHelperModules from "shared/websockets/helpers";
import {AuthedUser} from "api/helpers/endpoint";
import {sqlMatch} from 'common/test-utils'

describe('updateMe', () => {
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
        it('should update user information', async () => {
            const mockProps = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockUpdate = {
                name: "mockName",
                username: "mockUsername",
                avatarUrl: "mockAvatarUrl",
                link: {"mockLink" : "mockLinkValue"},
            };
            const mockStripped = {
                bio: "mockBio"
            };
            const mockData = {link: "mockNewLinks"};
            const arrySpy = jest.spyOn(Array.prototype, 'includes');

            (lodashModules.cloneDeep as jest.Mock).mockReturnValue(mockUpdate);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(true);
            (cleanUsernameModules.cleanDisplayName as jest.Mock).mockReturnValue(mockUpdate.name);
            (cleanUsernameModules.cleanUsername as jest.Mock).mockReturnValue(mockUpdate.username);
            arrySpy.mockReturnValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockReturnValue(false);
            (supabaseUsers.updateUser as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (lodashModules.mapValues as jest.Mock).mockReturnValue(mockStripped);
            (mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockData);
            (mockPg.none as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            (objectUtils.removeUndefinedProps as jest.Mock).mockReturnValue("mockRemoveUndefinedProps");
            (websocketHelperModules.broadcastUpdatedUser as jest.Mock).mockReturnValue(null);
            (toUserAPIResponse as jest.Mock).mockReturnValue(null);

            await updateMe(mockProps, mockAuth, mockReq);

            expect(lodashModules.cloneDeep).toBeCalledTimes(1);
            expect(lodashModules.cloneDeep).toBeCalledWith(mockProps);
            expect(sharedUtils.getUser).toBeCalledTimes(1);
            expect(sharedUtils.getUser).toBeCalledWith(mockAuth.uid);
            expect(cleanUsernameModules.cleanDisplayName).toBeCalledTimes(1);
            expect(cleanUsernameModules.cleanDisplayName).toBeCalledWith(mockUpdate.name);
            expect(cleanUsernameModules.cleanUsername).toBeCalledTimes(1);
            expect(cleanUsernameModules.cleanUsername).toBeCalledWith(mockUpdate.username);
            expect(arrySpy).toBeCalledTimes(1);
            expect(arrySpy).toBeCalledWith(mockUpdate.username);
            expect(sharedUtils.getUserByUsername).toBeCalledTimes(1);
            expect(sharedUtils.getUserByUsername).toBeCalledWith(mockUpdate.username);
            expect(supabaseUsers.updateUser).toBeCalledTimes(2);
            expect(supabaseUsers.updateUser).toHaveBeenNthCalledWith(
                1,
                expect.any(Object),
                mockAuth.uid,
                'mockRemoveUndefinedProps'
            );
            expect(supabaseUsers.updateUser).toHaveBeenNthCalledWith(
                2,
                expect.any(Object),
                mockAuth.uid,
                {avatarUrl: mockUpdate.avatarUrl}
            );
            expect(lodashModules.mapValues).toBeCalledTimes(1);
            expect(lodashModules.mapValues).toBeCalledWith(
                expect.any(Object),
                expect.any(Function)
            );
            expect(mockPg.oneOrNone).toBeCalledTimes(1);
            expect(mockPg.oneOrNone).toBeCalledWith(
              sqlMatch('update users'),
                {
                    adds: expect.any(Object),
                    removes: expect.any(Array),
                    id: mockAuth.uid
                }
            );
            expect(mockPg.none).toBeCalledTimes(2);
            expect(mockPg.none).toHaveBeenNthCalledWith(
                1,
              sqlMatch(`update users
                        set name = $1
                        where id = $2`),
                [mockUpdate.name, mockAuth.uid]
            );
            expect(mockPg.none).toHaveBeenNthCalledWith(
                2,
              sqlMatch(`update users
                        set username = $1
                        where id = $2`),
                [mockUpdate.username, mockAuth.uid]
            );
            expect(objectUtils.removeUndefinedProps).toBeCalledTimes(2);
            expect(objectUtils.removeUndefinedProps).toHaveBeenNthCalledWith(
                2,
                {
                    id: mockAuth.uid,
                    name: mockUpdate.name,
                    username: mockUpdate.username,
                    avatarUrl: mockUpdate.avatarUrl,
                    link: mockData.link
                }
            );
            expect(websocketHelperModules.broadcastUpdatedUser).toBeCalledTimes(1);
            expect(websocketHelperModules.broadcastUpdatedUser).toBeCalledWith('mockRemoveUndefinedProps');
            expect(toUserAPIResponse).toBeCalledTimes(1);
        });
    });
    describe('when an error occurs', () => {
        it('should throw if no account was found', async () => {
            const mockProps = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockUpdate = {
                name: "mockName",
                username: "mockUsername",
                avatarUrl: "mockAvatarUrl",
                link: {"mockLink" : "mockLinkValue"},
            };

            (lodashModules.cloneDeep as jest.Mock).mockReturnValue(mockUpdate);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(false);

            expect(updateMe(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Your account was not found');
        });

        it('should throw if the username is invalid', async () => {
            const mockProps = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockUpdate = {
                name: "mockName",
                username: "mockUsername",
                avatarUrl: "mockAvatarUrl",
                link: {"mockLink" : "mockLinkValue"},
            };

            (lodashModules.cloneDeep as jest.Mock).mockReturnValue(mockUpdate);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(true);
            (cleanUsernameModules.cleanDisplayName as jest.Mock).mockReturnValue(mockUpdate.name);
            (cleanUsernameModules.cleanUsername as jest.Mock).mockReturnValue(false);
  
            expect(updateMe(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Invalid username');
        });

        it('should throw if the username is reserved', async () => {
            const mockProps = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockUpdate = {
                name: "mockName",
                username: "mockUsername",
                avatarUrl: "mockAvatarUrl",
                link: {"mockLink" : "mockLinkValue"},
            };

            const arrySpy = jest.spyOn(Array.prototype, 'includes');

            (lodashModules.cloneDeep as jest.Mock).mockReturnValue(mockUpdate);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(true);
            (cleanUsernameModules.cleanDisplayName as jest.Mock).mockReturnValue(mockUpdate.name);
            (cleanUsernameModules.cleanUsername as jest.Mock).mockReturnValue(mockUpdate.username);
            arrySpy.mockReturnValue(true);

            expect(updateMe(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('This username is reserved');
        });

        it('should throw if the username is taken', async () => {
            const mockProps = {} as any;
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;
            const mockUpdate = {
                name: "mockName",
                username: "mockUsername",
                avatarUrl: "mockAvatarUrl",
                link: {"mockLink" : "mockLinkValue"},
            };
            const arrySpy = jest.spyOn(Array.prototype, 'includes');

            (lodashModules.cloneDeep as jest.Mock).mockReturnValue(mockUpdate);
            (sharedUtils.getUser as jest.Mock).mockResolvedValue(true);
            (cleanUsernameModules.cleanDisplayName as jest.Mock).mockReturnValue(mockUpdate.name);
            (cleanUsernameModules.cleanUsername as jest.Mock).mockReturnValue(mockUpdate.username);
            arrySpy.mockReturnValue(false);
            (sharedUtils.getUserByUsername as jest.Mock).mockReturnValue(true);

            expect(updateMe(mockProps, mockAuth, mockReq))
                .rejects
                .toThrow('Username already taken');
        });
    });
});