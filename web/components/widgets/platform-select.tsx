import {PLATFORM_LABELS, SITE_ORDER} from 'common/socials'
import {SearchableSelect} from './searchable-select'
import {SocialIcon} from '../user/social'

const suggestions = SITE_ORDER.map((platform) => {
  return {
    id: platform,
    label: PLATFORM_LABELS[platform],
    icon: <SocialIcon site={platform} className="text-primary-700 h-4 w-4" />,
  }
})

export function PlatformSelect(props: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <SearchableSelect
      {...props}
      suggestions={suggestions}
      placeholder="Platform"
      allowCustom={true}
    />
  )
}
