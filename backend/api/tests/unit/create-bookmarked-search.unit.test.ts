jest.mock('shared/supabase/init');

import { createBookmarkedSearch } from "api/create-bookmarked-search";
import { AuthedUser } from "api/helpers/endpoint";
import * as supabaseInit from "shared/supabase/init";

describe('createBookmarkedSearch', () => {
    let mockPg: any;
    beforeEach(() => {
        jest.resetAllMocks();

        mockPg = {
            one: jest.fn(),
        };

        (supabaseInit.createSupabaseDirectClient as jest.Mock)
            .mockReturnValue(mockPg);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('should', () => {
        it('insert a bookmarked search into the database', async () => {
            const mockProps = {
                search_filters: 'mock_search_filters',
                location: 'mock_location',
                search_name: 'mock_search_name'
            };
            const mockAuth = { uid: '321' } as AuthedUser;
            const mockReq = {} as any;

            await createBookmarkedSearch(mockProps, mockAuth, mockReq)
            expect(mockPg.one).toBeCalledTimes(1)
            expect(mockPg.one).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO bookmarked_searches'),
                [
                    mockAuth.uid,
                    mockProps.search_filters,
                    mockProps.location,
                    mockProps.search_name
                ]
            );
        });
    });
});