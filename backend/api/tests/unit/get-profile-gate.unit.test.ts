import {getProfileGate} from 'api/get-profile-gate'
import {AuthedUser} from 'api/helpers/endpoint'
import * as constants from 'common/envs/constants'
import {MIN_ANSWERS_TO_MESSAGE, MIN_BIO_CHARS_TO_MESSAGE} from 'common/moderation/first-message'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'

jest.mock('shared/supabase/init')
jest.mock('shared/utils')
// `isAdminId` returns true for everyone when running locally, which would exempt the test user.
jest.mock('common/envs/constants', () => ({
  ...jest.requireActual('common/envs/constants'),
  isAdminId: jest.fn(),
  isModId: jest.fn(),
}))

const mockAuth = {uid: '321'} as AuthedUser
const mockReq = {} as any

describe('getProfileGate', () => {
  let mockPg = {} as any
  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {oneOrNone: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
    ;(sharedUtils.getUser as jest.Mock).mockResolvedValue({id: '321', username: 'newbie'})
    ;(constants.isAdminId as jest.Mock).mockReturnValue(false)
    ;(constants.isModId as jest.Mock).mockReturnValue(false)
  })

  it('reports nothing missing for a member who has done their part', async () => {
    mockPg.oneOrNone.mockResolvedValue({
      bio_chars: `${MIN_BIO_CHARS_TO_MESSAGE}`,
      answers: `${MIN_ANSWERS_TO_MESSAGE}`,
    })

    expect(await getProfileGate({}, mockAuth, mockReq)).toEqual({issues: null})
    expect(mockPg.oneOrNone).toHaveBeenCalledWith(expect.stringContaining('bio_chars'), ['321'])
  })

  it('names what is missing, the same way the channel handler does', async () => {
    mockPg.oneOrNone.mockResolvedValue({bio_chars: '0', answers: `${MIN_ANSWERS_TO_MESSAGE}`})

    expect(await getProfileGate({}, mockAuth, mockReq)).toEqual({
      issues: {bio: true, answers: false},
    })
  })

  it('treats a member with no profile row as having nothing filled in', async () => {
    mockPg.oneOrNone.mockResolvedValue(null)

    // The answers rule is tunable down to zero, at which point nobody can fail it.
    expect(await getProfileGate({}, mockAuth, mockReq)).toEqual({
      issues: {bio: true, answers: MIN_ANSWERS_TO_MESSAGE > 0},
    })
  })

  it('exempts staff without consulting the profile', async () => {
    ;(constants.isModId as jest.Mock).mockReturnValue(true)

    expect(await getProfileGate({}, mockAuth, mockReq)).toEqual({issues: null})
    expect(mockPg.oneOrNone).not.toHaveBeenCalled()
  })

  it('refuses an unknown account', async () => {
    ;(sharedUtils.getUser as jest.Mock).mockResolvedValue(null)

    const error = await getProfileGate({}, mockAuth, mockReq).catch((e) => e)

    expect(error.code).toBe(401)
  })
})
