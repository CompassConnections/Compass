'use client';

import Link from "next/link";
import {aColor} from "@/lib/client/constants";

export default function About() {

  return (
    <div className="text-gray-600 dark:text-white min-h-screen p-6">
      {aColor}
      <div className="w-full">
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 dark:bg-gray-800 py-8 mb-8 overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-4 text-center">Why Choose Compass?</h1>
            <div className="flex flex-col md:flex-row items-center justify-center mb-8 gap-8">
              <div className="w-full text-center">
                <h3 className="text-3xl font-bold mb-2">To find your people with ease.</h3>
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
          <div className="max-w-3xl mx-auto mt-20 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Keyword Search the Database</h2>
                <p className="text-lg text-gray-500">"Cats", "Hiking", "Introvert", "Rock Climbing".<br />Access any profile and get niche.</p>
              </section>
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Get Notified About Searches</h2>
                <p className="text-lg text-gray-500">No need to constantly check an app!</p>
              </section>
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Free</h2>
                <p className="text-lg text-gray-500">Subscription-free. Paywall-free. Ad-free.</p>
              </section>
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Personality-Centered</h2>
                <p className="text-lg text-gray-500">Values and interests first, photos are secondary.</p>
              </section>
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Transparent</h2>
                <p className="text-lg text-gray-500">Open source code and community designed.</p>
              </section>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8 mb-8">
          <Link
            href="/register"
            className="px-8 py-3 text-white text-lg rounded-full font-bold shadow transition bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950"
          >
            Get Started
          </Link>
        </div>
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-100 dark:bg-gray-800 py-8 mt-12 overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <h3 className="text-4xl font-bold text-center mt-8 mb-8">Help Compass</h3>
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
                <h5 id="join-chats" className="font-bold mb-4 text-xl text-center">Join the Community</h5>
                <p className="mb-4 text-center">Shape the product or chat with like-minded people.</p>
                <a
                  href="https://discord.gg/8Vd7jzqjun"
                  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                  target="_blank" rel="noopener noreferrer"
                >
                  Join the Discord
                </a>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center">
                <h5 id="share" className="font-bold mb-4 text-xl text-center">Develop the App</h5>
                <p className="mb-4 text-center">The source code and instructions are available on GitHub.</p>
                <a
                  href="https://github.com/BayesBond/BayesBond"
                  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                  target="_blank" rel="noopener noreferrer">
                  View Code
                </a>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center">
                <h5 id="donate" className="font-bold mb-4 text-xl text-center">Donate</h5>
                <p className="mb-4 text-center">Support our not-for-profit infrastructure.</p>
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
                  <span className="text-sm text-gray-400 mt-2 text-center block">
                    GitHub has increased transparency,<br />but requires an account.
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center md:col-span-2">
                <h5 id="github-repo" className="font-bold mb-4 text-xl text-center">Tell Your Friends and Family</h5>
                <p className="mb-4 text-center">Thank you for supporting us!</p>
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
