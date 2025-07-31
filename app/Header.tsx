"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { FaHome } from "react-icons/fa";
import ThemeToggle from "@/lib/client/theme";

export default function Header() {
  const { data: session } = useSession();
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

  return (
    <header className="w-full
    {/*shadow-md*/}
     py-4 px-8">
      <nav className="flex justify-between items-center">
        <Link 
          href="/" 
          className="text-xl font-bold hover:text-blue-600 transition-colors flex items-center"
          aria-label={isSmallScreen ? "Home" : "BayesBond"}
        >
          {isSmallScreen ? <FaHome className="w-5 h-5" /> : 'BayesBond'}
        </Link>
        <div className="flex items-center space-x-4">

          <ThemeToggle/>
          {session ? (
            <>
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-blue-600 dark:text-blue-100 hover:text-blue-800 dark:hover:text-blue-300 px-3 py-2 text-sm font-medium"
                >
                  My Profile
                </Link>
                {/*<Link*/}
                {/*  href="/profiles"*/}
                {/*  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"*/}
                {/*>*/}
                {/*  Dashboard*/}
                {/*</Link>*/}
                <button
                  onClick={() => signOut({callbackUrl: "/"})}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                Sign In
              </Link>
              <Link href="/register"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
