import {DocumentReportIcon, LinkIcon} from '@heroicons/react/solid'
import {Site} from 'common/socials'
import {ReactNode} from 'react'
import {LuBookmark, LuHandshake, LuHeart, LuUsers} from 'react-icons/lu'
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
  TbBrandX,
  TbCalendar,
} from 'react-icons/tb'

export const PLATFORM_ICONS: {
  [key in Site]: (props: { className?: string }) => ReactNode
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
  okcupid: LuHeart,
  datingdoc: LuHeart,
  friendshipdoc: LuUsers,
  workdoc: DocumentReportIcon,
  connectiondoc: LuHandshake,
  calendly: TbCalendar,
}

export const SocialIcon = (props: {
  site: string;
  className?: string;
  size?: number;
  color?: string;
}) => {
  const {site, ...rest} = props
  const Icon = PLATFORM_ICONS[site as Site] || PLATFORM_ICONS.site

  return <Icon {...rest} />
}
