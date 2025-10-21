import {PageBase} from 'web/components/page-base'
import {discordLink, githubRepo, redditLink, stoatLink, supportEmail, xLink} from "common/constants";
import {GeneralButton} from "web/components/buttons/general-button";
import clsx from "clsx";
import {Col} from "web/components/layout/col";
import {SEO} from "web/components/SEO";



export default function Social() {
  return (
    <PageBase trackPageView={'social'}>
      <SEO
        title={'Socials'}
        description={'Socials'}
        url={`/social`}
      />
      <h3 className="text-4xl font-bold text-center mt-8 mb-8">Socials</h3>
      <Col
        className={clsx(
          'pb-[58px] lg:pb-0', // bottom bar padding
          'text-ink-1000 mx-auto w-full grid grid-cols-1 gap-8 max-w-3xl sm:grid-cols-2 lg:min-h-0 lg:pt-4 mt-4',
        )}
      >
        <GeneralButton url={discordLink} content={'Discord'}/>
        <GeneralButton url={stoatLink} content={'Revolt / Stoat'}/>
        <GeneralButton url={redditLink} content={'Reddit'}/>
        <GeneralButton url={githubRepo} content={'GitHub'}/>
        <GeneralButton url={xLink} content={'X'}/>
        <GeneralButton url={`mailto:${supportEmail}`} content={`${supportEmail}`}/>
      </Col>
    </PageBase>
  )
}
