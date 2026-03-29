import {PlusIcon, XMarkIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {ProfileWithoutUser} from 'common/profiles/profile'
import {PLATFORM_LABELS, type Site, SITE_ORDER, Socials} from 'common/socials'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {Fragment, useState} from 'react'
import {Button, IconButton} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Input} from 'web/components/widgets/input'
import {PlatformSelect} from 'web/components/widgets/platform-select'
import {useT} from 'web/lib/locale'

import {SocialIcon} from './user/social'

interface SocialLinksSectionProps {
  profile: ProfileWithoutUser
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void
}

export function SocialLinksSection({profile, setProfile}: SocialLinksSectionProps) {
  const t = useT()
  const [newLinkPlatform, setNewLinkPlatform] = useState('')
  const [newLinkValue, setNewLinkValue] = useState('')

  const updateUserLink = (platform: string, value: string | null) => {
    setProfile(
      'links',
      removeNullOrUndefinedProps({...((profile.links as Socials) ?? {}), [platform]: value}),
    )
  }

  const addNewLink = () => {
    if (newLinkPlatform && newLinkValue) {
      updateUserLink(newLinkPlatform.toLowerCase().trim(), newLinkValue.trim())
      setNewLinkPlatform('')
      setNewLinkValue('')
    }
  }

  return (
    <Col className={clsx('pb-4')}>
      <div className="grid w-full grid-cols-[8rem_1fr_auto] gap-2">
        {Object.entries((profile.links ?? {}) as Socials)
          .filter(([_, value]) => value != null)
          .map(([platform, value]) => (
            <Fragment key={platform}>
              <div className="col-span-3 mt-2 flex items-center gap-2 self-center sm:col-span-1">
                <SocialIcon site={platform as any} className="text-primary-700 h-4 w-4" />
                {PLATFORM_LABELS[platform as Site] ?? platform}
              </div>
              <Input
                type="text"
                value={value!}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateUserLink(platform, e.target.value)
                }
                className="col-span-2 sm:col-span-1"
              />
              <IconButton onClick={() => updateUserLink(platform, null)}>
                <XMarkIcon className="h-6 w-6" />
                <div className="sr-only">{t('common.remove', 'Remove')}</div>
              </IconButton>
            </Fragment>
          ))}

        {/* Spacer */}
        <div className="col-span-3 h-4" />

        <PlatformSelect
          value={newLinkPlatform}
          onChange={setNewLinkPlatform}
          className="h-full !w-full"
        />
        <Input
          type="text"
          placeholder={
            SITE_ORDER.includes(newLinkPlatform as any) && newLinkPlatform != 'site'
              ? t('profile.optional.username_or_url', 'Username or URL')
              : t('profile.optional.site_url', 'Site URL')
          }
          value={newLinkValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLinkValue(e.target.value)}
          // disable password managers
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore="true"
          data-protonpass-ignore="true"
          className="w-full"
        />
        <Button
          color="gray-outline"
          onClick={addNewLink}
          disabled={!newLinkPlatform || !newLinkValue}
        >
          <PlusIcon className="h-6 w-6" />
          <div className="sr-only">{t('common.add', 'Add')}</div>
        </Button>
      </div>
    </Col>
  )
}
