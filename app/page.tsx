'use client';

import ProfilePage from "@/app/profiles/page";
import Link from "next/link";
import React from 'react';  // ← Add this line here

export const dynamic = "force-dynamic"; // This disables SSG and ISR


export default function HomePage() {
  const profilePage = () => {
    return (
      <main className="min-h-screen flex flex-col">
        <ProfilePage/>
      </main>
    )
  }
  const fontStyle = "transition px-5 py-3 text-3xl font-medium xs:text-sm"

  
React.useEffect(() => {
  const text = "Search.";
  const typewriter = document.getElementById("typewriter");
  let i = 0;
  let timeoutId: any;
  let intervalId;
  
  // Clear any existing content
  if (typewriter) {
    typewriter.textContent = "";
  }
  
  function typeWriter() {
    if (i < text.length && typewriter) {
      typewriter.textContent = text.substring(0, i + 1);
      i++;
      timeoutId = setTimeout(typeWriter, 150);
    }
  }
  
  // Start typing after delay
  intervalId = setTimeout(() => {
    typeWriter();
  }, 500);
  
  // Cleanup function - this runs when component unmounts
  return () => {
    clearTimeout(timeoutId);
    clearTimeout(intervalId);
    if (typewriter) {
      typewriter.textContent = "Search."; // Just show the full text
    }
  };
}, []);
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      {/*<header className="flex justify-between items-center p-2 max-w-6xl mx-auto w-full">*/}
      {/*  <a */}
      {/*    href="https://github.com/BayesBond/BayesBond" */}
      {/*    target="_blank" */}
      {/*    rel="noopener noreferrer"*/}
      {/*    className="text-gray-700 hover: transition"*/}
      {/*  >*/}
      {/*    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">*/}
      {/*      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />*/}
      {/*    </svg>*/}
      {/*  </a>*/}
      {/*</header>*/}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-start flex-1 text-center px-4">
        <div className="h-20"></div>
        <h1 className="pt-48 pb-2 text-7xl md:text-8xl xs:text-6xl font-extrabold max-w-4xl leading-tight xl:whitespace-nowrap md:whitespace-nowrap ">
          Don't Swipe. <span id="typewriter"></span><span id="cursor" className="animate-pulse">|</span>
        </h1>
        {/*<p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl">*/}
        {/*  {"Tired of swiping? Search what you're looking for!"}*/}
        {/*</p>*/}
        {/* Spacer */}
        <div className="h-10"></div>
        <div className="py-18">
          <Link href="/register" className={`${fontStyle} bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full hover:from-red-700 hover:to-red-900`}>
            Join Compass
            
          </Link>
        {/* Spacer */}
        <div className="h-52"></div>
        </div>
        {/* Why Compass Bar */}
        <div className="w-full bg-gray-50 dark:bg-gray-900 py-16 mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Radically Transparent</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No algorithms. Every profile searchable.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Built for Depth</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Filter by any keyword and what matters most.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Community Owned</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Free forever. Built by users, for users.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Spacer */}
        <div className="h-20"></div>
        <div className=" w-full py-18">
          {profilePage()}
        </div>
      </section>
    </main>
  );
}

