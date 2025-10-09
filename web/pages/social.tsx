import {LovePage} from 'web/components/love-page'
import {discordLink, githubRepo, redditLink, stoatLink, xLink, supportEmail} from "common/constants";


export const Block = (props: {
  url: string
  content: string
}) => {
  const {url, content} = props
  return <div className="rounded-xl shadow p-6 flex flex-col items-center">
    <a
      href={url}
      className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
      target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  </div>;
}

export default function Social() {
  return (
    <LovePage trackPageView={'social'}>
      <div className="text-gray-600 dark:text-white min-h-screen p-6">
        <div className="w-full">
          <div className="relative py-8 mt-12 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <h3 className="text-4xl font-bold text-center mt-8 mb-8">Social</h3>
              <Block url={discordLink} content={'Discord'}/>
              <Block url={stoatLink} content={'Revolt / Stoat'}/>
              <Block url={redditLink} content={'Reddit'}/>
              <Block url={githubRepo} content={'GitHub'}/>
              <Block url={xLink} content={'X'}/>
              <Block url={`mailto:${supportEmail}`} content={`${supportEmail}`}/>
            </div>
          </div>
        </div>
      </div>
    </LovePage>
  )
}
