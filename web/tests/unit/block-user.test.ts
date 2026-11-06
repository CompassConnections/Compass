/** @jest-environment jsdom */
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {PrivateUser, User} from 'common/user'
import {createElement} from 'react'
import {BlockUser} from 'web/components/profile/block-user'
import {api} from 'web/lib/api'

jest.mock('web/lib/api', () => ({api: jest.fn()}))
jest.mock('web/hooks/use-profiles', () => ({
  invalidateProfilesCache: jest.fn(),
  removeProfileFromCache: jest.fn(),
}))
jest.mock('web/lib/service/analytics', () => ({
  // The toast reports a failure, so all that is left of the rejection here is noise.
  withTracking: (fn: () => Promise<void>) => () => fn().catch(() => {}),
}))
jest.mock('web/lib/locale', () => ({
  useT: () => (_key: string, fallback: string) => fallback,
}))

const user = {id: 'other', name: 'Other'} as User

const renderBlockUser = (blockedUserIds: string[] = []) => {
  const closeModal = jest.fn()
  const currentUser = {blockedUserIds} as PrivateUser
  render(createElement(BlockUser, {user, currentUser, closeModal}))
  return closeModal
}

describe('BlockUser', () => {
  it('closes the dialog once blocked', async () => {
    ;(api as jest.Mock).mockResolvedValue({})
    const closeModal = renderBlockUser()

    fireEvent.click(screen.getByRole('button', {name: 'Block Other'}))

    await waitFor(() => expect(closeModal).toHaveBeenCalled())
  })

  it('closes the dialog once unblocked', async () => {
    ;(api as jest.Mock).mockResolvedValue({})
    const closeModal = renderBlockUser(['other'])

    fireEvent.click(screen.getByRole('button', {name: 'Unblock Other'}))

    await waitFor(() => expect(closeModal).toHaveBeenCalled())
  })

  it('stays open if blocking fails, so it can be retried', async () => {
    ;(api as jest.Mock).mockRejectedValue(new Error('Network'))
    const closeModal = renderBlockUser()

    fireEvent.click(screen.getByRole('button', {name: 'Block Other'}))
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(closeModal).not.toHaveBeenCalled()
  })
})
