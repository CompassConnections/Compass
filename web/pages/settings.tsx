import {useState} from 'react'
import {AboutSettings} from 'web/components/about-settings'
import {Col} from 'web/components/layout/col'
import {UncontrolledTabs} from 'web/components/layout/tabs'
import {NoSEO} from 'web/components/NoSEO'
import {NotificationSettings} from 'web/components/notifications'
import {PageBase} from 'web/components/page-base'
import {ProfileFormNav} from 'web/components/profile-form-nav'
import {GeneralSettings} from 'web/components/settings/general-settings'
import {Title} from 'web/components/widgets/title'
import {useRedirectIfSignedOut} from 'web/hooks/use-redirect-if-signed-out'
import {useT} from 'web/lib/locale'

/** The container the section index reads. See `SettingsCard`. */
export const SETTINGS_SECTIONS_ROOT = '[data-settings-sections]'

export default function SettingsPage() {
  const t = useT()
  useRedirectIfSignedOut()
  // Inactive tabs stay mounted (merely `hidden`), so the General tab's sections remain queryable
  // from every tab. Without this the index would sit beside Notifications listing sections that are
  // not on screen, and scroll to nothing when clicked.
  const [activeIndex, setActiveIndex] = useState(0)
  // `col-span-10` rather than the default 8: at 8 the page reserved two grid columns of empty space
  // on the right and then squeezed the section index out of the content column's width.
  return (
    <PageBase trackPageView={'settings page'} className={'col-span-10 mb-8'}>
      <NoSEO title={t('settings.title', 'Settings')} />
      {/* Same shell as the profile form: a content column capped at a readable width with the
          section index in the gutter from `xl` up, rather than the old `max-w-fit` column that
          collapsed to ~400px and left the rest of the page empty. */}
      <div className="mx-auto flex w-full max-w-5xl gap-10 px-4 py-2 sm:px-6">
        <Col className="w-full min-w-0 max-w-2xl">
          <Title>{t('settings.title', 'Settings')}</Title>
          <UncontrolledTabs
            name={'settings-page'}
            tabs={[
              {
                title: t('settings.tabs.general', 'General'),
                content: <GeneralSettings />,
              },
              {
                title: t('settings.tabs.notifications', 'Notifications'),
                content: <NotificationSettings />,
              },
              {
                title: t('settings.tabs.about', 'About'),
                content: <AboutSettings />,
              },
            ]}
            trackingName={'settings page'}
            onActiveIndexChange={setActiveIndex}
          />
        </Col>
        {/* `mt-36` drops the index level with the top of the first card, past the title and tab row. */}
        {activeIndex === 0 && (
          <ProfileFormNav
            root={SETTINGS_SECTIONS_ROOT}
            className="sticky top-8 mt-36 hidden h-fit w-48 shrink-0 xl:flex"
          />
        )}
      </div>
    </PageBase>
  )
}
