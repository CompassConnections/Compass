import {newMemberDiscordMessage, newProposalDiscordMessage} from 'common/discord/messages'
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

const doc = (text: string) => ({
  type: 'doc',
  content: [{type: 'paragraph', content: [{type: 'text', text}]}],
})

describe('newProposalDiscordMessage', () => {
  const proposal = {id: 7, title: 'Chronological feed'}

  it('names and links the author, then the proposal', () => {
    expect(newProposalDiscordMessage(proposal, alice)).toBe(
      `[**Alice**](${DEPLOYED_WEB_URL}/alice) opened a new proposal: ` +
        `[**Chronological feed**](${DEPLOYED_WEB_URL}/vote/7)`,
    )
  })

  it('says nothing about the author of an anonymous proposal', () => {
    expect(newProposalDiscordMessage(proposal, null)).toBe(
      `A new anonymous proposal: [**Chronological feed**](${DEPLOYED_WEB_URL}/vote/7)`,
    )
  })

  it('appends the description as a single-line excerpt', () => {
    expect(newProposalDiscordMessage({...proposal, description: doc('Sort by time.')}, null)).toBe(
      `A new anonymous proposal: [**Chronological feed**](${DEPLOYED_WEB_URL}/vote/7)\n` +
        `Sort by time.`,
    )
  })

  // A proposal body is a whole document; the post is a pointer to it, not a copy of it.
  it('truncates a long description', () => {
    const message = newProposalDiscordMessage(
      {...proposal, description: doc('word '.repeat(200))},
      null,
    )
    const excerpt = message.split('\n')[1]

    // 300 characters plus the ellipsis, minus whatever trailing whitespace the cut left behind.
    expect(excerpt.length).toBeLessThanOrEqual(301)
    expect(excerpt.endsWith('…')).toBe(true)
  })

  it('omits an empty description entirely', () => {
    expect(newProposalDiscordMessage({...proposal, description: doc('')}, null)).not.toContain('\n')
  })
})
