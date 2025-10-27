import {PageBase} from "web/components/page-base"
import {SEO} from "web/components/SEO"
import {Col} from "web/components/layout/col"
import {Title} from "web/components/widgets/title"
import {githubRepoSlug} from "common/constants";
import {CustomMarkdown} from "web/components/markdown";
import {CustomLink} from "web/components/links";

// Use SSR for SEO and better performance / caching
export async function getStaticProps() {
  const releases = await fetch(`https://api.github.com/repos/${githubRepoSlug}/releases`)
    .then(r => r.json())
    .catch(e => {
      console.error("Failed to fetch releases", e)
      return []
    })

  return {
    props: {releases},
    revalidate: 3600, // refresh every hour
  };
}


type Release = {
  id: number
  name: string
  tag_name: string
  body: string
  published_at: string
  html_url: string
}

export default function WhatsNew(props: { releases: Release[] }) {
  const {releases} = props

  return (
    <PageBase trackPageView={'news'} className={'mx-4'}>
      <SEO
        title={"What's new"}
        description={'All news and code updates'}
        url={`/news`}
      />
      <Title className="text-3xl">What's New</Title>
      {!releases.length ? <p>Failed to fetch releases.</p> :
        <Col className="max-w-3xl mx-auto py-10 px-4 custom-link">
          {releases.map((release: Release) => (
            <div key={release.id} className="mb-10 border-b pb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{release.name || release.tag_name}</h2>
                <span className="text-sm text-gray-500">
                    {new Date(release.published_at).toISOString().split('T')[0]}
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

