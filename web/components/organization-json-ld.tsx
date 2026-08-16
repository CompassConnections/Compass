import {
  discordLink,
  githubRepo,
  instagramLink,
  mastodonLink,
  OG_DESCRIPTION,
  redditLink,
  supportEmail,
  xLink,
} from 'common/constants'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {PNG_LOGO} from 'common/hosting/constants'
import Head from 'next/head'
import {JsonLd} from 'web/components/json-ld'

/**
 * Who Compass is, as structured data, on the home page.
 *
 * This replaces the `Organization` node that used to live on `/testimonials` carrying an
 * `aggregateRating` and a list of member reviews. That version could never have produced the star
 * ratings it was written for: Google's review-snippet policy excludes **self-serving reviews** —
 * reviews about an entity, hosted on that entity's own site — and reviews of Compass on
 * compassmeet.com are exactly that. Star ratings in search come from third-party review sites.
 *
 * What an `Organization` node *is* good for is entity resolution — telling Google that the thing
 * called "Compass" at this domain is the same thing as the GitHub org, the Discord, the Mastodon
 * account, and so on. `sameAs` is the field that does that work, and it feeds the knowledge panel.
 * That is a permitted, useful use, so the node stays; only the part that was never eligible is gone.
 *
 * On the home page rather than anywhere else because this describes the site as a whole, and the
 * home page is the URL Google treats as the entity's canonical home.
 *
 * Hardcoded to the deployed URL rather than the current origin, for the same reason `PNG_LOGO` is:
 * structured data emitted from a preview deployment should still describe the real site, not the
 * preview.
 */
export function OrganizationJsonLd() {
  return (
    <Head>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Compass',
          url: DEPLOYED_WEB_URL,
          logo: PNG_LOGO,
          description: OG_DESCRIPTION,
          email: supportEmail,
          // The accounts that are demonstrably the same entity. Deliberately not the donation links
          // (Patreon, OpenCollective, Liberapay) — `sameAs` is for identity, and a funding page is a
          // place to pay us rather than another profile of us.
          sameAs: [githubRepo, discordLink, redditLink, xLink, instagramLink, mastodonLink],
        }}
      />
    </Head>
  )
}
