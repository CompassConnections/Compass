import {useEffect, useState} from "react"
import axios from "axios"
import {PageBase} from "web/components/page-base"
import {SEO} from "web/components/SEO"
import {Col} from "web/components/layout/col"
import {Title} from "web/components/widgets/title"
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator"
import {githubRepoSlug} from "common/constants";
import {CustomMarkdown} from "web/components/markdown";
import {CustomLink} from "web/components/links";

type Release = {
  id: number
  name: string
  tag_name: string
  body: string
  published_at: string
  html_url: string
}

export default function WhatsNew() {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReleases() {
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${githubRepoSlug}/releases`,
          {
            headers: {
              // Optional: if hitting rate limits, use a GitHub token
              // Authorization: `token ${process.env.REACT_APP_GITHUB_TOKEN}`
            },
          }
        )
        setReleases(response.data)
      } catch (err) {
        setError("Failed to fetch releases")
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [])

  return (
    <PageBase trackPageView={'news'} className={'mx-4'}>
      <SEO
        title={"What's new"}
        description={'All news and code updates'}
        url={`/news`}
      />
      <Title className="text-3xl">What's New</Title>
      {loading ? <CompassLoadingIndicator/> :
        error ? <p>{error}</p> :
          <Col className="max-w-3xl mx-auto py-10 px-4 custom-link">
            {releases.map((release: Release) => (
              <div key={release.id} className="mb-10 border-b pb-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{release.name || release.tag_name}</h2>
                  <span className="text-sm text-gray-500">
                    {new Date(release.published_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 mb-4 prose prose-neutral dark:prose-invert text-ink-1000">
                  <CustomMarkdown>
                    {formatPullLinks(release.body || "_No release notes provided._")}
                  </CustomMarkdown>
                </div>
                <CustomLink href={release.html_url}>View on GitHub</CustomLink>
              </div>
            ))}
          </Col>
      }
    </PageBase>
  )
}

function formatPullLinks(text = "") {
  return text
    .replace('CompassMeet', 'CompassConnections')
    .replace(
      /https:\/\/github\.com\/CompassConnections\/Compass\/pull\/(\d+)/g,
      (_, num) => `[#${num}](https://github.com/CompassConnections/Compass/pull/${num})`)
    .replace(
      /\**Full Changelog\**: https:\/\/github\.com\/CompassConnections\/Compass\/compare\/([\w.-]+\.\.\.[\w.-]+)/g,
      '')
}

