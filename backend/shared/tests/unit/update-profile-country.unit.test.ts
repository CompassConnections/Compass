import {updateProfile} from 'shared/supabase/users'
import {update} from 'shared/supabase/utils'

jest.mock('shared/supabase/init', () => ({createSupabaseDirectClient: () => ({})}))
jest.mock('shared/supabase/utils', () => ({
  update: jest.fn(),
  updateData: jest.fn(),
}))
jest.mock('shared/websockets/helpers', () => ({
  broadcastUpdatedUser: jest.fn(),
  broadcastUpdatedPrivateUser: jest.fn(),
}))

const updateMock = update as jest.Mock

describe('updateProfile', () => {
  beforeEach(() => updateMock.mockReset())

  const written = () => updateMock.mock.calls[0][3]

  // Whichever synonym a caller was handed — GeoDB, an LLM extraction, a hand-typed form — only the
  // canonical spelling may reach the column, or filtering by country splits into several buckets.
  it('writes the canonical US name whatever synonym it is given', async () => {
    await updateProfile('uid1', {
      country: 'United States',
      raised_in_country: 'United States of America',
    })

    expect(written()).toMatchObject({
      user_id: 'uid1',
      country: 'USA',
      raised_in_country: 'USA',
    })
  })

  it('leaves other countries as they are', async () => {
    await updateProfile('uid1', {country: 'Belgium'})

    expect(written()).toMatchObject({country: 'Belgium'})
  })

  it('does not invent a country when none is being updated', async () => {
    await updateProfile('uid1', {city: 'Austin'})

    expect(written()).not.toHaveProperty('country')
  })
})
