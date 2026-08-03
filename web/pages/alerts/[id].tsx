import {FilterFields} from 'common/filters'
import {formatFilters, locationType} from 'common/filters-format'
import {useRouter} from 'next/router'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NoSEO} from 'web/components/NoSEO'
import {PageBase} from 'web/components/page-base'
import {ProfilePreview} from 'web/components/profile-grid'
import {Title} from 'web/components/widgets/title'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useChoicesContext} from 'web/hooks/use-choices'
import {useGetter} from 'web/hooks/use-getter'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {getStars} from 'web/lib/supabase/stars'

/**
 * The people one saved-search alert was about.
 *
 * Not a search results page: it shows the exact set the alert named, recorded when it was sent.
 * Re-running the search here would put a newly-matching member somewhere inside every older result
 * and would silently lose anyone who was *edited* into matching, which is half of what an alert is.
 *
 * A one-person alert never reaches this page — the notification links straight to the profile.
 */
export default function SearchAlertPage() {
  const router = useRouter()
  const t = useT()
  const user = useUser()
  const choicesIdsToLabels = useChoicesContext()
  const {measurementSystem} = useMeasurementSystem()

  const id = parseInt(String(router.query.id ?? ''))
  const {data, error} = useAPIGetter('get-search-alert', isNaN(id) ? undefined : {id})

  const {data: starredUsers, refresh: refreshStars} = useGetter('star', user?.id, getStars)
  const starredUserIds = starredUsers?.map((u: {id: string}) => u.id)

  if (error) {
    return (
      <PageBase trackPageView={'search alert'}>
        <NoSEO />
        <Col className={'mx-4 my-6 gap-2'}>
          <Title>{t('alerts.not_found_title', 'This alert is not available')}</Title>
          <p className={'text-ink-600'}>
            {t(
              'alerts.not_found_body',
              'It may belong to another account, or it may have been removed.',
            )}
          </p>
        </Col>
      </PageBase>
    )
  }

  const profiles = data?.profiles ?? []

  // What was searched, in the same words the saved-searches list uses.
  const descriptions = (data?.searches ?? []).map((search) =>
    [
      search.name,
      formatFilters(
        search.filters as Partial<FilterFields>,
        (search.location ?? null) as locationType,
        choicesIdsToLabels,
        measurementSystem,
        t,
      )?.join(' • '),
    ]
      .filter(Boolean)
      .join(' — '),
  )

  return (
    <PageBase trackPageView={'search alert'}>
      <NoSEO />

      <Col className={'mx-4 my-6 gap-4'}>
        <Col className={'gap-1'}>
          <Title>{t('alerts.title', 'New for your saved search', {count: profiles.length})}</Title>
          {descriptions.map((description, i) => (
            <div key={i} className={'text-ink-500 text-sm'}>
              {description}
            </div>
          ))}
        </Col>

        {/* Nothing left to show is a real outcome, not an error: profiles can be deleted or hidden
            between the alert going out and it being opened. */}
        {data && !profiles.length && (
          <p className={'text-ink-600'}>
            {t(
              'alerts.all_gone',
              'The profiles in this alert are no longer available. They may have been removed since it was sent.',
            )}
          </p>
        )}

        <Row className={'flex-wrap items-start gap-4'}>
          {profiles.map((profile) => (
            <div key={profile.id} className={'w-full sm:w-80'}>
              <ProfilePreview
                profile={profile}
                compatibilityScore={undefined}
                hasStar={starredUserIds?.includes(profile.user_id) ?? false}
                refreshStars={refreshStars}
              />
            </div>
          ))}
        </Row>

        {!!data?.goneCount && (
          <div className={'text-ink-500 text-sm'}>
            {t(
              'alerts.gone_count',
              '{count} more were in this alert but are no longer available.',
              {count: data.goneCount},
            )}
          </div>
        )}
      </Col>
    </PageBase>
  )
}
