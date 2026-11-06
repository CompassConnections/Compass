import {safeRedirectPath} from 'web/lib/util/safe-redirect'

describe('safeRedirectPath', () => {
  it.each([
    ['/messages'],
    ['/vote/12'],
    ['/profile?tab=photos'],
    ['/vote/12#comment-3'],
    ['/signin?redirect=%2Fmessages'],
  ])('keeps the same-site path %s', (path) => {
    expect(safeRedirectPath(path)).toBe(path)
  })

  it.each([
    ['absolute URL', 'https://evil.com'],
    ['look-alike host', 'https://compassmeet.com.evil.com/signin'],
    ['protocol-relative', '//evil.com'],
    ['backslash', '/\\evil.com'],
    ['double backslash', '\\\\evil.com'],
    ['tab inside the slashes', '/\t/evil.com'],
    ['newline inside the slashes', '/\n/evil.com'],
    ['slashes that appear after normalising', '/.//evil.com'],
    ['the same, through a parent segment', '/a/..//evil.com'],
    ['javascript URL', 'javascript:alert(1)'],
    ['data URL', 'data:text/html,hi'],
    ['no leading slash', 'evil.com'],
    ['empty', ''],
  ])('rejects %s', (_, path) => {
    expect(safeRedirectPath(path)).toBeNull()
  })

  it('rejects a missing value', () => {
    expect(safeRedirectPath(null)).toBeNull()
    expect(safeRedirectPath(undefined)).toBeNull()
  })
})
