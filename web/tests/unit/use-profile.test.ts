/** @jest-environment jsdom */
import {act, renderHook, waitFor} from '@testing-library/react'
import {getProfileRowWithFrontendSupabase} from 'common/profiles/profile'
import {User} from 'common/user'
import {useProfileByUser} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'

jest.mock('web/lib/api', () => ({api: jest.fn()}))
jest.mock('web/lib/supabase/db', () => ({db: {}}))
jest.mock('web/hooks/use-user', () => ({useUser: jest.fn()}))
jest.mock('common/profiles/profile', () => ({
  ...jest.requireActual('common/profiles/profile'),
  getProfileRowWithFrontendSupabase: jest.fn(),
}))

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

let nextUserId = 0

describe('useProfileByUser', () => {
  const setup = () => {
    // Results are shared in memory by user id, so each test needs one of its own.
    const user = {id: `user-${nextUserId++}`, username: 'someone'} as User
    const anonymous = deferred<any>()
    const signedIn = deferred<any>()
    ;(getProfileRowWithFrontendSupabase as jest.Mock).mockReturnValue(anonymous.promise)
    ;(api as jest.Mock).mockReturnValue(signedIn.promise)

    // Signed out at first, as on a full page load, then the session comes back.
    ;(useUser as jest.Mock).mockReturnValue(null)
    const hook = renderHook(() => useProfileByUser(user))
    ;(useUser as jest.Mock).mockReturnValue({id: 'viewer'})
    hook.rerender()

    return {...hook, anonymous, signedIn}
  }

  it('keeps the signed-in read when the redacted one lands after it', async () => {
    const {result, anonymous, signedIn} = setup()

    await act(async () => signedIn.resolve({profile: {headline: 'Whole'}}))
    await act(async () => anonymous.resolve({headline: null}))

    expect(result.current.profile?.headline).toBe('Whole')
  })

  it('ignores a late failure of the signed-out read', async () => {
    const {result, anonymous, signedIn} = setup()

    await act(async () => signedIn.resolve({profile: {headline: 'Whole'}}))
    await act(async () => anonymous.reject(new Error('Network')))

    expect(result.current.profile?.headline).toBe('Whole')
  })

  it('uses the latest read when they land in order', async () => {
    const {result, anonymous, signedIn} = setup()

    await act(async () => anonymous.resolve({headline: null}))
    await act(async () => signedIn.resolve({profile: {headline: 'Whole'}}))

    await waitFor(() => expect(result.current.profile?.headline).toBe('Whole'))
  })
})
