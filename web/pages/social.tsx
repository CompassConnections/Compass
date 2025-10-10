import {LovePage} from 'web/components/love-page'
import {discordLink, githubRepo, redditLink, stoatLink, supportEmail, xLink} from "common/constants";
import {GeneralButton} from "web/components/buttons/general-button";


export default function Social() {
  return (
    <LovePage trackPageView={'social'}>
      <div className="text-gray-600 dark:text-white min-h-screen p-6">
        <div className="w-full">
          <div className="relative py-8 mt-12 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <h3 className="text-4xl font-bold text-center mt-8 mb-8">Social</h3>
              <GeneralButton url={discordLink} content={'Discord'}/>
              <GeneralButton url={stoatLink} content={'Revolt / Stoat'}/>
              <GeneralButton url={redditLink} content={'Reddit'}/>
              <GeneralButton url={githubRepo} content={'GitHub'}/>
              <GeneralButton url={xLink} content={'X'}/>
              <GeneralButton url={`mailto:${supportEmail}`} content={`${supportEmail}`}/>
            </div>
          </div>
        </div>
      </div>
    </LovePage>
  )
}
