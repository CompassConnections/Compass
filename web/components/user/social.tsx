import { LinkIcon } from '@heroicons/react/solid'
import { Site } from 'common/socials'
import { ReactNode } from 'react'
import { LuBookmark } from 'react-icons/lu'
import {
  TbBrandBluesky,
  TbBrandDiscord,
  TbBrandFacebook,
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandMastodon,
  // TbBrandOnlyfans,
  TbBrandSpotify,
  TbBrandX,
} from 'react-icons/tb'
import Foldy from 'web/public/manifold-logo.svg'

export const PLATFORM_ICONS: {
  [key in Site]: (props: { className?: string }) => ReactNode
} = {
  site: LinkIcon,
  x: TbBrandX,
  discord: TbBrandDiscord,
  bluesky: TbBrandBluesky,
  mastodon: TbBrandMastodon,
  substack: LuBookmark,
  // onlyfans: TbBrandOnlyfans,
  instagram: TbBrandInstagram,
  github: TbBrandGithub,
  linkedin: TbBrandLinkedin,
  facebook: TbBrandFacebook,
  spotify: TbBrandSpotify,
}

export const SocialIcon = (props: { site: string; className?: string }) => {
  const { site, ...rest } = props
  const Icon = PLATFORM_ICONS[site as Site] || PLATFORM_ICONS.site

  return <Icon {...rest} />
}
