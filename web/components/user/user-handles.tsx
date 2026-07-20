import clsx from 'clsx'
import {
  getSocialEntries,
  getSocialUrl,
  PLATFORM_LABELS,
  Site,
  SITE_ORDER,
  Socials,
} from 'common/socials'
import {sortBy} from 'lodash'

import {Row} from '../layout/row'
import {SocialIcon} from './social'

const LABELS_TO_RENDER = [
  'signal',
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
    getSocialEntries(links),
    ({platform}) => -[...SITE_ORDER].reverse().indexOf(platform as Site),
  )
    .filter(({platform, value}) => !!value && !!platform)
    .map(({platform, value, index}) => {
      let renderedLabel: string = LABELS_TO_RENDER.includes(platform)
        ? PLATFORM_LABELS[platform as Site]
        : value
      renderedLabel = renderedLabel?.replace(/\/+$/, '') // remove trailing slashes
      renderedLabel = renderedLabel?.replace(/^(https?:\/\/)?(www\.)?/, '') // remove protocol and www
      return {
        platform,
        label: renderedLabel,
        url: getSocialUrl(platform as any, value),
        key: `${platform}-${index}`,
      }
    })

  if (display.length === 0) {
    return null
  }

  return (
    <Row
      className={clsx('flex-wrap items-center gap-2', className)}
      data-testid="profile-social-media-accounts"
    >
      {display.map(({platform, label, url, key}) => (
        <a
          key={key}
          target="_blank"
          href={url}
          className="border-canvas-300 bg-canvas-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] text-ink-500 transition-colors hover:border-primary-300 hover:text-primary-600"
        >
          <SocialIcon site={platform as any} className="text-ink-500 h-[16px] w-[16px]" />
          <span>{label}</span>
        </a>
      ))}
    </Row>
  )
}
