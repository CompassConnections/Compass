import {AuthedUser} from 'api/helpers/endpoint'
import {updateOptions} from 'api/update-options'
import {sqlMatch} from 'common/test-utils'
import {tryCatch} from 'common/util/try-catch'
import * as supabaseInit from 'shared/supabase/init'

jest.mock('common/util/try-catch')
jest.mock('shared/supabase/init')

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
      const mockRow1 = {
        id: 1234,
      }
      const mockRow2 = {
        id: 12345,
      }

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
      ;(mockTx.one as jest.Mock).mockResolvedValueOnce(mockRow1).mockResolvedValueOnce(mockRow2)
      ;(mockTx.manyOrNone as jest.Mock).mockResolvedValue([])

      const result: any = await updateOptions(mockProps, mockAuth, mockReq)

      expect(result.updatedIds).toStrictEqual([mockRow1.id, mockRow2.id])
      expect(mockPg.oneOrNone).toBeCalledTimes(1)
      expect(mockPg.oneOrNone).toBeCalledWith(
        sqlMatch('SELECT id FROM profiles WHERE user_id = $1'),
        [mockAuth.uid],
      )
      expect(tryCatch).toBeCalledTimes(1)
      expect(mockTx.one).toBeCalledTimes(2)
      expect(mockTx.one).toHaveBeenNthCalledWith(
        1,
        sqlMatch(`INSERT INTO ${mockProps.table} (name, creator_id)`),
        [mockProps.values[0], mockAuth.uid],
      )
      expect(mockTx.one).toHaveBeenNthCalledWith(
        2,
        sqlMatch(`INSERT INTO ${mockProps.table} (name, creator_id)`),
        [mockProps.values[1], mockAuth.uid],
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
        [mockProfileIdResult.id, mockRow1.id, mockRow2.id],
      )
    })
  })
  describe('when an error occurs', () => {
    it('should throw if the table param is invalid', async () => {
      const mockProps = {
        table: 'causes' as const,
        values: ['mockNamesOne', 'mockNamesTwo'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any

      jest.spyOn(Array.prototype, 'includes').mockReturnValue(false)

      expect(updateOptions(mockProps, mockAuth, mockReq)).rejects.toThrow('Invalid table')
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

    it('should update user', async () => {
      const mockProps = {
        table: 'causes' as const,
        values: ['mockNamesOne', 'mockNamesTwo'],
      }
      const mockAuth = {uid: '321'} as AuthedUser
      const mockReq = {} as any
      const mockProfileIdResult = {id: 123}
      const mockRow1 = {
        id: 1234,
      }
      const mockRow2 = {
        id: 12345,
      }

      jest.spyOn(Array.prototype, 'includes').mockReturnValue(true)
      ;(mockPg.oneOrNone as jest.Mock).mockResolvedValue(mockProfileIdResult)
      ;(tryCatch as jest.Mock).mockResolvedValue({data: null, error: Error})
      ;(mockPg.tx as jest.Mock).mockResolvedValue(null)
      ;(mockTx.one as jest.Mock).mockResolvedValueOnce(mockRow1).mockResolvedValueOnce(mockRow2)
      ;(mockTx.none as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null)

      expect(updateOptions(mockProps, mockAuth, mockReq)).rejects.toThrow(
        'Error updating profile options',
      )
    })
  })
})
