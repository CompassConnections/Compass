import {Section} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import {Actions, CTAButton, EmailShell, Eyebrow, Heading, Lead} from 'email/utils'
import React from 'react'

import {jamesProfile, jamesUser, mockUser} from './functions/mock'

interface NewMatchEmailProps {
  onUser: User
  matchedWithUser: User
  matchedProfile: ProfileRow
  unsubscribeUrl: string
  email?: string
}

export const NewMatchEmail = ({
  onUser,
  matchedWithUser,
  // matchedProfile,
  unsubscribeUrl,
  email,
}: NewMatchEmailProps) => {
  const name = onUser.name.split(' ')[0]
  // const userImgSrc = getOgImageUrl(matchedWithUser, matchedProfile)
  const userUrl = `https://${DOMAIN}/${matchedWithUser.username}`

  return (
    // This one is currently unsent — its helper in `functions/helpers.tsx` is commented out — but it kept
    // a private copy of the old `main`/`container`/`content`/`button` styles, blue CTA and all, which is
    // exactly the drift the shared shell exists to stop. It now renders like everything else.
    <EmailShell
      preview="You have a new match!"
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
    >
      <Section style={{textAlign: 'center'}}>
        <Eyebrow>New match</Eyebrow>
      </Section>

      <Heading style={{margin: '18px 0 12px 0'}}>Hi {name},</Heading>

      <Lead>{matchedWithUser.name} just matched with you!</Lead>

      {/*<Section style={imageContainer}>*/}
      {/*  <Link href={userUrl}>*/}
      {/*    <Img*/}
      {/*      src={userImgSrc}*/}
      {/*      width="375"*/}
      {/*      height="200"*/}
      {/*      alt=""*/}
      {/*      style={profileImage}*/}
      {/*    />*/}
      {/*  </Link>*/}
      {/*</Section>*/}

      <Actions>
        <CTAButton href={userUrl}>View profile</CTAButton>
      </Actions>
    </EmailShell>
  )
}

NewMatchEmail.PreviewProps = {
  onUser: mockUser,
  matchedWithUser: jamesUser,
  matchedProfile: jamesProfile,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
} as NewMatchEmailProps

export default NewMatchEmail
