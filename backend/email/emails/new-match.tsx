import {Body, Button, Container, Head, Html, Preview, Section, Text,} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import {jamesProfile, jamesUser, mockUser} from './functions/mock'
import {Footer} from "email/utils";

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
                                email
                              }: NewMatchEmailProps) => {
  const name = onUser.name.split(' ')[0]
  // const userImgSrc = getOgImageUrl(matchedWithUser, matchedProfile)
  const userUrl = `https://${DOMAIN}/${matchedWithUser.username}`

  return (
    <Html>
      <Head/>
      <Preview>You have a new match!</Preview>
      <Body style={main}>
        <Container style={container}>

          {/*<Section style={logoContainer}>*/}
          {/*<Img*/}
          {/*  src="..."*/}
          {/*  width="550"*/}
          {/*  height="auto"*/}
          {/*  alt="compassmeet.com"*/}
          {/*/>*/}
          {/*</Section>*/}

          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>
              {matchedWithUser.name} just matched with you!
            </Text>

            <Section style={imageContainer}>
              {/*<Link href={userUrl}>*/}
              {/*  <Img*/}
              {/*    src={userImgSrc}*/}
              {/*    width="375"*/}
              {/*    height="200"*/}
              {/*    alt=""*/}
              {/*    style={profileImage}*/}
              {/*  />*/}
              {/*</Link>*/}
              <Button href={userUrl} style={button}>
                View profile
              </Button>
            </Section>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name}/>
        </Container>
      </Body>
    </Html>
  )
}

NewMatchEmail.PreviewProps = {
  onUser: mockUser,
  matchedWithUser: jamesUser,
  matchedProfile: jamesProfile,
  email: 'someone@gmail.com',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
} as NewMatchEmailProps

const main = {
  // backgroundColor: '#f4f4f4',
  fontFamily: 'Arial, sans-serif',
  wordSpacing: 'normal',
}

const container = {
  margin: '0 auto',
  maxWidth: '600px',
}

// const logoContainer = {
//   padding: '20px 0px 5px 0px',
//   textAlign: 'center' as const,
//   backgroundColor: '#ffffff',
// }

const content = {
  backgroundColor: '#ffffff',
  padding: '20px 25px',
}

const paragraph = {
  fontSize: '18px',
  lineHeight: '24px',
  margin: '10px 0',
  color: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
}

const imageContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
}

// const profileImage = {
//   // border: '1px solid #ec489a',
// }

const button = {
  backgroundColor: '#4887ec',
  borderRadius: '12px',
  color: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 'semibold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '6px 10px',
  margin: '10px 0',
}

export default NewMatchEmail
