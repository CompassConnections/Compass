import React from 'react';
import {Column, Img, Link, Row, Section, Text} from "@react-email/components";
import {DOMAIN} from "common/envs/constants";

interface Props {
  email?: string
  unsubscribeUrl: string
}

export const Footer = ({
                         email,
                         unsubscribeUrl,
                       }: Props) => {
  return <Section style={footer}>
    <hr style={{border: 'none', borderTop: '1px solid #e0e0e0', margin: '10px 0'}}/>
    <Row>
      <Column align="center">
        <Link href={`https://${DOMAIN}/github`} target="_blank">
          <Img
            src={`https://${DOMAIN}/images/github-logo.png`}
            width="24"
            height="24"
            alt="GitHub"
            style={{display: "inline-block", margin: "0 4px"}}
          />
        </Link>
        <Link href={`https://${DOMAIN}/discord`} target="_blank">
          <Img
            src={`https://${DOMAIN}/images/discord-logo.png`}
            width="24"
            height="24"
            alt="Discord"
            style={{display: "inline-block", margin: "0 4px"}}
          />
        </Link>
        <Link href={`https://${DOMAIN}/patreon`} target="_blank">
          <Img
            src={`https://${DOMAIN}/images/patreon-logo.png`}
            width="24"
            height="24"
            alt="Patreon"
            style={{display: "inline-block", margin: "0 4px"}}
          />
        </Link>
        <Link href={`https://${DOMAIN}/paypal`} target="_blank">
          <Img
            src={`https://${DOMAIN}/images/paypal-logo.png`}
            width="24"
            height="24"
            alt="PayPal"
            style={{display: "inline-block", margin: "0 4px"}}
          />
        </Link>
      </Column>
    </Row>

    <Row>
      <Text style={{fontSize: "12px", color: "#888", marginTop: "12px"}}>
        © {new Date().getFullYear()} Compass
      </Text>

      <Text style={{fontSize: "10px", color: "#888", marginTop: "12px"}}>
        The email was sent to {email}. To no longer receive these emails, unsubscribe {' '}
        <Link href={unsubscribeUrl}>
          here
        </Link>
        .
      </Text>
    </Row>
  </Section>
}

export const footer = {
  margin: '20px 0',
  textAlign: 'center' as const,
}

export const footerText = {
  fontSize: '11px',
  lineHeight: '22px',
  color: '#000000',
  fontFamily: 'Ubuntu, Helvetica, Arial, sans-serif',
}

export const blackLinks = {
  color: 'black'
}


// const footerLink = {
// color: 'inherit',
// textDecoration: 'none',
// }


export const main = {
  // backgroundColor: '#f4f4f4',
  fontFamily: 'Arial, sans-serif',
  wordSpacing: 'normal',
}

export const container = {
  margin: '0 auto',
  maxWidth: '600px',
}

export const logoContainer = {
  padding: '20px 0px 5px 0px',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
}

export const content = {
  backgroundColor: '#ffffff',
  padding: '20px 25px',
}

export const paragraph = {
  // fontSize: '12px',
  lineHeight: '24px',
  margin: '10px 0',
  color: '#000000',
  // fontFamily: 'Arial, Helvetica, sans-serif',
}

export const imageContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
}

export const profileImage = {
  // border: '1px solid #ec489a',
}

export const button = {
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
