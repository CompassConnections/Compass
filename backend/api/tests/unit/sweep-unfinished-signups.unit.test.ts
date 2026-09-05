jest.mock('shared/supabase/init')
jest.mock('email/functions/helpers')
jest.mock('shared/unfinished-signups')
jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}))

import {decideUnfinishedSignup, sweepUnfinishedSignups} from 'api/sweep-unfinished-signups'
import {DAY_MS} from 'common/util/time'
import * as helperModules from 'email/functions/helpers'
import * as firebaseAdmin from 'firebase-admin'
import * as supabaseInit from 'shared/supabase/init'
import * as ledgerModules from 'shared/unfinished-signups'

const NOW = new Date('2026-09-05T12:00:00Z')
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS)

const fbUser = (
  uid: string,
  createdDaysAgo: number,
  opts?: {email?: string | null; lastSignInDaysAgo?: number},
) => ({
  uid,
  email: opts?.email === null ? undefined : (opts?.email ?? `${uid}@example.com`),
  metadata: {
    creationTime: daysAgo(createdDaysAgo).toUTCString(),
    lastSignInTime: daysAgo(opts?.lastSignInDaysAgo ?? createdDaysAgo).toUTCString(),
  },
})

describe('decideUnfinishedSignup', () => {
  const login = (
    createdDaysAgo: number,
    extra: Partial<Parameters<typeof decideUnfinishedSignup>[0]> = {},
  ) => ({
    createdAt: daysAgo(createdDaysAgo),
    lastSignInAt: null,
    hasEmail: true,
    ...extra,
  })

  it('leaves a login created two days ago alone', () => {
    expect(decideUnfinishedSignup(login(2), undefined, NOW)).toEqual({
      kind: 'skip',
      why: 'too_recent',
    })
  })

  it('leaves anyone who signed in recently alone, even after a notice', () => {
    const row = {firebase_uid: 'u', notified_at: daysAgo(40), deleted_at: null}
    expect(decideUnfinishedSignup(login(50, {lastSignInAt: daysAgo(1)}), row, NOW)).toEqual({
      kind: 'skip',
      why: 'too_recent',
    })
  })

  it('notifies once the login is old enough and has an address', () => {
    expect(decideUnfinishedSignup(login(3), undefined, NOW)).toEqual({kind: 'notify'})
  })

  it('waits during the grace period after a notice', () => {
    const row = {firebase_uid: 'u', notified_at: daysAgo(29), deleted_at: null}
    expect(decideUnfinishedSignup(login(35), row, NOW)).toEqual({kind: 'skip', why: 'waiting'})
  })

  it('deletes when the grace period has run out', () => {
    const row = {firebase_uid: 'u', notified_at: daysAgo(30), deleted_at: null}
    expect(decideUnfinishedSignup(login(35), row, NOW)).toEqual({
      kind: 'delete',
      reason: 'grace_expired',
    })
  })

  it('deletes a six-month-old login without a notice', () => {
    expect(decideUnfinishedSignup(login(180), undefined, NOW)).toEqual({
      kind: 'delete',
      reason: 'stale',
    })
  })

  it('gives a login with no address the same total window, then deletes it', () => {
    expect(decideUnfinishedSignup(login(10, {hasEmail: false}), undefined, NOW)).toEqual({
      kind: 'skip',
      why: 'waiting',
    })
    expect(decideUnfinishedSignup(login(33, {hasEmail: false}), undefined, NOW)).toEqual({
      kind: 'delete',
      reason: 'no_email',
    })
  })

  it('retries a deletion the ledger claims but Firebase still lists', () => {
    const notified = {firebase_uid: 'u', notified_at: daysAgo(40), deleted_at: daysAgo(1)}
    const silent = {firebase_uid: 'u', notified_at: null, deleted_at: daysAgo(1)}
    expect(decideUnfinishedSignup(login(50), notified, NOW)).toEqual({
      kind: 'delete',
      reason: 'grace_expired',
    })
    expect(decideUnfinishedSignup(login(200), silent, NOW)).toEqual({
      kind: 'delete',
      reason: 'stale',
    })
  })
})

describe('sweepUnfinishedSignups', () => {
  let mockPg = {} as any
  let listUsers: jest.Mock

  const setup = (users: any[], known: string[] = [], ledger: any[] = []) => {
    listUsers = jest.fn().mockResolvedValue({users, pageToken: undefined})
    ;(firebaseAdmin.auth as unknown as jest.Mock).mockReturnValue({listUsers})
    mockPg.manyOrNone.mockImplementation(async (sql: string) =>
      sql.includes('from users') ? known.map((id) => ({id})) : ledger,
    )
  }

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {manyOrNone: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(ledgerModules.claimUnfinishedSignupNotice as jest.Mock).mockResolvedValue('tok')
    ;(ledgerModules.deleteUnfinishedLogin as jest.Mock).mockResolvedValue(undefined)
    ;(ledgerModules.getDeleteUnfinishedSignupUrl as jest.Mock).mockImplementation(
      (token: string) => `https://compassmeet.com/delete-unfinished-signup?token=${token}`,
    )
    ;(helperModules.sendUnfinishedSignupEmail as jest.Mock).mockResolvedValue({id: 'sent'})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('ignores logins that have a users row', async () => {
    setup([fbUser('member', 100)], ['member'])

    const result = await sweepUnfinishedSignups({now: NOW})

    expect(result.scanned).toBe(1)
    expect(result.unfinished).toBe(0)
    expect(helperModules.sendUnfinishedSignupEmail).not.toHaveBeenCalled()
    expect(ledgerModules.deleteUnfinishedLogin).not.toHaveBeenCalled()
  })

  it('claims the notice, then sends it with the delete link', async () => {
    setup([fbUser('orphan', 5)])

    const result = await sweepUnfinishedSignups({now: NOW})

    expect(ledgerModules.claimUnfinishedSignupNotice).toHaveBeenCalledWith(
      'orphan',
      expect.any(Date),
      mockPg,
    )
    expect(helperModules.sendUnfinishedSignupEmail).toHaveBeenCalledWith('orphan@example.com', {
      createdAt: expect.any(Date),
      deleteUrl: 'https://compassmeet.com/delete-unfinished-signup?token=tok',
    })
    expect(result.notified).toBe(1)
  })

  it('does not send when another run already claimed the notice', async () => {
    setup([fbUser('orphan', 5)])
    ;(ledgerModules.claimUnfinishedSignupNotice as jest.Mock).mockResolvedValue(null)

    const result = await sweepUnfinishedSignups({now: NOW})

    expect(helperModules.sendUnfinishedSignupEmail).not.toHaveBeenCalled()
    expect(result.notified).toBe(0)
  })

  it('deletes once the grace period after the notice has passed', async () => {
    setup(
      [fbUser('orphan', 40)],
      [],
      [{firebase_uid: 'orphan', notified_at: daysAgo(31), deleted_at: null}],
    )

    const result = await sweepUnfinishedSignups({now: NOW})

    expect(ledgerModules.deleteUnfinishedLogin).toHaveBeenCalledWith(
      {uid: 'orphan', authCreatedAt: expect.any(Date), reason: 'grace_expired'},
      mockPg,
    )
    expect(helperModules.sendUnfinishedSignupEmail).not.toHaveBeenCalled()
    expect(result.deleted.grace_expired).toBe(1)
  })

  it('deletes stale logins silently', async () => {
    setup([fbUser('old', 200)])

    const result = await sweepUnfinishedSignups({now: NOW})

    expect(ledgerModules.deleteUnfinishedLogin).toHaveBeenCalledWith(
      expect.objectContaining({uid: 'old', reason: 'stale'}),
      mockPg,
    )
    expect(ledgerModules.claimUnfinishedSignupNotice).not.toHaveBeenCalled()
    expect(result.deleted.stale).toBe(1)
  })

  it('caps notices at the batch size and reports the rest as deferred', async () => {
    setup([fbUser('a', 5), fbUser('b', 6), fbUser('c', 7)])

    const result = await sweepUnfinishedSignups({now: NOW, batchSize: 2})

    expect(helperModules.sendUnfinishedSignupEmail).toHaveBeenCalledTimes(2)
    expect(result.notified).toBe(2)
    expect(result.deferred).toBe(1)
  })

  it('touches nothing on a dry run but reports the same counts', async () => {
    setup([fbUser('a', 5), fbUser('old', 200), fbUser('new', 1)])

    const result = await sweepUnfinishedSignups({now: NOW, dryRun: true})

    expect(ledgerModules.claimUnfinishedSignupNotice).not.toHaveBeenCalled()
    expect(helperModules.sendUnfinishedSignupEmail).not.toHaveBeenCalled()
    expect(ledgerModules.deleteUnfinishedLogin).not.toHaveBeenCalled()
    expect(result).toMatchObject({notified: 1, deleted: {stale: 1}, tooRecent: 1, dryRun: true})
  })

  it('walks every Firebase page', async () => {
    listUsers = jest
      .fn()
      .mockResolvedValueOnce({users: [fbUser('a', 5)], pageToken: 'next'})
      .mockResolvedValueOnce({users: [fbUser('b', 5)], pageToken: undefined})
    ;(firebaseAdmin.auth as unknown as jest.Mock).mockReturnValue({listUsers})
    mockPg.manyOrNone.mockResolvedValue([])

    const result = await sweepUnfinishedSignups({now: NOW})

    expect(listUsers).toHaveBeenCalledTimes(2)
    expect(listUsers).toHaveBeenLastCalledWith(1000, 'next')
    expect(result.notified).toBe(2)
  })

  it('counts a failure and carries on with the next login', async () => {
    setup([fbUser('a', 5), fbUser('b', 5)])
    ;(helperModules.sendUnfinishedSignupEmail as jest.Mock)
      .mockRejectedValueOnce(new Error('resend down'))
      .mockResolvedValueOnce({id: 'sent'})

    const result = await sweepUnfinishedSignups({now: NOW})

    expect(result.failed).toBe(1)
    expect(result.notified).toBe(1)
  })
})
