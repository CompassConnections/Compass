import {Body, Button, Container, Head, Html, Preview, Section, Text,} from '@react-email/components'
import {type User} from 'common/user'
import {type ProfileRow} from 'common/profiles/profile'
import {jamesProfile, jamesUser, mockUser,} from './functions/mock'
import {DOMAIN} from 'common/envs/constants'
import {button, container, content, Footer, imageContainer, main, paragraph} from "email/utils";

interface NewMessageEmailProps {
  fromUser: User
  fromUserProfile: ProfileRow
  toUser: User
  channelId: number
  unsubscribeUrl: string
  email?: string
}

export const NewMessageEmail = ({
                                  fromUser,
                                  // fromUserProfile,
                                  toUser,
                                  channelId,
                                  unsubscribeUrl,
                                  email,
                                }: NewMessageEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const creatorName = fromUser.name
  const messagesUrl = `https://${DOMAIN}/messages/${channelId}`
  // const userImgSrc = getOgImageUrl(fromUser, fromUserProfile)

  return (
    <Html>
      <Head/>
      <Preview>New message from {creatorName}</Preview>
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
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>{creatorName} just messaged you!</Text>

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
                View message
              </Button>
            </Section>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name}/>
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
} as NewMessageEmailProps


export default NewMessageEmail
