import React from 'react'

import {jamesProfile, jamesUser, mockUser} from './functions/mock'
import {NewMessageEmail, type NewMessageEmailProps} from './new-message'

// The preview server renders one default export per file with one set of props, so the ongoing
// stage of the new-message email needs a file of its own to show up in the sidebar. Nothing sends
// this component: `sendNewMessageEmail` renders `NewMessageEmail` with `stage` set.
const NewMessageOngoingEmail = (props: NewMessageEmailProps) => (
  <NewMessageEmail {...props} stage="ongoing" />
)

NewMessageOngoingEmail.PreviewProps = {
  fromUser: jamesUser,
  fromUserProfile: jamesProfile,
  toUser: mockUser,
  channelId: 1,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  // locale: 'fr',
} as NewMessageEmailProps

export default NewMessageOngoingEmail
