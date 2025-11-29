import * as profilesModule from "api/get-profiles";
import { Profile } from "common/profiles/profile";
import * as supabaseInit from "shared/supabase/init";

describe('getProfiles', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should fetch the user profiles', () => {
        it('successfully', async ()=> {            
            const mockProfiles = [
                {
                diet: ['Jonathon Hammon'],
                has_kids: 0
                },
                {
                diet: ['Joseph Hammon'],
                has_kids: 1
                },
                {
                diet: ['Jolene Hammon'],
                has_kids: 2,
                }
            ] as Profile [];
    
            jest.spyOn(profilesModule, 'loadProfiles').mockResolvedValue({profiles: mockProfiles, count: 3});
            
            const props = {
                limit: 2,
                orderBy: "last_online_time" as const,
            };
            const mockReq = {} as any;
            const results = await profilesModule.getProfiles(props, mockReq, mockReq);

            if('continue' in results) {
                throw new Error('Expected direct response')
            };

            expect(results.status).toEqual('success');
            expect(results.profiles).toEqual(mockProfiles);            
            expect(results.profiles[0]).toEqual(mockProfiles[0]);            
            expect(profilesModule.loadProfiles).toHaveBeenCalledWith(props);
            expect(profilesModule.loadProfiles).toHaveBeenCalledTimes(1);
        });

        it('unsuccessfully', async () => {
            jest.spyOn(profilesModule, 'loadProfiles').mockRejectedValue(null);
            
            const props = {
                limit: 2,
                orderBy: "last_online_time" as const,
            };
            const mockReq = {} as any;
            const results = await profilesModule.getProfiles(props, mockReq, mockReq);
            
            if('continue' in results) {
                throw new Error('Expected direct response')
            };

            expect(results.status).toEqual('fail');
            expect(results.profiles).toEqual([]);
            expect(profilesModule.loadProfiles).toHaveBeenCalledWith(props);
            expect(profilesModule.loadProfiles).toHaveBeenCalledTimes(1);
        });

    });
});

describe('loadProfiles', () => {
    let mockPg: any;
    
    describe('should call pg.map with an SQL query', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockPg = {
                map: jest.fn().mockResolvedValue([]),
                one: jest.fn().mockResolvedValue(1),
            };
            
            jest.spyOn(supabaseInit, 'createSupabaseDirectClient')
                .mockReturnValue(mockPg);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('successfully', async () => {
            await profilesModule.loadProfiles({
                limit: 10,
                name: 'John',
                is_smoker: true,
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain('select');
            expect(query).toContain('from profiles');
            expect(query).toContain('where');
            expect(query).toContain('limit 10');
            expect(query).toContain(`John`);
            expect(query).toContain(`is_smoker`);
            expect(query).not.toContain(`gender`);
            expect(query).not.toContain(`education_level`);
            expect(query).not.toContain(`pref_gender`);
            expect(query).not.toContain(`age`);
            expect(query).not.toContain(`drinks_per_month`);
            expect(query).not.toContain(`pref_relation_styles`);
            expect(query).not.toContain(`pref_romantic_styles`);
            expect(query).not.toContain(`diet`);
            expect(query).not.toContain(`political_beliefs`);
            expect(query).not.toContain(`religion`);
            expect(query).not.toContain(`has_kids`);
        });
        
        it('that contains a gender filter', async () => {
            await profilesModule.loadProfiles({
                genders: ['Electrical_gender'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`gender`);
            expect(query).toContain(`Electrical_gender`);
        });
        
        it('that contains a education level filter', async () => {
            await profilesModule.loadProfiles({
                education_levels: ['High School'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`education_level`);
            expect(query).toContain(`High School`);
        });
        
        it('that contains a prefer gender filter', async () => {
            await profilesModule.loadProfiles({
                pref_gender: ['female'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            console.log(query);
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`pref_gender`);
            expect(query).toContain(`female`);
        });

        it('that contains a minimum age filter', async () => {
            await profilesModule.loadProfiles({
                pref_age_min: 20,
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`age`);
            expect(query).toContain(`>= 20`);
        });

        it('that contains a maximum age filter', async () => {
            await profilesModule.loadProfiles({
                pref_age_max: 40,
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`age`);
            expect(query).toContain(`<= 40`);
        });

        it('that contains a minimum drinks per month filter', async () => {
            await profilesModule.loadProfiles({
                drinks_min: 4,
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`drinks_per_month`);
            expect(query).toContain('4');
        });

        it('that contains a maximum drinks per month filter', async () => {
            await profilesModule.loadProfiles({
                drinks_max: 20,
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`drinks_per_month`);
            expect(query).toContain('20');
        });

        it('that contains a relationship style filter', async () => {
            await profilesModule.loadProfiles({
                pref_relation_styles: ['Chill and relaxing'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`pref_relation_styles`);
            expect(query).toContain('Chill and relaxing');
        });

        it('that contains a romantic style filter', async () => {
            await profilesModule.loadProfiles({
                pref_romantic_styles: ['Sexy'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`pref_romantic_styles`);
            expect(query).toContain('Sexy');
        });

        it('that contains a diet filter', async () => {
            await profilesModule.loadProfiles({
                diet: ['Glutton'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`diet`);
            expect(query).toContain('Glutton');
        });

        it('that contains a political beliefs filter', async () => {
            await profilesModule.loadProfiles({
                political_beliefs: ['For the people'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`political_beliefs`);
            expect(query).toContain('For the people');
        });

        it('that contains a religion filter', async () => {
            await profilesModule.loadProfiles({
                religion: ['The blood god'],
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`religion`);
            expect(query).toContain('The blood god');
        });

        it('that contains a has kids filter', async () => {
            await profilesModule.loadProfiles({
                has_kids: 3,
            });

            const [query, values, cb] = mockPg.map.mock.calls[0]
            
            expect(mockPg.map.mock.calls).toHaveLength(1)
            expect(query).toContain(`has_kids`);
            expect(query).toContain('> 0');
        });
    });

    describe('should', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockPg = {
                map: jest.fn(),
                one: jest.fn().mockResolvedValue(1),
            };
            
            jest.spyOn(supabaseInit, 'createSupabaseDirectClient')
                .mockReturnValue(mockPg)
    

        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('return profiles from the database', async () => {
            const mockProfiles = [
                {
                diet: ['Jonathon Hammon'],
                is_smoker: true,
                has_kids: 0
                },
                {
                diet: ['Joseph Hammon'],
                is_smoker: false,
                has_kids: 1
                },
                {
                diet: ['Jolene Hammon'],
                is_smoker: true,
                has_kids: 2,
                }
            ] as Profile [];
        
            mockPg.map.mockResolvedValue(mockProfiles);
            const props = {} as any;
            const results = await profilesModule.loadProfiles(props);
            
            expect(results).toEqual({profiles: mockProfiles, count: 1});
        });

        it('throw an error if there is no compatability', async () => {
            const props = {
                orderBy: 'compatibility_score'
            }
            expect(profilesModule.loadProfiles(props))
                .rejects
                .toThrowError('Incompatible with user ID')
        });
    })
})