import { getUser } from "backend/api/src/get-user";
import { createSupabaseDirectClient } from "backend/shared/src/supabase/init";
import { toUserAPIResponse } from "common/src/api/user-types";
import { convertUser } from "common/src/supabase/users";
import { APIError } from "common/src/api/utils";

jest.mock("backend/shared/src/supabase/init");
jest.mock("common/src/supabase/users");
jest.mock("common/src/api/utils");
describe('getUser', () =>{
    let mockPg: any;

    beforeEach(() => {
        mockPg = {
            oneOrNone: jest.fn(),
        };
        (createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg);

        jest.clearAllMocks();
    });

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

        mockPg.oneOrNone.mockImplementation((query: any, params: any, callback: any) => {
            return Promise.resolve(callback(mockDbUser))
        })

        (convertUser as jest.Mock).mockReturnValue(mockConvertedUser);
        ( toUserAPIResponse as jest.Mock).mockReturnValue(mockApiResponse);

        const result = await getUser({id: 'feUaIfcxVmJZHJOVVfawLTTPgZiP'})

        console.log(result);
        
    })
})