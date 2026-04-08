import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import {ANDROID_APP_URL} from 'common/constants'
import {DOMAIN} from 'common/envs/constants'
import {type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import {button, container, content, Footer, imageContainer, main, paragraph} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {jamesProfile, jamesUser, mockUser} from './functions/mock'

interface NewMessageEmailProps {
  fromUser: User
  fromUserProfile: ProfileRow
  toUser: User
  channelId: number
  unsubscribeUrl: string
  email?: string
  locale?: string
}

export const NewMessageEmail = ({
  fromUser,
  // fromUserProfile,
  toUser,
  channelId,
  unsubscribeUrl,
  email,
  locale,
}: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const creatorName = fromUser.name
  const messagesUrl = `https://${DOMAIN}/messages/${channelId}`
  // const userImgSrc = getOgImageUrl(fromUser, fromUserProfile)
  const t = createT(locale)

  return (
    <Html>
      <Head />
      <Preview>
        {t('email.new_message.preview', 'New message from {creatorName}', {creatorName})}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/*<Section style={logoContainer}>*/}
          {/*  <Img*/}
          {/*    src="..."*/}
          {/*    width="550"*/}
          {/*    height="auto"*/}
          {/*    alt="compassmeet.com"*/}
          {/*  />*/}
          {/*</Section>*/}

          <Section style={content}>
            <Text style={paragraph}>{t('email.new_message.greeting', 'Hi {name},', {name})}</Text>

            <Text style={paragraph}>
              {t('email.new_message.message', '{creatorName} just messaged you!', {creatorName})}
            </Text>

            <Section style={imageContainer}>
              {/*<Link href={messagesUrl}>*/}
              {/*  <Img*/}
              {/*    src={userImgSrc}*/}
              {/*    width="375"*/}
              {/*    height="200"*/}
              {/*    alt={`${creatorName}'s profile`}*/}
              {/*    style={profileImage}*/}
              {/*  />*/}
              {/*</Link>*/}

              <Button href={messagesUrl} style={button}>
                {t('email.new_message.viewButton', 'View message')}
              </Button>
            </Section>

            <Text style={{...paragraph, fontSize: '12px', color: '#888', marginTop: '32px'}}>
              {t(
                'email.new_message.daily_limit',
                "To avoid overloading your inbox, you'll receive at most one email per day per conversation. If {creatorName} sends more messages today, you won't be notified by email.",
                {creatorName},
              )}{' '}
              {t(
                'email.new_message.app_prompt',
                'Want real-time notifications? Download the Compass app for Android:',
              )}{' '}
              <Link href={ANDROID_APP_URL} style={{color: '#2563eb', textDecoration: 'none'}}>
                {t('email.new_message.app_link', 'Get the app')}
              </Link>
              {'.'}
            </Text>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
  )
}

NewMessageEmail.PreviewProps = {
  fromUser: jamesUser,
  fromUserProfile: jamesProfile,
  toUser: mockUser,
  channelId: 1,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  // locale: 'fr',
} as NewMessageEmailProps

export default NewMessageEmail
