import {PageBase} from 'web/components/page-base'
import {ReactNode} from "react";
import Link from "next/link";
import {discordLink, formLink, githubRepo} from "common/constants";
import {SEO} from "web/components/SEO";
import {useT} from "web/lib/locale";


export const AboutBlock = (props: {
  text: ReactNode
  title: string
}) => {
  const {text, title} = props
  return <section className="mb-12">
    <h2 className="text-3xl font-bold mb-4">{title}</h2>
    <p className="text-lg">{text}</p>
  </section>;
}

export default function About() {
  const t = useT()
  return (
    <PageBase trackPageView={'about'}>
      <SEO
        title={t('about.seo.title', 'About')}
        description={t('about.seo.description', 'About Compass')}
        url={`/about`}
      />
      <div className="text-gray-600 dark:text-white min-h-screen p-6">
        <div className="w-full">
          <div className="relative py-8 mb-8 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <h1 className="text-3xl font-bold mb-4 text-center">{t('about.title', 'Why Choose Compass?')}</h1>
              <div className="flex flex-col md:flex-row items-center justify-center mb-8 gap-8">
                <div className="w-full text-center">
                  <h3 className="text-3xl mb-2">{t('about.subtitle', 'To find your people with ease.')}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="et_pb_text_inner">
            <div className="max-w-3xl mx-auto mt-20 mb-8 ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AboutBlock
                  title={t('about.block.keyword.title', 'Keyword Search the Database')}
                  text={t('about.block.keyword.text', '"Meditation", "Hiking", "Neuroscience", "Nietzsche". Access any profile and get niche.')}
                />

                <AboutBlock
                  title={t('about.block.notify.title', 'Get Notified About Searches')}
                  text={t('about.block.notify.text', "No need to constantly check the app! We'll contact you when new users fit your searches.")}
                />

                <AboutBlock
                  title={t('about.block.free.title', 'Free')}
                  text={t('about.block.free.text', 'Subscription-free. Paywall-free. Ad-free.')}
                />

                <AboutBlock
                  title={t('about.block.personality.title', 'Personality-Centered')}
                  text={t('about.block.personality.text', 'Values and interests first, photos are secondary.')}
                />

                <AboutBlock
                  title={t('about.block.transparent.title', 'Transparent')}
                  text={t('about.block.transparent.text', 'Open source code and community designed.')}
                />

                <AboutBlock
                  title={t('about.block.democratic.title', 'Democratic')}
                  text={<span className="custom-link">
                    {t('about.block.democratic.prefix', 'Governed and ')}
                    <Link href="/vote">{t('about.block.democratic.link_voted', 'voted')}</Link>
                    {t('about.block.democratic.middle', ' by the community, while ensuring no drift through our ')}
                    <Link href="/constitution">{t('about.block.democratic.link_constitution', 'constitution')}</Link>
                    {t('about.block.democratic.suffix', '.')}
                  </span>}
                />

                <AboutBlock
                  title={t('about.block.mission.title', 'One Mission')}
                  text={t('about.block.mission.text', "Our only mission is to create more genuine human connections, and every decision must serve that goal.")}
                />

                <AboutBlock
                  title={t('about.block.vision.title', 'Vision')}
                  text={t('about.block.vision.text', 'Compass is to human connection what Linux, Wikipedia, and Firefox are to software and knowledge: a public good built by the people who use it, for the benefit of everyone.')}
                />

                <AboutBlock
                  title={t('about.block.press.title', 'Press')}
                  text={<span className="custom-link">
                    {t('about.block.press.text', 'Explore the latest press stories ')}
                    <Link href="/press">{t('about.block.press.link', 'here')}</Link>.
                </span>}
                />
              </div>
            </div>
          </div>
          <div className="relative py-8 mt-12 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <h3 className="text-4xl font-bold text-center mt-8 mb-8">{t('about.help.title', 'Help Compass')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="give-suggestions-or-contribute"
                      className="font-bold mb-4 text-xl text-center">{t('about.suggestions.title', 'Give Suggestions or Contribute')}</h5>
                  <p
                    className="mb-4 text-center">{t('about.suggestions.text', 'Give suggestions or let us know you want to help through this form!')}</p>
                  <a
                    href={formLink}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {t('about.suggestions.button', 'Suggest Here')}
                  </a>
                </div>
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="share"
                      className="font-bold mb-4 text-xl text-center">{t('about.dev.title', 'Develop the App')}</h5>
                  <p
                    className="mb-4 text-center">{t('about.dev.text', 'The full source code and instructions are available on GitHub.')}</p>
                  <a
                    href={githubRepo}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                    target="_blank" rel="noopener noreferrer">
                    {t('about.dev.button', 'View Code')}
                  </a>
                </div>
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="join-chats"
                      className="font-bold mb-4 text-xl text-center">{t('about.join.title', 'Join the Community')}</h5>
                  <p className="mb-4 text-center">{t('about.join.text', "Let's shape the platform together.")}</p>
                  <div className="flex flex-col gap-4 w-full items-center">
                    <a
                      href={discordLink}
                      className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                      target="_blank" rel="noopener noreferrer"
                    >
                      {t('about.join.button', 'Join the Discord')}
                    </a>
                    {/*<a*/}
                    {/*  href={stoatLink}*/}
                    {/*  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"*/}
                    {/*  target="_blank" rel="noopener noreferrer"*/}
                    {/*>*/}
                    {/*  Join on Stoat / Revolt*/}
                    {/*</a>*/}
                  </div>
                </div>
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="donate"
                      className="font-bold mb-4 text-xl text-center">{t('about.donate.title', 'Donate')}</h5>
                  <p
                    className="mb-4 text-center custom-link">{t('about.donate.text', 'Support our not-for-profit infrastructure.')}</p>
                  <div className="flex flex-col gap-4 w-full items-center">
                    <Link
                      href="/support"
                      className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition text-center"
                    >
                      {t('about.donate.button', 'Donation Options')}
                    </Link>
                    {/*<a*/}
                    {/*  href="https://patreon.com/CompassMeet"*/}
                    {/*  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition text-center"*/}
                    {/*  target="_blank" rel="noopener noreferrer"*/}
                    {/*>*/}
                    {/*  Donate on Patreon*/}
                    {/*</a>*/}
                    {/*<a*/}
                    {/*  href="https://www.paypal.com/paypalme/CompassConnections"*/}
                    {/*  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition text-center"*/}
                    {/*  target="_blank" rel="noopener noreferrer"*/}
                    {/*>*/}
                    {/*  Donate on PayPal*/}
                    {/*</a>*/}
                    {/*<a*/}
                    {/*  href="https://ko-fi.com/compassconnections"*/}
                    {/*  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition text-center"*/}
                    {/*  target="_blank" rel="noopener noreferrer"*/}
                    {/*>*/}
                    {/*  Donate on Ko-fi*/}
                    {/*</a>*/}
                    {/*<a*/}
                    {/*  href="https://github.com/sponsors/CompassConnections"*/}
                    {/*  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition w-full text-center"*/}
                    {/*  target="_blank" rel="noopener noreferrer"*/}
                    {/*>*/}
                    {/*  Donate on GitHub*/}
                    {/*</a>*/}
                    {/*<span className="text-sm text-gray-400 mt-2 text-center block">*/}
                    {/*GitHub has increased transparency,<br/>but requires an account.*/}
                    {/*</span>*/}
                  </div>
                </div>
                <div className="rounded-xl shadow p-6 flex flex-col items-center md:col-span-2">
                  <h5 id="github-repo"
                      className="font-bold mb-4 text-xl text-center">{t('about.final.title', 'Tell Your Friends and Family')}</h5>
                  <p className="mb-4 text-center">{t('about.final.text', 'Thank you for supporting our mission!')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageBase>
  )
}
