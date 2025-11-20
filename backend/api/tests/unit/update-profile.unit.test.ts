jest.mock("shared/supabase/init");
jest.mock("shared/supabase/utils");

import { AuthedUser } from "api/helpers/endpoint";
import { updateProfile } from "api/update-profile";
import * as supabaseModule from "shared/supabase/init";
import * as supabaseUtils from "shared/supabase/utils";

describe('updateProfiles', () => {
    let mockPg: any;

    beforeEach(() => {
        mockPg = {
            oneOrNone: jest.fn(),
        };

        (supabaseModule.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);

        jest.clearAllMocks();
    });
    describe('should', () => {
        it('update an existing profile when provided the user id', async () => {
            const mockUserProfile = {
                user_id: '234',
                diet: 'Nothing',
                gender: 'female',
                is_smoker: true,
            }
            const mockUpdateMade = {
                gender: 'male'
            }
            const mockUpdatedProfile = {
                user_id: '234',
                diet: 'Nothing',
                gender: 'male',
                is_smoker: true,
            }
            const mockParams = {} as any;
            const mockAuth = {
                uid: '234'
            }

            mockPg.oneOrNone.mockResolvedValue(mockUserProfile);
            (supabaseUtils.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);

            const result = await updateProfile(
                mockUpdateMade,
                mockAuth as AuthedUser,
                mockParams
            );

            expect(mockPg.oneOrNone.mock.calls.length).toBe(1);
            expect(mockPg.oneOrNone.mock.calls[0][1]).toEqual([mockAuth.uid]);
            expect(result).toEqual(mockUpdatedProfile);            
        });

        it('throw an error if a profile is not found', async () => {
            mockPg.oneOrNone.mockResolvedValue(null);
            expect(updateProfile({} as any, {} as any, {} as any,))
                .rejects
                .toThrowError('Profile not found');
        });

        it('throw an error if unable to update the profile', async () => {
            const mockUserProfile = {
                user_id: '234',
                diet: 'Nothing',
                gender: 'female',
                is_smoker: true,
            }
            const data = null;
            const error = true;
            const mockError = {
                data,
                error
            }
            mockPg.oneOrNone.mockResolvedValue(mockUserProfile);
            (supabaseUtils.update as jest.Mock).mockRejectedValue(mockError);
            expect(updateProfile({} as any, {} as any, {} as any,))
                .rejects
                .toThrowError('Error updating profile');
            
        });
    });
});