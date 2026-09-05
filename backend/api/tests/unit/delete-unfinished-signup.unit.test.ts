jest.mock('shared/supabase/init')
jest.mock('shared/unfinished-signups')

import {deleteUnfinishedSignup} from 'api/delete-unfinished-signup'
import * as supabaseInit from 'shared/supabase/init'
import * as ledgerModules from 'shared/unfinished-signups'

const TOKEN = 'a'.repeat(64)
const call = () => deleteUnfinishedSignup({token: TOKEN}, undefined as any, undefined as any)

describe('deleteUnfinishedSignup', () => {
  let mockPg = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {oneOrNone: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(ledgerModules.deleteUnfinishedLogin as jest.Mock).mockResolvedValue(undefined)
  })

  it('answers "gone" for a token it has never issued', async () => {
    mockPg.oneOrNone.mockResolvedValueOnce(null)

    expect(await call()).toEqual({status: 'gone'})
    expect(ledgerModules.deleteUnfinishedLogin).not.toHaveBeenCalled()
  })

  it('answers "gone" for a login already deleted', async () => {
    mockPg.oneOrNone.mockResolvedValueOnce({
      firebase_uid: 'u',
      auth_created_at: new Date(),
      deleted_at: new Date(),
    })

    expect(await call()).toEqual({status: 'gone'})
    expect(ledgerModules.deleteUnfinishedLogin).not.toHaveBeenCalled()
  })

  it('refuses to touch a login that has since become an account', async () => {
    mockPg.oneOrNone
      .mockResolvedValueOnce({firebase_uid: 'u', auth_created_at: new Date(), deleted_at: null})
      .mockResolvedValueOnce({id: 'u'})

    expect(await call()).toEqual({status: 'has_account'})
    expect(ledgerModules.deleteUnfinishedLogin).not.toHaveBeenCalled()
  })

  it('deletes the login and records that the person asked for it', async () => {
    const createdAt = new Date('2026-08-01T00:00:00Z')
    mockPg.oneOrNone
      .mockResolvedValueOnce({firebase_uid: 'u', auth_created_at: createdAt, deleted_at: null})
      .mockResolvedValueOnce(null)

    expect(await call()).toEqual({status: 'deleted'})
    expect(ledgerModules.deleteUnfinishedLogin).toHaveBeenCalledWith(
      {uid: 'u', authCreatedAt: createdAt, reason: 'self'},
      mockPg,
    )
  })
})
