import {githubRepoSlug} from 'common/constants'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {CustomLink} from 'web/components/links'
import {CustomMarkdown} from 'web/components/markdown'
import {EnglishOnlyWarning} from 'web/components/news/english-only-warning'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useT} from 'web/lib/locale'
import {getPageData} from 'web/lib/util/page-data'
import {isNativeMobile} from 'web/lib/util/webview'

async function fetchReleases() {
  const releases = await fetch(`https://api.github.com/repos/${githubRepoSlug}/releases`)
    .then((r) => r.json())
    .catch((e) => {
      console.error('Failed to fetch releases', e)
      return []
    })
  return releases
}

// Use SSR for SEO and better performance / caching
export async function getStaticProps() {
  if (isNativeMobile()) {
    return {props: {}}
  }

  const releases = await fetchReleases()
  return {
    props: {releases},
    revalidate: 3600, // refresh every hour
  }
}

type Release = {
  id: number
  name: string
  tag_name: string
  body: string
  published_at: string
  html_url: string
}

export default function WhatsNew(props: {releases?: Release[]}) {
  const nativeMobile = isNativeMobile()
  const [fetchedProps, setFetchedProps] = useState(props)
  const [loading, setLoading] = useState(nativeMobile)
  const releases = fetchedProps.releases || []
  const t = useT()

  useEffect(() => {
    if (nativeMobile) {
      // Mobile/WebView scenario: fetch data dynamically from the remote web server (to benefit from SSR and ISR)
      async function load() {
        setLoading(true)
        try {
          const _props = await getPageData('news')
          setFetchedProps(_props)
        } catch (e) {
          console.error('Failed to fetch data for native mobile', e)
          setFetchedProps({releases: []})
        }
        setLoading(false)
      }

      load()
    } else {
      setFetchedProps(props)
    }
    // On web, props from SSR/ISR is already loaded
  }, [nativeMobile])

  return (
    <PageBase trackPageView={'news'} className={'mx-auto'}>
      <SEO
        title={t('news.title', "What's New")}
        description={
          releases.length
            ? `${t('news.seo.description', 'See the latest updates and features')}: ${releases[0].name}`
            : t('news.seo.description_general', 'All news and code updates for Compass')
        }
        url={`/news`}
      />
      <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-8 mb-10 text-center">
        <h1 className="font-cormorant text-5xl font-medium text-ink-900 mb-4">
          {t('news.title', "What's New")}
        </h1>
        <p className="text-ink-500 text-base max-w-xl mx-auto leading-relaxed">
          {t(
            'news.description',
            'Stay up to date with the latest features, improvements, and changes to Compass.',
          )}
        </p>
        {releases.length > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-ink-300 bg-canvas-100 border border-canvas-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {t('news.latest_version', 'Latest: {version}', {version: releases[0].tag_name})}
          </div>
        )}
      </div>
      {loading && <CompassLoadingIndicator />}
      {!loading && !releases.length ? (
        <p className="text-ink-500 text-center py-8">
          {t('news.failed', 'Failed to fetch releases.')}
        </p>
      ) : (
        <Col className="max-w-3xl mx-auto py-8 px-4 custom-link gap-6">
          <EnglishOnlyWarning />
          {releases.map((release: Release) => (
            <div
              key={release.id}
              className="bg-canvas-50 border border-canvas-200 rounded-xl p-6 transition-all hover:border-primary-300 hover:shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-cormorant text-2xl font-medium text-ink-900 leading-tight">
                  {release.name || release.tag_name}
                </h2>
                <span className="text-sm text-ink-300 font-mono whitespace-nowrap ml-4">
                  {new Date(release.published_at).toISOString().split('T')[0]}
                </span>
              </div>
              <div className="mb-5 prose prose-neutral dark:prose-invert text-ink-900">
                <CustomMarkdown>
                  {formatPullLinks(
                    release.body || t('news.no_release_notes', '_No release notes provided._'),
                  )}
                </CustomMarkdown>
              </div>
              <CustomLink
                href={release.html_url}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
              >
                {t('news.view_on_github', 'View on GitHub')}
              </CustomLink>
            </div>
          ))}
        </Col>
      )}
    </PageBase>
  )
}

function formatPullLinks(text = '') {
  return text
    .replace('CompassMeet', 'CompassConnections')
    .replace(
      /https:\/\/github\.com\/CompassConnections\/Compass\/pull\/(\d+)/g,
      (_, num) => `[#${num}](https://github.com/CompassConnections/Compass/pull/${num})`,
    )
    .replace(
      /\**Full Changelog\**: https:\/\/github\.com\/CompassConnections\/Compass\/compare\/([\w.-]+\.\.\.[\w.-]+)/g,
      '',
    )
}
