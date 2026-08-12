import {newMemberDiscordMessage} from 'common/discord/messages'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'

const alice = {name: 'Alice', username: 'alice'}
const bob = {name: 'Bob', username: 'bob'}

describe('newMemberDiscordMessage', () => {
  it('announces a member who arrived on their own', () => {
    expect(newMemberDiscordMessage(alice, null)).toBe(
      `[**Alice**](${DEPLOYED_WEB_URL}/alice) just created a profile`,
    )
  })

  it('names and links the member who brought them', () => {
    expect(newMemberDiscordMessage(alice, bob)).toBe(
      `[**Alice**](${DEPLOYED_WEB_URL}/alice) just created a profile, ` + `brought by bob`,
    )
  })
})
