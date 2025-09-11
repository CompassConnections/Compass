import {Link, Row, Section, Text} from "@react-email/components";
import {
  TbBrandBluesky,
  TbBrandDiscord,
  TbBrandFacebook,
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandMastodon,
  TbBrandPatreon,
  TbBrandPaypal,
  TbBrandSpotify,
  TbBrandX
} from "react-icons/tb";

import {LinkIcon} from '@heroicons/react/solid'
import {Site} from 'common/src/socials'
import {LuBookmark} from 'react-icons/lu'

interface Props {
  email?: string
  unsubscribeUrl: string
}

export const Footer = ({
                         email,
                         unsubscribeUrl,
                       }: Props) => {
  return <Section style={footer}>
    <hr style={{border: 'none', borderTop: '1px solid #e0e0e0', margin: '20px 0'}}/>
    <Row>
      <Text style={footerText}>
        Compass © {new Date().getFullYear()}
      </Text>
      <Row>
        <div></div>
        <Link href="https://github.com/CompassMeet/Compass">
          <SocialIcon site={'github'} size={36} color={'black'}/>
        </Link>
        <Link href="https://discord.gg/8Vd7jzqjun">
          <SocialIcon site={'discord'} size={36} color={'black'}/>
        </Link>
        <Link href="https://patreon.com/CompassMeet">
          <SocialIcon site={'patreon'} size={36} color={'black'}/>
        </Link>
        <Link href="https://www.paypal.com/paypalme/MartinBraquet">
          <SocialIcon site={'paypal'} size={36} color={'black'}/>
        </Link>
      </Row>
      <Text style={footerText}>
        The email was sent to {email}. To no longer receive these emails, unsubscribe {' '}
        <Link href={unsubscribeUrl}>
          here
        </Link>
        .
      </Text>
    </Row>
  </Section>
}


export const PLATFORM_ICONS: {
  [key in Site]: (props: { className?: string }) => any
} = {
  site: LinkIcon,
  x: TbBrandX,
  discord: TbBrandDiscord,
  bluesky: TbBrandBluesky,
  mastodon: TbBrandMastodon,
  substack: LuBookmark,
  instagram: TbBrandInstagram,
  github: TbBrandGithub,
  linkedin: TbBrandLinkedin,
  facebook: TbBrandFacebook,
  spotify: TbBrandSpotify,
  patreon: TbBrandPatreon,
  paypal: TbBrandPaypal,
}

export const SocialIcon = (props: {
  site: string;
  className?: string;
  size?: number;
  color?: string;
}): React.ReactElement | null => {
  const {site, ...rest} = props
  const Icon = PLATFORM_ICONS[site as Site] || PLATFORM_ICONS.site

  return <Icon {...rest} />
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
  fontSize: '18px',
  lineHeight: '24px',
  margin: '10px 0',
  color: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
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
