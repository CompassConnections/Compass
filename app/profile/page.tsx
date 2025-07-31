'use client';

import Link from 'next/link';
import {useEffect, useState} from "react";
import LoadingSpinner from "@/lib/client/LoadingSpinner";
import {parseImage} from "@/lib/client/media";
import {usePathname} from "next/navigation";
import {getProfile} from "@/lib/client/profile";

export default function ProfilePage() {
  const pathname = usePathname(); // Get the current route
  const [userData, setUserData] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  try {
    useEffect(() => {
      async function fetchImage() {
        const res = await fetch('/api/profile');
        const data = await res.json();
        setUserData(data);
        console.log('userData', data);
        if (data?.image) {
          await parseImage(data.image, setImage);
        }
      }

      fetchImage();
    }, []);

    if (!userData) {
      return <LoadingSpinner/>;
    }

    console.log('userData', userData);

    const header = (
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium ">My Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">View and update your profile information</p>
        </div>
        <Link
          href={`/complete-profile?redirect=${encodeURIComponent(pathname)}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Edit Profile
        </Link>
      </div>
    )

    return (
      <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
        {getProfile(userData, image, header)}
      </div>
    )
      ;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return <div className="text-center py-10">Error loading profile. Please try again later.</div>;
  }
}
