"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useSession} from "next-auth/react";
import ThemeToggle from "@/lib/client/theme";
import FavIcon from "@/components/FavIcon";

export default function Header() {
  const {data: session} = useSession();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640); // Tailwind's 'sm' breakpoint is 640px
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Clean up the event listener when the component unmounts
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fontStyle = "transition px-2 py-2 text-sm font-medium xs:text-xs"

  return (
    <header className="w-full
    {/*shadow-md*/}
     py-5 px-8 xs:px-4">
      <nav className="flex justify-between items-center">
        <Link
          href="/"
          className="text-4xl font-bold hover:text-blue-600 transition-colors flex items-center"
          aria-label={isSmallScreen ? "Home" : "Compass"}
        >
          <FavIcon className="dark:invert"/>
          {!isSmallScreen && (
            <span className="flex items-center gap-2">
              Compass
            </span>
          )}
        </Link>
        <div className="flex items-center space-x-3">

          <ThemeToggle/>

          <div className="flex items-center space-x-2">
            <Link
              href="/About"
              className={`${fontStyle} bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-500`}
            >
              About
            </Link>
          </div>
          {session ? (
            <>
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className={`${fontStyle} text-blue-600 dark:text-blue-100 hover:text-blue-800 dark:hover:text-blue-300`}
                >
                  My Profile
                </Link>
                {/*<Link*/}
                {/*  href="/profiles"*/}
                {/*  className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"*/}
                {/*>*/}
                {/*  Dashboard*/}
                {/*</Link>*/}
              </div>
            </>
          ) : (
            <>
              <Link href="/login"
                    className={`${fontStyle} bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-500`}>
                Sign In
              </Link>
              {/*<Link href="/register"
                    className={`${fontStyle} bg-blue-500 text-white rounded-full hover:bg-blue-600`}>
                Sign Up
              </Link> */}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
