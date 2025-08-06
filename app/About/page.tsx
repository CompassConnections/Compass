'use client';

import Link from "next/link";
import {aColor} from "@/lib/client/constants";
import {useEffect, useState} from "react";

export default function About() {

  const [totalUsers, setTotalUsers] = useState<number>(0);
  useEffect(() => {
    const getCount = async () => {
      const countResponse = await fetch('/api/profiles/count');
      if (countResponse.ok) {
        const {count} = await countResponse.json();
        setTotalUsers(count);
      }
    };

    getCount();
  }, []); // <- runs once after initial mount
  return (
    <div className="text-gray-600 dark:text-white min-h-screen p-6">
      {aColor}
      <div className="w-full">
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 dark:bg-gray-800 py-8 mb-8 overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-4 text-center">Why Choose Compass?</h1>
            <div className="flex flex-col md:flex-row items-center justify-center mb-8 gap-8">
              <div className="w-40 h-40 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/favicon.ico" alt="Compass logo" className="w-full h-full object-cover" />
              </div>
              <div className="w-full max-w-2xl mx-auto text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Built for users, by users.</h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Open, transparent, and truly user-first. No paywalls, no addictive algorithms, no venture capital. Just real people, real values, and real connections.</p>
              </div>
            </div>
            <div className="flex justify-center mb-8">
              <Link
                href="/register"
                className="px-8 py-3 text-white text-lg rounded-full font-bold shadow transition bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
        <div className="et_pb_text_inner">
          <div className="max-w-3xl mx-auto mt-8 mb-8">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Search EXACTLY What You're Looking For</h2>
              <p className="text-lg text-gray-500">Keyword search from our entire database. Meet your introverted rock climbing dream bae who's also into Magic the Gathering and cats. ME-OW!</p>
            </section>
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Get Notified About Your Searches</h2>
              <p className="text-lg text-gray-500">When someone joins and meets your search criteria, get notified!</p>
              <p className="text-lg text-gray-500">Goodbye swipe addiction. Hello precious time!</p>
            </section>
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Everything is free. Seriously.</h2>
              <p className="text-lg text-gray-500">No subscriptions. No paywalls. We're designed by regular people who were fed up by inaccessible and extractive dating apps.</p>
            </section>
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Character is Hot</h2>
              <p className="text-lg text-gray-500">Personality first, pictures last. Instead of swiping on people based on how hot that six pack looks, let's focus on how he saved that cat from a tree.</p>
            </section>
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Fully Transparent</h2>
              <p className="text-lg text-gray-500">You're in the know. Our code is open source, there are clear policies, absolutely no data-selling, and we are community designed.</p>
            </section>
          </div>
        </div>
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 dark:bg-gray-800 py-8 mt-12 overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <h3 className="text-4xl font-bold text-center mt-8 mb-8">Help Improve Compass</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center">
                <h5 id="give-suggestions-or-contribute" className="font-bold mb-4 text-xl text-center">Give Suggestions or Contribute</h5>
                <p className="mb-4 text-center">Give suggestions or let us know you want to help through this form!</p>
                <a
                  href="https://forms.gle/tKnXUMAbEreMK6FC6"
                  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                  target="_blank" rel="noopener noreferrer"
                >
                  Suggest Here
                </a>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center">
                <h5 id="join-chats" className="font-bold mb-4 text-xl text-center">Join Chats</h5>
                <p className="mb-4 text-center">Join the community to shape the product—or just chat with like-minded people.</p>
                <a
                  href="https://discord.gg/8Vd7jzqjun"
                  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                  target="_blank" rel="noopener noreferrer"
                >
                  Join the Discord
                </a>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center">
                <h5 id="share" className="font-bold mb-4 text-xl text-center">Tell Your Friends and Family</h5>
                <p className="mb-4 text-center">We're a new app, and the more people who use it, the more useful it is!</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center">
                <h5 id="donate" className="font-bold mb-4 text-xl text-center">Donate</h5>
                <p className="mb-4 text-center">We're not-for-profit with no paywalls for the best user experience. Support the infrastructure. (GitHub has increased transparency, but requires an account).</p>
                <div className="flex flex-col gap-4 w-full items-center">
                  <a
                    href="https://www.paypal.com/paypalme/MartinBraquet"
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition w-full text-center"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Donate on PayPal
                  </a>
                  <a
                    href="https://github.com/sponsors/MartinBraquet"
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition w-full text-center"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Donate on GitHub
                  </a>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center md:col-span-2">
                <h5 id="github-repo" className="font-bold mb-4 text-xl text-center">Help Develop the App</h5>
                <p className="mb-4 text-center">The source code and instructions for development are available on GitHub.</p>
                <a
                  href="https://github.com/BayesBond/BayesBond"
                  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                  target="_blank" rel="noopener noreferrer"
                >
                  View Code
                </a>
              </div>
            </div>
            <div className="flex justify-center mt-12 mb-16">
              <Link
                href="/register"
                className="px-8 py-3 text-white text-lg rounded-full font-bold shadow transition bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950"
              >
                Join Compass
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
