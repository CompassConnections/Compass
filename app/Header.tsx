"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full bg-white shadow-md py-4 px-8">
      <nav className="flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
          BayesBond
        </Link>
        <div className="flex items-center space-x-4">
          <Link 
            href="/posts" 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Posts
          </Link>
          {session ? (
            <>
              <Link 
                href="/posts/new" 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                New Post
              </Link>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {session.user?.name && <div>{session.user.name}</div>}
                  <div>{session.user?.email}</div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
