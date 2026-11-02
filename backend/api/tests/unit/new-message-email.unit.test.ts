import {type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import {NewMessageEmail} from 'email/new-message'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

const fromUser = {
  id: 'james',
  name: 'James Carter',
  username: 'james',
  avatarUrl: 'https://compassmeet.com/james.jpg',
} as unknown as User
const toUser = {id: 'ada', name: 'Ada Lovelace', username: 'ada'} as unknown as User
const fromUserProfile = {age: 31, city: 'Lyon'} as unknown as ProfileRow

// `@react-email/render` loads react-dom/server through a dynamic import that Jest's CommonJS
// runtime refuses, and the assertions are about words, not email-client markup, so plain
// react-dom is enough here.
const renderStage = (stage: 'opener' | 'ongoing') =>
  renderToStaticMarkup(
    React.createElement(NewMessageEmail, {
      fromUser,
      fromUserProfile,
      toUser,
      channelId: 7,
      stage,
      unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
      email: 'ada@example.com',
    }),
  )

describe('NewMessageEmail', () => {
  it('introduces the sender when the reader has never written back', () => {
    const html = renderStage('opener')
    expect(html).toContain('James Carter just messaged you!')
    expect(html).toContain('@james · 31 · Lyon')
    expect(html).toContain('View profile')
    expect(html).toContain('One sentence back is usually all it takes')
    expect(html).toContain('Read &amp; reply')
    expect(html).not.toContain('sent you a new message')
  })

  it('only says the conversation moved once the reader has written in it', () => {
    const html = renderStage('ongoing')
    // Not "replied": this may be the sender reviving a quiet thread or writing twice in a row.
    expect(html).toContain('James Carter sent you a new message.')
    expect(html).not.toContain('replied')
    expect(html).toContain('Continue the conversation')
    // The reader already knows who this is: no first-contact introduction or coaching.
    expect(html).not.toContain('just messaged you')
    expect(html).not.toContain('@james')
    expect(html).not.toContain('Lyon')
    expect(html).not.toContain('View profile')
    expect(html).not.toContain('One sentence back')
    // The daily-cap note still applies to every stage.
    expect(html).toContain('at most one email per day per conversation')
  })
})
