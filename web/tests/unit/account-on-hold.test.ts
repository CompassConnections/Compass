/** @jest-environment jsdom */
import {render, screen} from '@testing-library/react'
import {createElement} from 'react'
import {AccountOnHoldNotice} from 'web/components/moderation/account-on-hold'

jest.mock('web/lib/locale', () => ({
  useT: () => (_key: string, fallback: string) => fallback,
}))

const renderNotice = (reason: Parameters<typeof AccountOnHoldNotice>[0]['reason']) =>
  render(createElement(AccountOnHoldNotice, {reason}))

describe('AccountOnHoldNotice', () => {
  it('calls a provisional hold a hold', () => {
    renderNotice('under_review')
    expect(screen.getByText('Your account is on hold')).toBeTruthy()
  })

  it('says a rate limit is being looked at', () => {
    renderNotice('auto_rate_limit')
    expect(screen.getByText('Your account is on hold while we take a look')).toBeTruthy()
  })

  // Nobody is left to review it, and the copy must not promise otherwise or say what gave them away.
  it('calls a confirmed ban final, with no promise of a review', () => {
    const {container} = renderNotice('confirmed_abuse')
    expect(screen.getByText('This account has been closed')).toBeTruthy()
    expect(container.textContent).not.toMatch(/review|hours/i)
  })
})
