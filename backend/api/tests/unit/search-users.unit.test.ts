import {sqlMatch} from 'common/test-utils'
import {searchUsers} from 'api/search-users'
import * as supabaseInit from 'shared/supabase/init'
import * as searchHelpers from 'shared/helpers/search'
import * as sqlBuilderModules from 'shared/supabase/sql-builder'
import * as supabaseUsers from 'common/supabase/users'
import {toUserAPIResponse} from 'common/api/user-types'
import {AuthedUser} from 'api/helpers/endpoint'

jest.mock('shared/supabase/init')
jest.mock('shared/helpers/search')
jest.mock('shared/supabase/sql-builder')
jest.mock('common/supabase/users')
jest.mock('common/api/user-types')

describe('searchUsers', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      map: jest.fn(),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should return an array of uniq users', async () => {
      const mockProps = {
        term: 'mockTerm',
        limit: 10,
        page: 1,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockSearchAllSql = 'mockSQL'
      const mockAllUser = [{id: 'mockId 1'}, {id: 'mockId 2'}, {id: 'mockId 3'}]

      ;(sqlBuilderModules.renderSql as jest.Mock).mockReturnValue(mockSearchAllSql)
      ;(sqlBuilderModules.select as jest.Mock).mockReturnValue('Select')
      ;(sqlBuilderModules.from as jest.Mock).mockReturnValue('From')
      ;(sqlBuilderModules.where as jest.Mock).mockReturnValue('Where')
      ;(searchHelpers.constructPrefixTsQuery as jest.Mock).mockReturnValue('ConstructPrefix')
      ;(sqlBuilderModules.orderBy as jest.Mock).mockReturnValue('OrderBy')
      ;(sqlBuilderModules.limit as jest.Mock).mockReturnValue('Limit')
      ;(supabaseUsers.convertUser as jest.Mock).mockResolvedValue(null)
      ;(mockPg.map as jest.Mock).mockResolvedValue(mockAllUser)
      ;(toUserAPIResponse as jest.Mock)
        .mockReturnValueOnce(mockAllUser[0].id)
        .mockReturnValueOnce(mockAllUser[1].id)
        .mockReturnValueOnce(mockAllUser[2].id)

      const result: any = await searchUsers(mockProps, mockAuth, mockReq)

      expect(result[0]).toContain(mockAllUser[0].id)
      expect(result[1]).toContain(mockAllUser[1].id)
      expect(result[2]).toContain(mockAllUser[2].id)

      expect(sqlBuilderModules.renderSql).toBeCalledTimes(1)
      expect(sqlBuilderModules.renderSql).toBeCalledWith(
        ['Select', 'From'],
        ['Where', 'OrderBy'],
        'Limit',
      )

      expect(sqlBuilderModules.select).toBeCalledTimes(1)
      expect(sqlBuilderModules.select).toBeCalledWith('*')
      expect(sqlBuilderModules.from).toBeCalledTimes(1)
      expect(sqlBuilderModules.from).toBeCalledWith('users')
      expect(sqlBuilderModules.where).toBeCalledTimes(1)
      expect(sqlBuilderModules.where).toBeCalledWith(
        sqlMatch("name_username_vector @@ websearch_to_tsquery('english', $1)"),
        [mockProps.term, 'ConstructPrefix'],
      )
      expect(sqlBuilderModules.orderBy).toBeCalledTimes(1)
      expect(sqlBuilderModules.orderBy).toBeCalledWith(
        sqlMatch('ts_rank(name_username_vector, websearch_to_tsquery($1)) desc,'),
        [mockProps.term],
      )
      expect(sqlBuilderModules.limit).toBeCalledTimes(1)
      expect(sqlBuilderModules.limit).toBeCalledWith(
        mockProps.limit,
        mockProps.page * mockProps.limit,
      )
      expect(mockPg.map).toBeCalledTimes(1)
      expect(mockPg.map).toBeCalledWith(mockSearchAllSql, null, expect.any(Function))
    })

    it('should return an array of uniq users if no term is supplied', async () => {
      const mockProps = {
        limit: 10,
        page: 1,
      } as any
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockSearchAllSql = 'mockSQL'
      const mockAllUser = [{id: 'mockId 1'}, {id: 'mockId 2'}, {id: 'mockId 3'}]

      ;(sqlBuilderModules.renderSql as jest.Mock).mockReturnValue(mockSearchAllSql)
      ;(sqlBuilderModules.select as jest.Mock).mockReturnValue('Select')
      ;(sqlBuilderModules.from as jest.Mock).mockReturnValue('From')
      ;(sqlBuilderModules.orderBy as jest.Mock).mockReturnValue('OrderBy')
      ;(sqlBuilderModules.limit as jest.Mock).mockReturnValue('Limit')
      ;(supabaseUsers.convertUser as jest.Mock).mockResolvedValue(null)
      ;(mockPg.map as jest.Mock).mockResolvedValue(mockAllUser)
      ;(toUserAPIResponse as jest.Mock)
        .mockReturnValueOnce(mockAllUser[0].id)
        .mockReturnValueOnce(mockAllUser[1].id)
        .mockReturnValueOnce(mockAllUser[2].id)

      const result: any = await searchUsers(mockProps, mockAuth, mockReq)

      expect(result[0]).toContain(mockAllUser[0].id)
      expect(result[1]).toContain(mockAllUser[1].id)
      expect(result[2]).toContain(mockAllUser[2].id)

      expect(sqlBuilderModules.renderSql).toBeCalledTimes(1)
      expect(sqlBuilderModules.renderSql).toBeCalledWith(['Select', 'From'], 'OrderBy', 'Limit')

      expect(sqlBuilderModules.select).toBeCalledTimes(1)
      expect(sqlBuilderModules.select).toBeCalledWith('*')
      expect(sqlBuilderModules.from).toBeCalledTimes(1)
      expect(sqlBuilderModules.from).toBeCalledWith('users')
      expect(sqlBuilderModules.orderBy).toBeCalledTimes(1)
      expect(sqlBuilderModules.orderBy).toBeCalledWith(
        expect.stringMatching(`data->'creatorTraders'->'allTime' desc nulls last`),
      )
      expect(sqlBuilderModules.limit).toBeCalledTimes(1)
      expect(sqlBuilderModules.limit).toBeCalledWith(
        mockProps.limit,
        mockProps.page * mockProps.limit,
      )
      expect(mockPg.map).toBeCalledTimes(1)
      expect(mockPg.map).toBeCalledWith(mockSearchAllSql, null, expect.any(Function))
    })
  })
})
