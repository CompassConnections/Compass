import * as profilesModule from "api/get-profiles";
import { Profile } from "common/profiles/profile";
import { createSupabaseDirectClient } from "shared/supabase/init";
import { renderSql } from "shared/supabase/sql-builder";

jest.mock("shared/supabase/init")

// describe.skip('getProfiles', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('should fetch the user profiles', () => {
//         it('successfully', async ()=> {            
//             const mockProfiles = [
//                 {
//                 diet: ['Jonathon Hammon'],
//                 has_kids: 0
//                 },
//                 {
//                 diet: ['Joseph Hammon'],
//                 has_kids: 1
//                 },
//                 {
//                 diet: ['Jolene Hammon'],
//                 has_kids: 2,
//                 }
//             ] as Profile [];
    
//             jest.spyOn(profilesModule, 'loadProfiles').mockResolvedValue(mockProfiles);
            
//             const props = {
//                 limit: 2,
//                 orderBy: "last_online_time" as const,
//             };
//             const mockReq = {} as any;
//             const results = await profilesModule.getProfiles(props, mockReq, mockReq);

//             if('continue' in results) {
//                 throw new Error('Expected direct response')
//             };

//             expect(results.status).toEqual('success');
//             expect(results.profiles).toEqual(mockProfiles);            
//             expect(results.profiles[0]).toEqual(mockProfiles[0]);            
//             expect(profilesModule.loadProfiles).toHaveBeenCalledWith(props);
//             expect(profilesModule.loadProfiles).toHaveBeenCalledTimes(1);
//         });

//         it('unsucessfully', async () => {
//             jest.spyOn(profilesModule, 'loadProfiles').mockRejectedValue(null);
            
//             const props = {
//                 limit: 2,
//                 orderBy: "last_online_time" as const,
//             };
//             const mockReq = {} as any;
//             const results = await profilesModule.getProfiles(props, mockReq, mockReq);
            
//             if('continue' in results) {
//                 throw new Error('Expected direct response')
//             };

//             expect(results.status).toEqual('fail');
//             expect(results.profiles).toEqual([]);
//             expect(profilesModule.loadProfiles).toHaveBeenCalledWith(props);
//             expect(profilesModule.loadProfiles).toHaveBeenCalledTimes(1);
//         });

//     });
// });

describe('loadProfiles', () => {
    let mockPg: any;
    
    describe('should', () => {
        beforeEach(() => {
            mockPg = {
                map: jest.fn().mockResolvedValue([]),
            };
            
            (createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
            jest.clearAllMocks();
        });
        it('call pg.map with an SQL query', async () => {          
            await profilesModule.loadProfiles({
                limit: 10,
                name: 'John',
                is_smoker: true,
            });

            const sqlQuery = mockPg.map.mock.calls
            console.log(sqlQuery);
            
        });
    });

    // describe.skip('should', () => {
    //     beforeEach(() => {
    //         mockPg = {
    //             map: jest.fn(),
    //         };
            
    //         (createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    
    //         jest.clearAllMocks();
    //     });
    //     it('return profiles from the database', async () => {
    //         const mockProfiles = [
    //             {
    //             diet: ['Jonathon Hammon'],
    //             is_smoker: true,
    //             has_kids: 0
    //             },
    //             {
    //             diet: ['Joseph Hammon'],
    //             is_smoker: false,
    //             has_kids: 1
    //             },
    //             {
    //             diet: ['Jolene Hammon'],
    //             is_smoker: true,
    //             has_kids: 2,
    //             }
    //         ] as Profile [];
        
    //         mockPg.map.mockResolvedValue(mockProfiles);
    //         const props = {} as any;
    //         const results = await profilesModule.loadProfiles(props);

    //         expect(results).toEqual(mockProfiles);
    //     });
    // })
})

// const test = profilesModule.loadProfiles({
//     limit: 10,
//     name: 'Noah Boyer',
//     // is_smoker: true,
//     // orderBy: 'created_time'
// });
// test.then(res => {console.log(res);
// })