import {getProfileComments} from 'api/get-profile-comments'
import {AuthedUser} from 'api/helpers/endpoint'
import * as profileVisibility from 'api/helpers/profile-visibility'
import {type ProfileComment} from 'common/comment'
import {sqlMatch} from 'common/test-utils'
import * as supabaseInit from 'shared/supabase/init'
import * as sharedUtils from 'shared/utils'

jest.mock('shared/supabase/init')
jest.mock('shared/utils')
jest.mock('api/helpers/profile-visibility')

const row = (id: number, user_id: string) => ({
  id,
  user_id,
  on_user_id: 'profileOwner',
  created_time: '2026-10-28T00:00:00Z',
  user_name: 'Name ' + user_id,
  user_username: 'user_' + user_id,
  user_avatar_url: null,
  hidden: false,
  content: {type: 'doc'},
})

describe('getProfileComments', () => {
  let mockPg = {} as any
  const mockProps = {userId: 'profileOwner'}
  const mockReq = {} as any

  beforeEach(() => {
    jest.resetAllMocks()
    mockPg = {manyOrNone: jest.fn()}
    ;(supabaseInit.createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the visible comments to a signed-out visitor, newest last', async () => {
    ;(profileVisibility.canReadProfileContent as jest.Mock).mockResolvedValue(true)
    ;(mockPg.manyOrNone as jest.Mock).mockResolvedValue([row(1, 'a'), row(2, 'b')])

    const result: any = await getProfileComments(mockProps, undefined, mockReq)

    expect(profileVisibility.canReadProfileContent).toBeCalledWith(undefined, 'profileOwner')
    expect(mockPg.manyOrNone).toBeCalledWith(sqlMatch('and not hidden'), ['profileOwner'])
    expect(sharedUtils.getPrivateUser).not.toBeCalled()
    expect(result.comments.map((c: ProfileComment) => c.id)).toEqual(['1', '2'])
    expect(result.comments[0]).toMatchObject({
      commentType: 'profile',
      onUserId: 'profileOwner',
      userId: 'a',
      hidden: false,
    })
  })

  it('leaves out comments by people the caller blocked or was blocked by', async () => {
    ;(profileVisibility.canReadProfileContent as jest.Mock).mockResolvedValue(true)
    ;(mockPg.manyOrNone as jest.Mock).mockResolvedValue([
      row(1, 'a'),
      row(2, 'blockedByMe'),
      row(3, 'blockedMe'),
    ])
    ;(sharedUtils.getPrivateUser as jest.Mock).mockResolvedValue({
      id: 'viewer',
      blockedUserIds: ['blockedByMe'],
      blockedByUserIds: ['blockedMe'],
    })

    const result: any = await getProfileComments(mockProps, {uid: 'viewer'} as AuthedUser, mockReq)

    expect(sharedUtils.getPrivateUser).toBeCalledWith('viewer')
    expect(result.comments.map((c: ProfileComment) => c.userId)).toEqual(['a'])
  })

  it('returns nothing for a profile the caller may not read', async () => {
    ;(profileVisibility.canReadProfileContent as jest.Mock).mockResolvedValue(false)

    const result: any = await getProfileComments(mockProps, {uid: 'viewer'} as AuthedUser, mockReq)

    expect(result).toEqual({comments: []})
    expect(mockPg.manyOrNone).not.toBeCalled()
  })
})
