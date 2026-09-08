import {AuthedUser} from 'api/helpers/endpoint'
import {setProfileOptions, updateOptions} from 'api/update-options'
import {sqlMatch} from 'common/test-utils'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseInit from 'shared/supabase/init'
import * as options from 'shared/supabase/options'

jest.mock('common/util/try-catch')
jest.mock('shared/supabase/init')
jest.mock('shared/supabase/options')

describe('updateOptions', () => {
  let mockPg = {} as any
  let mockTx = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockTx = {
      one: jest.fn(),
      none: jest.fn(),
      manyOrNone: jest.fn(),
    }
    mockPg = {
      oneOrNone: jest.fn(),
      manyOrNone: jest.fn(),
      tx: jest.fn(async (cb) => await cb(mockTx)),
    }
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    // Names now go through the shared resolver rather than a raw INSERT in this file, so that pair
    // is what the happy path asserts against.
    ;(options.resolveOptionName as jest.Mock).mockResolvedValue(null)
    ;(options.createOption as jest.Mock).mockImplementation(async (_tx, _table, name: string) => ({
      id: '100',
      name,
    }))
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should update user', async () => {
      const mockProps = {
        table: 'causes' as const,
        values: ['mockNamesOne', 'mockNamesTwo'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockProfileIdResult = {id: 123}

      jest.spyOn(Array.prototype, 'includes').mockReturnValue(true)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockProfileIdResult)
      ;(tryCatch as jest.Mock).mockImplementation(async (fn: any) => {
        try {
          const data = await fn
          return {data, error: null}
        } catch (error) {
          return {data: null, error}
        }
      })
      ;(options.createOption as jest.Mock)
        .mockResolvedValueOnce({id: '1234', name: mockProps.values[0]})
        .mockResolvedValueOnce({id: '12345', name: mockProps.values[1]})
      ;(mockTx.manyOrNone as jest.Mock).mockResolvedValue([])

      const result: any = await updateOptions(mockProps, mockAuth, mockReq)

      expect(result.updatedIds).toStrictEqual(true)
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('SELECT id FROM profiles WHERE user_id = $1'),
        [mockAuth.uid],
      )
      expect(tryCatch).toBeCalledTimes(1)
      expect(options.createOption).toBeCalledTimes(2)
      // Passed through unchanged: these fixtures already carry a capital, and normalisation only
      // uppercases the first character of a name typed entirely in lower case.
      expect(options.createOption).toHaveBeenNthCalledWith(
        1,
        mockTx,
        mockProps.table,
        mockProps.values[0],
        mockAuth.uid,
      )
      expect(options.createOption).toHaveBeenNthCalledWith(
        2,
        mockTx,
        mockProps.table,
        mockProps.values[1],
        mockAuth.uid,
      )
      expect(mockTx.none).toBeCalledTimes(2)
      expect(mockTx.none).toHaveBeenNthCalledWith(
        1,
        sqlMatch(`DELETE
                        FROM profile_${mockProps.table}
                        WHERE profile_id = $1`),
        [mockProfileIdResult.id],
      )
      expect(mockTx.none).toHaveBeenNthCalledWith(
        2,
        sqlMatch(`INSERT INTO profile_${mockProps.table} (profile_id, option_id)
                        VALUES`),
        [mockProfileIdResult.id, 1234, 12345],
      )
    })
  })

  describe('when an error occurs', () => {
    it('should throw if the table param is invalid', async () => {
      const mockProps = {
        table: 'invalid_table' as any,
        values: ['mockNamesOne', 'mockNamesTwo'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      await expect(updateOptions(mockProps, mockAuth, mockReq)).rejects.toThrow('Invalid table')
    })

    it('should throw if the names param is not provided', async () => {
      const mockProps = {
        table: 'causes' as const,
        values: undefined,
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      jest.spyOn(Array.prototype, 'includes').mockReturnValue(true)

      expect(updateOptions(mockProps, mockAuth, mockReq)).rejects.toThrow('No ids provided')
    })

    it('should throw if unable to find profile', async () => {
      const mockProps = {
        table: 'causes' as const,
        values: ['mockNamesOne', 'mockNamesTwo'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      jest.spyOn(Array.prototype, 'includes').mockReturnValue(true)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(false)

      expect(updateOptions(mockProps, mockAuth, mockReq)).rejects.toThrow('Profile not found')
    })

    it('should throw if the transaction fails', async () => {
      const mockProps = {
        table: 'causes' as const,
        values: ['mockNamesOne', 'mockNamesTwo'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockProfileIdResult = {id: 123}

      jest.spyOn(Array.prototype, 'includes').mockReturnValue(true)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockProfileIdResult)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error})
      ;(mockPg.tx as jest.Mock).mockResolvedValue(null)

      expect(updateOptions(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Error updating profile options',
      )
    })
  })
})

/**
 * These cover the write path, which is where de-duplication is actually enforced.
 *
 * The picker's "did you mean" step is a nudge and can be walked past; the profile extractor never
 * goes through the picker at all. So whatever else happens, a name reaching `setProfileOptions` has
 * to be normalised and resolved here or it becomes a permanent duplicate.
 */
describe('setProfileOptions', () => {
  const PROFILE_ID = 7
  const USER_ID = 'user-1'
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {
      manyOrNone: jest.fn().mockResolvedValue([]),
      none: jest.fn().mockResolvedValue(null),
    }
    ;(options.resolveOptionName as jest.Mock).mockResolvedValue(null)
    ;(options.createOption as jest.Mock).mockImplementation(async (_tx, _t, name: string) => ({
      id: '100',
      name,
    }))
  })

  it('normalises a typed name before it is created', async () => {
    await setProfileOptions(mockPg, PROFILE_ID, USER_ID, 'interests', ['  video   games  '])

    expect(options.createOption).toHaveBeenCalledWith(mockPg, 'interests', 'Video games', USER_ID)
  })

  it('reuses an existing option instead of creating a second one', async () => {
    ;(options.resolveOptionName as jest.Mock).mockResolvedValue({
      option: {id: '42', name: 'Video games', usageCount: 9},
      matchedOn: 'alias',
    })

    await setProfileOptions(mockPg, PROFILE_ID, USER_ID, 'interests', ['Gaming'])

    expect(options.createOption).not.toHaveBeenCalled()
    expect(mockPg.none).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'), [
      PROFILE_ID,
      42,
    ])
  })

  it('collapses two spellings of the same name in one submission', async () => {
    // Both normalise to the same identity. Inserting both would violate the
    // (profile_id, option_id) unique constraint and fail the whole save.
    await setProfileOptions(mockPg, PROFILE_ID, USER_ID, 'interests', ['AI', 'ai'])

    expect(options.createOption).toHaveBeenCalledTimes(1)
  })

  it('drops a name that is not fit to be an option', async () => {
    await setProfileOptions(mockPg, PROFILE_ID, USER_ID, 'interests', [
      'hiking, cooking',
      'a'.repeat(200),
      '   ',
      'Chess',
    ])

    expect(options.createOption).toHaveBeenCalledTimes(1)
    expect(options.createOption).toHaveBeenCalledWith(mockPg, 'interests', 'Chess', USER_ID)
  })

  it('never inserts the same option id twice', async () => {
    ;(options.resolveOptionName as jest.Mock).mockResolvedValue({
      option: {id: '5', name: 'Chess', usageCount: 1},
      matchedOn: 'name',
    })

    // The id is already ticked, and the same option arrives again as a typed name.
    await setProfileOptions(mockPg, PROFILE_ID, USER_ID, 'interests', ['5', 'chess'])

    expect(mockPg.none).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'), [
      PROFILE_ID,
      5,
    ])
  })

  it('does nothing when the ids are unchanged and no names were typed', async () => {
    mockPg.manyOrNone.mockResolvedValue([{id: 3}, {id: 4}])

    await setProfileOptions(mockPg, PROFILE_ID, USER_ID, 'interests', ['3', '4'])

    expect(mockPg.none).not.toHaveBeenCalled()
  })
})
