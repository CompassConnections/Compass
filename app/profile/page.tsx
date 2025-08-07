'use client';

import Link from 'next/link';
import {usePathname, useRouter} from "next/navigation";
import {Profile} from "@/lib/client/profile";
import {useEffect} from "react";
import {signOut, useSession} from "next-auth/react";

export default function ProfilePage() {
  const pathname = usePathname(); // Get the current route
  const router = useRouter();
  const {data: session} = useSession();

  useEffect(() => {
    async function asyncRun() {
      if (!session?.user?.id)
        router.push('/login');
    }

    asyncRun();
  }, []);

  try {

    const header = (
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium ">My Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">View and update your profile information</p>
        </div>
        <Link
          href={`/complete-profile?redirect=${encodeURIComponent(pathname)}`}
          className="mx-1 transition px-2 py-2 text-sm font-medium xs:text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 min-w-20"
        >
          Edit Profile
        </Link>
        <button
          onClick={() => signOut({callbackUrl: "/"})}
          className="mx-1 transition px-2 py-2 text-sm font-medium xs:text-xs bg-red-500 text-white rounded-full hover:bg-red-600 min-w-20"
        >
          Sign Out
        </button>
      </div>
    )

    return (
      <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
        {Profile('/api/profile', header)}
      </div>
    )
      ;
  } catch
    (error) {
    console.error('Error fetching user data:', error);
    return <div className="text-center py-10">Error loading profile. Please try again later.</div>;
  }
}
