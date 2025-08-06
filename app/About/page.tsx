'use client';

import Link from "next/link";
import {aColor} from "@/lib/client/constants";

export default function About() {

  // const [totalUsers, setTotalUsers] = useState<number>(0);
  // useEffect(() => {
  //   const getCount = async () => {
  //     const countResponse = await fetch('/api/profiles/count');
  //     if (countResponse.ok) {
  //       const {count} = await countResponse.json();
  //       setTotalUsers(count);
  //     }
  //   };
  //
  //   getCount();
  // }, []); // <- runs once after initial mount
  return (
    <div className="text-gray-600 dark:text-white min-h-screen p-6">
      {aColor}
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold  mb-4 text-center">About Compass</h1>
        <div className="et_pb_text_inner">
          {/*<h1 id="abstract">Abstract</h1>*/}
          <p>Forming and maintaining close connections is fundamental for most people’s mental health—and hence overall
            well-being. However, currently available meeting platforms, lacking transparency and searchability, are
            deeply failing to bring together thoughtful people. This platform is designed to
            foster close friendships and relationships for people who prioritize learning, curiosity, and critical
            thinking. The directory of users is fully transparent and each profile contains extensive
            information, allowing searches over all users through powerful filtering and sorting methods. To prevent any
            value drift from this pro-social mission, the platform will always be free, ad-free, not for profit,
            donation-supported, open source, and democratically governed.</p>
          <div className="mt-8 flex space-x-4 justify-center">
            <Link
              href="/manifesto"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white text-lg rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition"
            >
              The Deeper Why
            </Link>
          </div>
          <h3 id="how-to-help">How to Help</h3>
          <h5 id="give-suggestions-or-contribute">Give Suggestions or Contribute</h5>
          <p>Give suggestions or let us know you want to help through this <a
            href="https://forms.gle/tKnXUMAbEreMK6FC6">form</a>!</p>
          <h5 id="join-chats">Join Chats</h5>
          <p>Join the community on <a
            href="https://discord.gg/8Vd7jzqjun">Discord</a> to shape and test the product—or just chat with
            like-minded people.</p>
          <h5 id="share">Share</h5>
          <p>Share the app and article with people who may benefit from the product.</p>
          <h5 id="donate">Donate</h5>
          <p>Donate to support the initial infrastructure via <a
            href="https://www.paypal.com/paypalme/MartinBraquet">PayPal</a> or <a
            href="https://github.com/sponsors/MartinBraquet">GitHub</a> (GitHub has increased transparency, but requires
            an account).</p>
          <h5 id="github-repo">Source Code</h5>
          <p>The source code and instructions for development are available on <a href="https://github.com/BayesBond/BayesBond">GitHub</a>.</p>
        </div>
        {/*<h3 id="how-to-help">Statistics</h3>*/}
        {/*<p>{totalUsers} total users</p>*/}
      </div>
    </div>
  );
}
