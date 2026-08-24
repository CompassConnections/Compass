import {readFileSync} from 'fs'
import {join} from 'path'

/**
 * `?referrer=` attribution is invisible when it breaks: the visitor signs up fine, the referrer just
 * never gets credited, and nothing in the UI says so. It broke exactly once already — `useSaveReferral`
 * was mounted only on `/[username]`, so `compassmeet.com/Martin` saved the referral but
 * `compassmeet.com/?referrer=Martin` (the link the referrals page hands out) silently dropped it.
 *
 * `testEnvironment` is `node` and there's no DOM test renderer here, so the effect itself can't be
 * exercised. These assertions pin the two things whose absence caused that bug instead: the hook is
 * mounted app-wide, and the component doing the mounting actually calls it.
 */

const read = (...parts: string[]) => readFileSync(join(__dirname, '..', '..', ...parts), 'utf8')

describe('referral capture', () => {
  it('is mounted app-wide, not only on the profile page', () => {
    const app = read('pages', '_app.tsx')

    expect(app).toContain("from 'web/components/save-referral'")
    expect(app).toContain('<SaveReferral />')
  })

  it('SaveReferral feeds the signed-in user to useSaveReferral', () => {
    const component = read('components', 'save-referral.tsx')

    // The hook only writes for `user === null` (logged out), so passing the user is what makes it
    // wait for auth to resolve instead of writing on every page for everyone.
    expect(component).toContain('useSaveReferral(user)')
    expect(component).toContain('useUser()')
  })

  it('reads both the plain and the base64 referrer params', () => {
    const hook = read('hooks', 'use-save-referral.ts')

    expect(hook).toContain("searchParams.get('referrer')")
    expect(hook).toContain("searchParams.get('r')")
  })
})
