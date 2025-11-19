jest.mock("shared/supabase/init");
import { getUser } from "api/get-user";
import { createSupabaseDirectClient } from "shared/supabase/init";
import { toUserAPIResponse } from "common/api/user-types";
import { convertUser } from "common/supabase/users";
import { APIError } from "common/api/utils";


jest.spyOn(require("common/supabase/users"), 'convertUser')
jest.spyOn(require("common/api/user-types"), 'toUserAPIResponse')

describe('getUser', () =>{
    let mockPg: any;

    beforeEach(() => {
        mockPg = {
            oneOrNone: jest.fn(),
        };
        (createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg);

        jest.clearAllMocks();
    });

    describe('when fetching by id', () => {
        it('should fetch user successfully by id', async () => {
            const mockDbUser = {
                created_time: '2025-11-11T16:42:05.188Z',
                data: { link: {}, avatarUrl: "", isBannedFromPosting: false },
                id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP',
                name: 'Franklin Buckridge',
                name_username_vector: "'buckridg':2,4 'franklin':1,3",
                username: 'Franky_Buck'
            };
            const mockConvertedUser = {
                created_time: new Date(),
                id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP',
                name: 'Franklin Buckridge',
                name_username_vector: "'buckridg':2,4 'franklin':1,3",
                username: 'Franky_Buck'
    
            };
            const mockApiResponse = {
                created_time: '2025-11-11T16:42:05.188Z',
                data: { link: {}, avatarUrl: "", isBannedFromPosting: false },
                id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP',
                name: 'Franklin Buckridge',
                username: 'Franky_Buck'
            };
    
            mockPg.oneOrNone.mockImplementation((query: string, values: any[], cb: (value: any) => any) => {
                const result = cb(mockDbUser);
                return Promise.resolve(result);
            });
    
            (convertUser as jest.Mock).mockReturnValue(mockConvertedUser);
            ( toUserAPIResponse as jest.Mock).mockReturnValue(mockApiResponse);
    
            const result = await getUser({id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP'})
    
            expect(mockPg.oneOrNone).toHaveBeenCalledWith(
                expect.stringContaining('where id = $1'),
                ['feUaIfcxVmJZHJOVVfawLTTPgZiP'],
                expect.any(Function)
            );
    
            expect(convertUser).toHaveBeenCalledWith(mockDbUser);
            expect(toUserAPIResponse).toHaveBeenCalledWith(mockConvertedUser);
    
            expect(result).toEqual(mockApiResponse);
            
        });

        it('should throw 404 when user is not found by id', async () => {
            mockPg.oneOrNone.mockImplementation((query: string, values: any[], cb: (value: any) => any) => {
                return Promise.resolve(null);
            });

            (convertUser as jest.Mock).mockReturnValue(null)
            
            try {
                await getUser({id: '3333'});
                fail('Should have thrown');
            } catch (error) {
                const apiError = error as APIError;
                expect(apiError.code).toBe(404)
                expect(apiError.message).toBe('User not found')
                expect(apiError.details).toBeUndefined()
                expect(apiError.name).toBe('APIError')
            }            
        })
        
    })

    describe('when fetching by username', () => {
        it('should fetch user successfully by username', async () => {
            const mockDbUser = {
                created_time: '2025-11-11T16:42:05.188Z',
                data: { link: {}, avatarUrl: "", isBannedFromPosting: false },
                id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP',
                name: 'Franklin Buckridge',
                name_username_vector: "'buckridg':2,4 'franklin':1,3",
                username: 'Franky_Buck'
            };
            const mockConvertedUser = {
                created_time: new Date(),
                id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP',
                name: 'Franklin Buckridge',
                name_username_vector: "'buckridg':2,4 'franklin':1,3",
                username: 'Franky_Buck'
    
            };
            const mockApiResponse = {
                created_time: '2025-11-11T16:42:05.188Z',
                data: { link: {}, avatarUrl: "", isBannedFromPosting: false },
                id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP',
                name: 'Franklin Buckridge',
                username: 'Franky_Buck'
            };
    
            mockPg.oneOrNone.mockImplementation((query: string, values: any[], cb: (value: any) => any) => {
                const result = cb(mockDbUser);
                return Promise.resolve(result);
            });
    
            (convertUser as jest.Mock).mockReturnValue(mockConvertedUser);
            (toUserAPIResponse as jest.Mock).mockReturnValue(mockApiResponse);
    
            const result = await getUser({username: 'Franky_Buck'})
    
            expect(mockPg.oneOrNone).toHaveBeenCalledWith(
                expect.stringContaining('where username = $1'),
                ['Franky_Buck'],
                expect.any(Function)
            );
    
            expect(convertUser).toHaveBeenCalledWith(mockDbUser);
            expect(toUserAPIResponse).toHaveBeenCalledWith(mockConvertedUser);
    
            expect(result).toEqual(mockApiResponse);
            
        });

        it('should throw 404 when user is not found by id', async () => {
            mockPg.oneOrNone.mockImplementation((query: string, values: any[], cb: (value: any) => any) => {
                return Promise.resolve(null);
            });

            (convertUser as jest.Mock).mockReturnValue(null)
            
            try {
                await getUser({username: '3333'});
                fail('Should have thrown');
            } catch (error) {
                const apiError = error as APIError;
                expect(apiError.code).toBe(404)
                expect(apiError.message).toBe('User not found')
                expect(apiError.details).toBeUndefined()
                expect(apiError.name).toBe('APIError')
            }            
        })
    })
})