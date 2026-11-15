import {type User} from 'common/user'
import {CircleEmail, type CircleEmailKind} from 'email/circle'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

const fromUser = {id: 'james', name: 'James Carter', username: 'james'} as unknown as User
const toUser = {id: 'ada', name: 'Ada Lovelace', username: 'ada'} as unknown as User

// Plain react-dom, as in new-message-email.unit.test.ts: the assertions are about words and links.
const render = (kind: CircleEmailKind) =>
  renderToStaticMarkup(
    React.createElement(CircleEmail, {
      kind,
      fromUser,
      toUser,
      unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
      email: 'ada@example.com',
    }),
  )

describe('CircleEmail', () => {
  it('tells an owner who asked, what joining shows, and that they can ignore it', () => {
    const html = render('requested')
    expect(html).toContain('Hi Ada,')
    expect(html).toContain('James Carter asked to join your circle')
    expect(html).toContain('the parts of your profile you keep for it')
    expect(html).toContain('simply ignore the request')
    expect(html).toContain('Open their profile to decide')
  })

  it('tells a member who added them and what they can now see', () => {
    const html = render('added')
    expect(html).toContain('James Carter added you to their circle')
    expect(html).toContain('you can now see the parts of their profile')
    expect(html).toContain('View their profile')
  })

  it.each(['requested', 'added'] as const)("links to the other person's profile (%s)", (kind) => {
    expect(render(kind)).toMatch(/href="https:\/\/[^"]+\/james"/)
  })
})
