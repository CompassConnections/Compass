import {ENV_CONFIG} from 'common/envs/constants'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {AdminBadge, UserBadge} from 'web/components/widgets/user-link'

/**
 * The admin badge is a trust signal, so the two things worth pinning are that it comes from the user
 * id and that it says the word rather than drawing a glyph a display name could imitate. Both are
 * easy to undo by accident — swapping the chip for a bare icon "to save space", or keying the badge
 * off a field that travels with the user object.
 */

const adminId = ENV_CONFIG.adminIds[0]

const badgeFor = (userId: string, username: string) =>
  renderToStaticMarkup(createElement(UserBadge, {userId, username}))

describe('AdminBadge', () => {
  it('renders the word, not just an icon', () => {
    // A lone shield or checkmark is reproducible in a display name; "Admin" on a filled chip is not.
    const html = renderToStaticMarkup(createElement(AdminBadge, {}))
    expect(html).toContain('Admin')
    expect(html).toContain('bg-cta')
  })
})

describe('UserBadge', () => {
  it('badges an account on the admin list', () => {
    expect(badgeFor(adminId, 'someone')).toContain('admin-badge')
  })

  it('badges nobody else, whatever they call themselves', () => {
    expect(badgeFor('not-an-admin', 'admin')).not.toContain('admin-badge')
    expect(badgeFor('not-an-admin', 'compass')).not.toContain('admin-badge')
  })
})
