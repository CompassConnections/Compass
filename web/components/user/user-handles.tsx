import clsx from 'clsx'
import {getSocialUrl, PLATFORM_LABELS, Site, SITE_ORDER, Socials} from 'common/socials'
import {sortBy} from 'lodash'

import {Row} from '../layout/row'
import {SocialIcon} from './social'

const LABELS_TO_RENDER = [
  'okcupid',
  'calendly',
  'datingdoc',
  'friendshipdoc',
  'connectiondoc',
  'workdoc',
]

export function UserHandles(props: {links: Socials; className?: string}) {
  const {links, className} = props

  const display = sortBy(
    Object.entries(links),
    ([platform]) => -[...SITE_ORDER].reverse().indexOf(platform as Site),
  ).map(([platform, label]) => {
    let renderedLabel: string = LABELS_TO_RENDER.includes(platform)
      ? PLATFORM_LABELS[platform as Site]
      : label
    renderedLabel = renderedLabel?.replace(/\/+$/, '') // remove trailing slashes
    renderedLabel = renderedLabel?.replace(/^(https?:\/\/)?(www\.)?/, '') // remove protocol and www
    return {
      platform,
      label: renderedLabel,
      url: getSocialUrl(platform as any, label),
    }
  })

  if (display.length === 0) {
    return null
  }

  return (
    <Row
      className={clsx('text-ink-400 flex-wrap items-center gap-2 sm:gap-x-4', className)}
      data-testid="profile-social-media-accounts"
    >
      {display.map(({platform, label, url}) => (
        <a key={platform} target="_blank" href={url}>
          <Row className="items-center gap-1">
            <SocialIcon site={platform as any} className="text-primary-900 h-4 w-4" />
            <span className="text-primary-700 text-sm hover:text-primary-500">{label}</span>
          </Row>
        </a>
      ))}
    </Row>
  )
}
