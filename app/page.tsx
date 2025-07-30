'use client';

import ProfilePage from "@/app/profiles/page";

export const dynamic = "force-dynamic"; // This disables SSG and ISR

import Link from "next/link";


export default function HomePage() {
  const profilePage = () => {
    return (
      <main className="min-h-screen flex flex-col">
        <ProfilePage />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto w-full">
        <a 
          href="https://github.com/BayesBond/BayesBond" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-700 hover: transition"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </a>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold max-w-3xl leading-tight">
          BayesBond
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl">
          The bonding platform for rational thinkers
        </p>
        <div className="mt-8 flex space-x-4">
          <Link
            href="/learn-more"
            className="px-6 py-3 bg-gray-200 text-gray-800 text-lg rounded-lg hover:bg-gray-300 transition"
          >
            Learn More
          </Link>
        </div>
        <div>
          {profilePage()}
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500">
        <div className="mb-2">
          <a 
            href="https://github.com/BayesBond/BayesBond" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>
        <div>© {new Date().getFullYear()} BayesBond. All rights reserved.</div>
      </footer>
    </main>
  );
}

