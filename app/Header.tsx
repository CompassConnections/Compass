"use client";

import Link from "next/link";
import {signOut, useSession} from "next-auth/react";
import ThemeToggle from "@/lib/client/theme";

export default function Header() {
  const {data: session} = useSession();

  console.log(session);

  return (
    <header className="w-full
    {/*shadow-md*/}
     py-4 px-8">
      <nav className="flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-blue-600 transition-colors hidden md:block">
          BayesBond
        </Link>
        <div className="flex items-center space-x-4">

          <ThemeToggle/>
          {session ? (
            <>
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium"
                >
                  My Profile
                </Link>
                <Link
                  href="/profiles"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Dashboard
                </Link>
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
