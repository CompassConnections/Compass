import {LovePage} from 'web/components/love-page'
import {ReactNode} from "react";
import Link from "next/link";
import {discordLink, formLink, githubRepo, stoatLink} from "common/constants";


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
  return (
    <LovePage trackPageView={'about'}>
      <div className="text-gray-600 dark:text-white min-h-screen p-6">
        <div className="w-full">
          <div className="relative py-8 mb-8 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <h1 className="text-3xl font-bold mb-4 text-center">Why Choose Compass?</h1>
              <div className="flex flex-col md:flex-row items-center justify-center mb-8 gap-8">
                <div className="w-full text-center">
                  <h3 className="text-3xl mb-2">To find your people with ease.</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="et_pb_text_inner">
            <div className="max-w-3xl mx-auto mt-20 mb-8 ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AboutBlock
                  title="Keyword Search the Database"
                  text={`"Meditation", "Hiking", "Neuroscience", "Nietzsche". Access any profile and get niche.`}
                />

                <AboutBlock
                  title="Get Notified About Searches"
                  text="No need to constantly check the app! We'll contact you when new users fit your searches."
                />

                <AboutBlock
                  title="Free"
                  text="Subscription-free. Paywall-free. Ad-free."
                />

                <AboutBlock
                  title="Personality-Centered"
                  text="Values and interests first, photos are secondary."
                />

                <AboutBlock
                  title="Transparent"
                  text="Open source code and community designed."
                />

                <AboutBlock
                  title="Democratic"
                  text={<span
                    className="custom-link">Governed and <Link href="/vote">voted</Link> by the community, while ensuring no drift through our <Link
                    href="/constitution">constitution</Link>.</span>}
                />

                <AboutBlock
                  title='One Mission'
                  text='Our only mission is to create more genuine human connections, and every decision must serve that goal.'
                />

                <AboutBlock
                  title='Vision'
                  text='Compass is to human connection what Linux, Wikipedia, and Firefox are to software and knowledge: a public good built by the people who use it, for the benefit of everyone.'
                />
              </div>
            </div>
          </div>
          <div className="relative py-8 mt-12 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <h3 className="text-4xl font-bold text-center mt-8 mb-8">Help Compass</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="give-suggestions-or-contribute" className="font-bold mb-4 text-xl text-center">Give
                    Suggestions or Contribute</h5>
                  <p className="mb-4 text-center">Give suggestions or let us know you want to help through this
                    form!</p>
                  <a
                    href={formLink}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Suggest Here
                  </a>
                </div>
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="share" className="font-bold mb-4 text-xl text-center">Develop the App</h5>
                  <p className="mb-4 text-center">The full source code and instructions are available on GitHub.</p>
                  <a
                    href={githubRepo}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                    target="_blank" rel="noopener noreferrer">
                    View Code
                  </a>
                </div>
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="join-chats" className="font-bold mb-4 text-xl text-center">Join the Community</h5>
                  <p className="mb-4 text-center">Shape the product or chat with like-minded people.</p>
                  <div className="flex flex-col gap-4 w-full items-center">
                  <a
                    href={discordLink}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Join the Discord
                  </a>
                  <a
                    href={stoatLink}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Join on Stoat / Revolt
                  </a>
                  </div>
                </div>
                <div className="rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 id="donate" className="font-bold mb-4 text-xl text-center">Donate</h5>
                  <p className="mb-4 text-center custom-link"><Link href="/support">Support</Link> our not-for-profit
                    infrastructure.</p>
                  <div className="flex flex-col gap-4 w-full items-center">
                    <a
                      href="https://patreon.com/CompassMeet"
                      className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition text-center"
                      target="_blank" rel="noopener noreferrer"
                    >
                      Donate on Patreon
                    </a>
                    <a
                      href="https://www.paypal.com/paypalme/CompassConnections"
                      className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition text-center"
                      target="_blank" rel="noopener noreferrer"
                    >
                      Donate on PayPal
                    </a>
                    <a
                      href="https://ko-fi.com/compassconnections"
                      className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition text-center"
                      target="_blank" rel="noopener noreferrer"
                    >
                      Donate on Ko-fi
                    </a>
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
                  <h5 id="github-repo" className="font-bold mb-4 text-xl text-center">Tell Your Friends and Family</h5>
                  <p className="mb-4 text-center">Thank you for supporting our mission!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LovePage>
  )
}
